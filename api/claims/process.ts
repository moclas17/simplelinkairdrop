import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import db from '../../lib/db';
import { getRpcUrl, getExplorerUrl } from '../../lib/networks';

const PRIVATE_KEY = process.env.PRIVATE_KEY;

export default async function handler(req: NextRequest) {
  console.log('[CLAIM] Request received:', {
    method: req.method,
    headers: {
      'content-type': req.headers.get('content-type')
    }
  });

  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { wallet: userWalletInput, linkId } = body;
    
    console.log('[CLAIM] Parsed request:', { userWalletInput, linkId });
    
    if (!userWalletInput || !linkId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    
    // Resolve ENS names to addresses or validate address
    let userWallet: string;
    try {
      if (userWalletInput.endsWith('.eth')) {
        console.log('[CLAIM] Resolving ENS name:', userWalletInput);
        
        const ensProvider = new ethers.JsonRpcProvider('https://lb.drpc.org/ethereum/Au_X8MHT5km3gTHdk3Zh9IDdBvMcMPoR8I_zzoXPVSjK');
        
        userWallet = await ensProvider.resolveName(userWalletInput);
        if (!userWallet) {
          return NextResponse.json({
            error: 'ENS name not found',
            details: `The ENS name "${userWalletInput}" could not be resolved. Please check if it exists or use a wallet address instead.`
          }, { status: 400 });
        }
        console.log('[CLAIM] ENS resolved:', userWalletInput, '→', userWallet);
      } else {
        // First normalize to lowercase, then use getAddress to validate and checksum properly
        const normalizedInput = userWalletInput.toLowerCase();
        userWallet = ethers.getAddress(normalizedInput);
        console.log('[CLAIM] Valid address provided:', userWallet);
      }
    } catch (addressError) {
      console.log('[CLAIM] Invalid wallet address/ENS:', userWalletInput);
      return NextResponse.json({ error: 'Invalid wallet address or ENS name' }, { status: 400 });
    }

    // Check if this is a multi-claim or single-claim link and get campaign info
    console.log('[CLAIM] Checking link validity for:', linkId);
    const current = await db.getClaimWithCampaignInfo(linkId);
    console.log('[CLAIM] Current link data with campaign info:', current);
    
    if (!current) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    }

    // Get campaign info including chain_id
    const campaignTokenAddress = current.campaigns?.token_address || process.env.TOKEN_ADDRESS;
    const campaignTokenDecimals = current.campaigns?.token_decimals || Number(process.env.TOKEN_DECIMALS || 18);
    const campaignTokenSymbol = current.campaigns?.token_symbol || 'TOKEN';
    const campaignChainId = current.campaigns?.chain_id;
    
    console.log('[CLAIM] Using campaign info:', {
      address: campaignTokenAddress,
      decimals: campaignTokenDecimals,
      symbol: campaignTokenSymbol,
      chainId: campaignChainId
    });
    
    // Get RPC URL for the campaign's chain
    const rpcUrl = campaignChainId ? getRpcUrl(campaignChainId) : process.env.RPC_URL;
    console.log('[CLAIM] Using RPC URL:', rpcUrl);
    
    if (!rpcUrl) {
      return NextResponse.json({
        error: 'Unsupported network',
        details: 'The network for this campaign is not supported'
      }, { status: 400 });
    }
    
    // Create provider and wallet for this specific chain
    let provider: ethers.JsonRpcProvider;
    if (campaignChainId) {
      provider = new ethers.JsonRpcProvider(rpcUrl, {
        chainId: parseInt(campaignChainId),
        name: `chain-${campaignChainId}`,
        ensAddress: null
      });
    } else {
      provider = new ethers.JsonRpcProvider(rpcUrl);
    }
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Validate that the token is still valid (native or ERC-20)
    const tokenValidation = await db.validateTokenContract(campaignTokenAddress, campaignChainId, rpcUrl);
    if (!tokenValidation.isValid) {
      return NextResponse.json({
        error: 'Invalid token contract',
        details: `The token for this campaign is no longer valid: ${tokenValidation.error}`
      }, { status: 400 });
    }
    
    const isNativeToken = tokenValidation.isNative || false;
    console.log('[CLAIM] Token type:', isNativeToken ? 'Native' : 'ERC-20');
    
    if (current.expires_at && new Date(current.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 400 });
    }

    let reserved: any;
    
    if (current.is_multi_claim) {
      console.log('[CLAIM] Processing multi-claim link');
      
      // Check if wallet already claimed from this multi-claim link
      const alreadyClaimed = await db.checkWalletAlreadyClaimed(linkId, userWallet, current.campaign_id);
      if (alreadyClaimed) {
        const explorerBaseUrl = getExplorerUrl(campaignChainId) || 'https://etherscan.io';
        const explorerUrl = `${explorerBaseUrl}/tx/${alreadyClaimed.tx_hash}`;
        
        return NextResponse.json({
          error: 'Wallet already claimed from this link',
          details: {
            message: 'This wallet has already claimed tokens from this multi-claim link',
            amount: alreadyClaimed.amount,
            txHash: alreadyClaimed.tx_hash,
            explorerUrl: explorerUrl,
            claimedAt: alreadyClaimed.claimed_at ? new Date(alreadyClaimed.claimed_at).toLocaleString() : 'Unknown date'
          }
        }, { status: 400 });
      }
      
      if (current.current_claims >= current.max_claims) {
        return NextResponse.json({ error: 'All claims have been used' }, { status: 400 });
      }
      
      const reserveResult = await db.reserveMultiClaim(linkId, userWallet);
      
      if (reserveResult?.error === 'already_claimed') {
        const claimData = reserveResult.claimData;
        const explorerBaseUrl = getExplorerUrl(campaignChainId) || 'https://etherscan.io';
        const explorerUrl = `${explorerBaseUrl}/tx/${claimData.tx_hash}`;
        
        return NextResponse.json({
          error: 'Wallet already claimed from this link',
          details: {
            message: 'This wallet has already claimed tokens from this multi-claim link',
            amount: claimData.amount,
            txHash: claimData.tx_hash,
            explorerUrl: explorerUrl,
            claimedAt: claimData.claimed_at ? new Date(claimData.claimed_at).toLocaleString() : 'Unknown date'
          }
        }, { status: 400 });
      }
      
      reserved = reserveResult;
    } else {
      console.log('[CLAIM] Processing single-use claim link');
      
      if (current.claimed) {
        return NextResponse.json({ error: 'Invalid or already claimed' }, { status: 400 });
      }
      
      reserved = await db.reserve(linkId);
    }
    
    console.log('[CLAIM] Reserved result:', reserved);
    
    if (!reserved) {
      return NextResponse.json({ error: 'Failed to reserve claim' }, { status: 400 });
    }

    const amount = reserved.amount;
    console.log('[CLAIM] Processing transfer:', { userWallet, amount, decimals: campaignTokenDecimals, isNative: isNativeToken });
    
    // Check wallet balance before attempting transfer
    let walletBalance: bigint, requiredAmount: bigint;
    
    if (isNativeToken) {
      requiredAmount = ethers.parseEther(amount.toString());
      walletBalance = await provider.getBalance(wallet.address);
      
      console.log('[CLAIM] Native token balance check:', {
        walletAddress: wallet.address,
        requiredAmount: requiredAmount.toString(),
        availableBalance: walletBalance.toString(),
        hasEnoughBalance: walletBalance >= requiredAmount
      });
    } else {
      const campaignToken = new ethers.Contract(campaignTokenAddress, [
        'function transfer(address,uint256)',
        'function balanceOf(address) view returns (uint256)'
      ], wallet);
      
      requiredAmount = ethers.parseUnits(amount.toString(), campaignTokenDecimals);
      walletBalance = await campaignToken.balanceOf(wallet.address);
      
      console.log('[CLAIM] ERC-20 balance check:', {
        walletAddress: wallet.address,
        requiredAmount: requiredAmount.toString(),
        availableBalance: walletBalance.toString(),
        hasEnoughBalance: walletBalance >= requiredAmount
      });
    }
    
    if (walletBalance < requiredAmount) {
      console.log('[CLAIM] Insufficient balance in hot wallet');
      
      // Rollback reservation for single-use claims
      if (!current.is_multi_claim) {
        try { 
          await db.rollback(linkId); 
          console.log('[CLAIM] Rollback successful due to insufficient balance');
        } catch (rollbackError) {
          console.error('[CLAIM] Rollback failed:', rollbackError);
        }
      }
      
      return NextResponse.json({
        error: 'Insufficient funds in distribution wallet',
        details: 'The distribution wallet does not have enough tokens to complete this claim. Please contact the administrator.'
      }, { status: 503 });
    }
    
    // Execute blockchain transfer
    let tx: any;
    if (isNativeToken) {
      tx = await wallet.sendTransaction({
        to: userWallet,
        value: requiredAmount
      });
      console.log('[CLAIM] Native token transfer successful:', tx.hash);
    } else {
      const campaignToken = new ethers.Contract(campaignTokenAddress, [
        'function transfer(address,uint256)',
        'function balanceOf(address) view returns (uint256)'
      ], wallet);
      
      tx = await campaignToken.transfer(userWallet, requiredAmount);
      console.log('[CLAIM] ERC-20 transfer successful:', tx.hash);
    }
    
    // Save to database
    try {
      if (current.is_multi_claim) {
        await db.markMultiClaimed(linkId, userWallet, tx.hash, amount, current.campaign_id);
      } else {
        await db.markClaimed(linkId, tx.hash);
      }
      console.log('[CLAIM] Database save successful');
    } catch (dbError) {
      console.error('[CLAIM] Database save failed but transfer succeeded:', dbError);
      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        warning: 'Transfer completed but database update failed. Transaction is valid on blockchain.'
      });
    }
    
    return NextResponse.json({ success: true, txHash: tx.hash });
    
  } catch (error) {
    console.error('[CLAIM] Transfer failed:', error);
    return NextResponse.json(
      { error: 'Transfer failed', details: error.message },
      { status: 500 }
    );
  }
}