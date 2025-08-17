import { ethers } from 'ethers';
import db from '../lib/db.js';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS || 18);

console.log('[CLAIM] Module loaded - Environment check:', {
  PRIVATE_KEY: !!PRIVATE_KEY,
  TOKEN_ADDRESS: !!TOKEN_ADDRESS,
  RPC_URL: !!RPC_URL,
  TOKEN_DECIMALS
});

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const token = new ethers.Contract(TOKEN_ADDRESS, [
  'function transfer(address,uint256)',
  'function balanceOf(address) view returns (uint256)'
], wallet);

export default async function handler(req, res) {
  console.log('[CLAIM] Request received:', {
    method: req.method,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type']
    }
  });

  if (req.method !== 'POST') {
    console.log('[CLAIM] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wallet: userWalletInput, linkId } = req.body || {};
  console.log('[CLAIM] Parsed request:', { userWalletInput, linkId });
  
  if (!userWalletInput || !linkId) {
    console.log('[CLAIM] Missing data');
    return res.status(400).json({ error: 'Missing data' });
  }
  
  // Resolve ENS names to addresses
  let userWallet;
  try {
    if (userWalletInput.endsWith('.eth')) {
      console.log('[CLAIM] Resolving ENS name:', userWalletInput);
      
      // Use Ethereum mainnet provider specifically for ENS resolution
      const ensProvider = new ethers.JsonRpcProvider('https://lb.drpc.org/ethereum/Au_X8MHT5km3gTHdk3Zh9IDdBvMcMPoR8I_zzoXPVSjK');
      
      userWallet = await ensProvider.resolveName(userWalletInput);
      if (!userWallet) {
        console.log('[CLAIM] ENS name not found:', userWalletInput);
        return res.status(400).json({ 
          error: 'ENS name not found', 
          details: `The ENS name "${userWalletInput}" could not be resolved. Please check if it exists or use a wallet address instead.`
        });
      }
      console.log('[CLAIM] ENS resolved:', userWalletInput, '→', userWallet);
    } else if (ethers.isAddress(userWalletInput)) {
      userWallet = userWalletInput;
      console.log('[CLAIM] Valid address provided:', userWallet);
    } else {
      console.log('[CLAIM] Invalid wallet address/ENS:', userWalletInput);
      return res.status(400).json({ error: 'Invalid wallet address or ENS name' });
    }
  } catch (ensError) {
    console.error('[CLAIM] ENS resolution failed:', ensError);
    return res.status(400).json({ 
      error: 'Failed to resolve ENS name', 
      details: `ENS resolution error: ${ensError.message}. Try using a wallet address instead.`
    });
  }

  // Check if this is a multi-claim or single-claim link
  console.log('[CLAIM] Checking link validity for:', linkId);
  const current = await db.get(linkId);
  console.log('[CLAIM] Current link data:', current);
  
  if (!current) {
    console.log('[CLAIM] Link not found');
    return res.status(400).json({ error: 'Invalid link' });
  }
  
  if (current.expires_at && new Date(current.expires_at).getTime() <= Date.now()) {
    console.log('[CLAIM] Link expired:', current.expires_at);
    return res.status(400).json({ error: 'Link expired' });
  }

  let reserved;
  
  if (current.is_multi_claim) {
    console.log('[CLAIM] Processing multi-claim link');
    
    // Check if wallet already claimed from this multi-claim link
    const alreadyClaimed = await db.checkWalletAlreadyClaimed(linkId, userWallet);
    if (alreadyClaimed) {
      console.log('[CLAIM] Wallet already claimed from this multi-claim link');
      return res.status(400).json({ error: 'Wallet already claimed from this link' });
    }
    
    // Check if multi-claim still has slots available
    if (current.current_claims >= current.max_claims) {
      console.log('[CLAIM] Multi-claim limit reached');
      return res.status(400).json({ error: 'All claims have been used' });
    }
    
    reserved = await db.reserveMultiClaim(linkId, userWallet);
  } else {
    console.log('[CLAIM] Processing single-use claim link');
    
    if (current.claimed) {
      console.log('[CLAIM] Single-use link already claimed');
      return res.status(400).json({ error: 'Invalid or already claimed' });
    }
    
    reserved = await db.reserve(linkId);
  }
  
  console.log('[CLAIM] Reserved result:', reserved);
  
  if (!reserved) {
    console.log('[CLAIM] Failed to reserve link');
    return res.status(400).json({ error: 'Failed to reserve claim' });
  }

  const amount = reserved.amount;
  console.log('[CLAIM] Processing transfer:', { userWallet, amount, TOKEN_DECIMALS });
  
  // Check wallet balance before attempting transfer
  try {
    const requiredAmount = ethers.parseUnits(amount.toString(), TOKEN_DECIMALS);
    const walletBalance = await token.balanceOf(wallet.address);
    
    console.log('[CLAIM] Balance check:', {
      walletAddress: wallet.address,
      requiredAmount: requiredAmount.toString(),
      availableBalance: walletBalance.toString(),
      hasEnoughBalance: walletBalance >= requiredAmount
    });
    
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
      
      return res.status(503).json({ 
        error: 'Insufficient funds in distribution wallet',
        details: 'The distribution wallet does not have enough tokens to complete this claim. Please contact the administrator.'
      });
    }
    
    // Execute blockchain transfer
    const tx = await token.transfer(userWallet, requiredAmount);
    console.log('[CLAIM] Transfer successful:', tx.hash);
    
    // Try to save to database - if this fails, we still have a successful blockchain transfer
    try {
      if (current.is_multi_claim) {
        await db.markMultiClaimed(linkId, userWallet, tx.hash, amount);
      } else {
        await db.markClaimed(linkId, tx.hash);
      }
      console.log('[CLAIM] Database save successful');
    } catch (dbError) {
      console.error('[CLAIM] Database save failed but transfer succeeded:', dbError);
      // Transfer succeeded, but DB save failed - still return success with warning
      return res.status(200).json({ 
        success: true, 
        txHash: tx.hash,
        warning: 'Transfer completed but database update failed. Transaction is valid on blockchain.'
      });
    }
    
    return res.status(200).json({ success: true, txHash: tx.hash });
    
  } catch (e) {
    console.error('[CLAIM] Transfer failed:', e);
    
    // Only rollback if transfer actually failed (not DB save)
    if (current.is_multi_claim) {
      try { 
        await db.rollbackMultiClaim(linkId, userWallet); 
        console.log('[CLAIM] Multi-claim rollback successful');
      } catch (rollbackError) {
        console.error('[CLAIM] Multi-claim rollback failed:', rollbackError);
      }
    } else {
      try { 
        await db.rollback(linkId); 
        console.log('[CLAIM] Single-claim rollback successful');
      } catch (rollbackError) {
        console.error('[CLAIM] Single-claim rollback failed:', rollbackError);
      }
    }
    
    return res.status(500).json({ error: 'Transfer failed', details: e.message });
  }
}
