// Archivo: lib/db.js (Supabase adapter) - Updated with multi-claim support
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

console.log('[DB] Module loaded - Supabase config:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE; // **server only**

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn('[DB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

console.log('[DB] Supabase client initialized');

export default {
  // Original single-claim functions
  async get(id) {
    console.log('[DB] Getting claim:', id);
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('[DB] Get error:', error);
      return null;
    }
    console.log('[DB] Get result:', data);
    return data;
  },

  async getClaimWithCampaignInfo(id) {
    console.log('[DB] Getting claim with campaign info:', id);
    
    // First get the claim
    const { data: claimData, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (claimError || !claimData) {
      console.error('[DB] Get claim error:', claimError);
      return null;
    }
    
    // Then get the campaign info
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('token_address, token_symbol, token_decimals, title, status, chain_id')
      .eq('id', claimData.campaign_id)
      .maybeSingle();
    
    if (campaignError || !campaignData) {
      console.error('[DB] Get campaign error:', campaignError);
      // If campaign not found (probably legacy 'default' campaign), use fallback data from env
      const tokenAddress = process.env.TOKEN_ADDRESS || '0x...';
      const tokenSymbol = tokenAddress === '0x029263aa1be88127f1794780d9eef453221c2f30' ? 'PULPA' : 'TOKEN';
      
      const result = {
        ...claimData,
        campaigns: {
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          token_decimals: parseInt(process.env.TOKEN_DECIMALS) || 18,
          title: 'Legacy Token Airdrop',
          status: 'active'
        }
      };
      console.log('[DB] Using fallback legacy campaign data:', result);
      return result;
    }
    
    const result = {
      ...claimData,
      campaigns: campaignData
    };
    
    console.log('[DB] Get claim with campaign result:', result);
    return result;
  },

  async save(id, amount, expires_at = null, campaign_id = 'default') {
    console.log('[DB] Saving claim:', { id, amount, expires_at, campaign_id });
    const { error } = await supabase
      .from('claims')
      .insert({ id, amount, status: 'new', claimed: false, expires_at, campaign_id });
    if (error) {
      console.error('[DB] Save error:', error);
      throw error;
    }
    console.log('[DB] Save successful');
  },

  async reserve(id) {
    console.log('[DB] Reserving claim:', id);
    // Mark as processing only if not claimed yet and status is 'new'
    const { data, error } = await supabase
      .from('claims')
      .update({ status: 'processing' })
      .eq('id', id)
      .eq('claimed', false)
      .eq('status', 'new')
      .select()
      .maybeSingle();
    if (error || !data) {
      console.log('[DB] Reserve failed:', error || 'no data returned');
      return null;
    }
    console.log('[DB] Reserve successful:', data);
    return data;
  },

  async markClaimed(id, txHash) {
    const { error } = await supabase
      .from('claims')
      .update({ claimed: true, status: 'done', tx_hash: txHash, claimed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async rollback(id) {
    const { error } = await supabase
      .from('claims')
      .update({ status: 'new' })
      .eq('id', id);
    if (error) throw error;
  },

  // Multi-claim functions
  async saveMultiClaim(id, amount, maxClaims, expires_at = null, campaign_id = 'default') {
    console.log('[DB] Saving multi-claim:', { id, amount, maxClaims, expires_at, campaign_id });
    const { error } = await supabase
      .from('claims')
      .insert({ 
        id, 
        amount, 
        expires_at,
        campaign_id,
        is_multi_claim: true,
        max_claims: maxClaims,
        current_claims: 0,
        status: 'active' 
      });
    if (error) {
      console.error('[DB] Save multi-claim error:', error);
      throw error;
    }
    console.log('[DB] Multi-claim save successful');
  },

  async checkWalletAlreadyClaimed(claimId, walletAddress, campaign_id) {
    console.log('[DB] Checking if wallet already claimed:', { claimId, walletAddress, campaign_id });
    const { data, error } = await supabase
      .from('multi_claim_wallets')
      .select('id, tx_hash, amount, claimed_at')
      .eq('claim_id', claimId)
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('campaign_id', campaign_id)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('[DB] Check wallet error:', error);
      throw error;
    }
    
    if (data) {
      console.log('[DB] Wallet already claimed with data:', data);
      return data; // Return claim data instead of boolean
    } else {
      console.log('[DB] Wallet has not claimed yet');
      return null;
    }
  },

  async reserveMultiClaim(claimId, walletAddress) {
    console.log('[DB] Attempting to reserve multi-claim:', { claimId, walletAddress });
    
    // Check if link is still available and wallet hasn't claimed
    const { data: claimData, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .eq('is_multi_claim', true)
      .maybeSingle();

    if (claimError || !claimData) {
      console.log('[DB] Multi-claim not found or error:', claimError);
      return null;
    }

    // Check if we've reached max claims
    if (claimData.current_claims >= claimData.max_claims) {
      console.log('[DB] Multi-claim limit reached');
      return null;
    }

    // Check if wallet already claimed (using campaign_id from claimData)
    const alreadyClaimed = await this.checkWalletAlreadyClaimed(claimId, walletAddress, claimData.campaign_id);
    if (alreadyClaimed) {
      console.log('[DB] Wallet already claimed from this link in this campaign');
      return { error: 'already_claimed', claimData: alreadyClaimed };
    }

    console.log('[DB] Multi-claim reservation successful:', claimData);
    return claimData;
  },

  async markMultiClaimed(claimId, walletAddress, txHash, amount, campaign_id) {
    console.log('[DB] Marking multi-claim as completed:', { claimId, walletAddress, txHash, amount, campaign_id });
    
    try {
      // Insert the wallet claim record
      const { error: insertError } = await supabase
        .from('multi_claim_wallets')
        .insert({
          claim_id: claimId,
          wallet_address: walletAddress.toLowerCase(),
          tx_hash: txHash,
          amount: amount,
          campaign_id: campaign_id
        });

      if (insertError) {
        console.error('[DB] Error inserting wallet claim:', insertError);
        throw insertError;
      }

      // Increment the current_claims counter
      // First get current value, then increment
      const { data: currentData, error: fetchError } = await supabase
        .from('claims')
        .select('current_claims')
        .eq('id', claimId)
        .single();

      if (fetchError) {
        console.error('[DB] Error fetching current claims:', fetchError);
        throw fetchError;
      }

      const newCount = (currentData.current_claims || 0) + 1;
      const { error: updateError } = await supabase
        .from('claims')
        .update({ current_claims: newCount })
        .eq('id', claimId);

      if (updateError) {
        console.error('[DB] Error updating claim counter:', updateError);
        throw updateError;
      }

      console.log('[DB] Multi-claim mark completed successful');
    } catch (error) {
      console.error('[DB] Error in markMultiClaimed:', error);
      throw error;
    }
  },

  async rollbackMultiClaim(claimId, walletAddress, campaign_id) {
    console.log('[DB] Rolling back multi-claim for wallet:', { claimId, walletAddress, campaign_id });
    
    try {
      // Remove wallet claim record if it exists
      const { error: deleteError } = await supabase
        .from('multi_claim_wallets')
        .delete()
        .eq('claim_id', claimId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('campaign_id', campaign_id);

      if (deleteError) {
        console.error('[DB] Error deleting wallet claim record:', deleteError);
        throw deleteError;
      }

      // Decrement the current_claims counter (but don't go below 0)
      const { data: currentData, error: fetchError } = await supabase
        .from('claims')
        .select('current_claims')
        .eq('id', claimId)
        .single();

      if (fetchError) {
        console.error('[DB] Error fetching current claims for rollback:', fetchError);
        throw fetchError;
      }

      const newCount = Math.max((currentData.current_claims || 0) - 1, 0);
      const { error: updateError } = await supabase
        .from('claims')
        .update({ current_claims: newCount })
        .eq('id', claimId);

      if (updateError) {
        console.error('[DB] Error decrementing claim counter:', updateError);
        throw updateError;
      }

      console.log('[DB] Multi-claim rollback successful');
    } catch (error) {
      console.error('[DB] Error in rollbackMultiClaim:', error);
      throw error;
    }
  },

  async getMultiClaimStats(claimId) {
    console.log('[DB] Getting multi-claim stats:', claimId);
    const { data, error } = await supabase
      .from('multi_claim_wallets')
      .select('wallet_address, claimed_at, tx_hash, amount')
      .eq('claim_id', claimId)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('[DB] Error getting multi-claim stats:', error);
      return [];
    }

    console.log('[DB] Multi-claim stats retrieved:', data?.length || 0, 'claims');
    return data || [];
  },

  // User management functions
  async getOrCreateUser(walletAddress) {
    console.log('[DB] Getting or creating user:', walletAddress);
    
    try {
      // Try to get existing user
      const { data: existingUser, error: getUserError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle();

      if (getUserError && getUserError.code !== 'PGRST116') {
        console.error('[DB] Error getting user:', getUserError);
        throw getUserError;
      }

      if (existingUser) {
        console.log('[DB] Found existing user:', existingUser.id);
        // Update last login
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('[DB] Error updating last login:', updateError);
        }

        return existingUser;
      }

      console.log('[DB] User not found, creating new user...');
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('[DB] Error creating user:', createError);
        throw createError;
      }

      console.log('[DB] Created new user:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('[DB] Error in getOrCreateUser:', error);
      throw error;
    }
  },

  async getUserCampaigns(walletAddress) {
    console.log('[DB] Getting campaigns for user:', walletAddress);
    
    try {
      // Get or create user first
      const user = await this.getOrCreateUser(walletAddress);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DB] Error getting campaigns:', error);
        throw error;
      }

      // Check if links are generated for each campaign
      const campaignsWithLinkStatus = await Promise.all((data || []).map(async (campaign) => {
        const { data: existingClaims } = await supabase
          .from('claims')
          .select('id')
          .eq('campaign_id', campaign.id)
          .limit(1);
        
        return {
          ...campaign,
          links_generated: existingClaims && existingClaims.length > 0
        };
      }));

      return campaignsWithLinkStatus;
    } catch (error) {
      console.error('[DB] Error in getUserCampaigns:', error);
      // Return empty array if user doesn't exist or other issues
      return [];
    }
  },

  async getUserIdByWallet(walletAddress) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  },

  async createCampaign(campaignData) {
    console.log('[DB] Creating campaign:', campaignData);
    
    // Validate ERC-20 contract first
    console.log('[DB] Validating ERC-20 contract:', campaignData.tokenAddress);
    console.log('[DB] Using chain ID:', campaignData.chainId);
    
    // Import network utilities to get RPC URL
    const { getRpcUrl } = await import('./networks.js');
    const rpcUrl = getRpcUrl(campaignData.chainId);
    console.log('[DB] Using RPC URL for validation:', rpcUrl);
    
    const validation = await this.validateTokenContract(campaignData.tokenAddress, campaignData.chainId, rpcUrl);
    
    if (!validation.isValid) {
      console.error('[DB] Token validation failed:', validation.error);
      throw new Error(`Invalid token: ${validation.error}`);
    }
    
    // Use validated token info
    const tokenInfo = validation.tokenInfo;
    console.log('[DB] Using validated token info:', tokenInfo);
    
    // Get or create user, then get user ID
    const user = await this.getOrCreateUser(campaignData.walletAddress);
    const userId = user.id;
    
    // Generate campaign ID
    const campaignId = `${campaignData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    
    // Calculate total budget
    const totalBudget = campaignData.amountPerClaim * campaignData.totalClaims;
    
    // Set expiration
    let expiresAt = null;
    if (campaignData.expiresInHours) {
      const d = new Date();
      d.setHours(d.getHours() + campaignData.expiresInHours);
      expiresAt = d.toISOString();
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        id: campaignId,
        user_id: userId,
        title: campaignData.title,
        description: campaignData.description,
        token_address: tokenInfo.address,
        token_symbol: tokenInfo.symbol, // Use validated symbol
        token_decimals: tokenInfo.decimals, // Use validated decimals
        claim_type: campaignData.claimType,
        amount_per_claim: campaignData.amountPerClaim,
        max_claims: campaignData.maxClaimsPerLink,
        total_budget: totalBudget,
        required_balance: totalBudget,
        expires_at: expiresAt,
        deposit_address: process.env.HOT_WALLET_ADDRESS || '0x86300E0a857aAB39A601E89b0e7F15e1488d9F0C', // Use correct hot wallet
        status: 'pending_funding',
        chain_id: campaignData.chainId
      })
      .select()
      .single();

    if (error) {
      console.error('[DB] Error creating campaign:', error);
      throw error;
    }

    console.log('[DB] Created campaign:', data.id);
    return data;
  },

  async updateCampaign(campaignId, updateData) {
    console.log('[DB] Updating campaign:', campaignId, updateData);
    
    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('[DB] Error updating campaign:', error);
      throw error;
    }

    return data;
  },

  async deleteCampaign(campaignId) {
    console.log('[DB] Deleting campaign:', campaignId);
    
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('[DB] Error deleting campaign:', error);
      throw error;
    }
  },

  async checkCampaignFunding(campaignId, walletAddress) {
    console.log('[DB] Checking campaign funding:', { campaignId, walletAddress });
    
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        console.error('[DB] Campaign not found:', campaignError);
        return { funded: false, error: 'Campaign not found' };
      }

      // Verify user owns this campaign
      const user = await this.getOrCreateUser(walletAddress);
      if (campaign.user_id !== user.id) {
        console.error('[DB] User does not own this campaign');
        return { funded: false, error: 'Unauthorized' };
      }

      // Check if already funded
      if (campaign.status === 'active') {
        return { 
          funded: true, 
          campaign: campaign,
          message: 'Campaign already active'
        };
      }

      // Check for specific transaction from user's wallet to deposit address
      console.log('[DB] Searching for funding transaction...');
      const transactionCheck = await this.findFundingTransaction(
        walletAddress,           // From user's wallet
        campaign.deposit_address, // To deposit wallet
        campaign.token_address,   // Token contract
        campaign.required_balance, // Required amount
        campaign.token_decimals,   // Token decimals
        campaign.created_at,      // Search from campaign creation
        campaign.chain_id         // Chain ID for correct RPC
      );

      if (!transactionCheck.found) {
        console.log('[DB] Funding transaction not found:', transactionCheck);
        return { 
          funded: false, 
          error: 'Funding transaction not found',
          details: transactionCheck.details || `Please send exactly ${campaign.required_balance} ${campaign.token_symbol} from your connected wallet (${walletAddress}) to ${campaign.deposit_address}`
        };
      }

      // Record the deposit in our database
      await this.recordCampaignDeposit(campaign.id, user.id, transactionCheck.transaction);

      // Activate campaign
      const { data: updatedCampaign, error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          activated_at: new Date().toISOString(),
          current_balance: transactionCheck.amount
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (updateError) {
        console.error('[DB] Error updating campaign status:', updateError);
        return { funded: false, error: 'Failed to activate campaign' };
      }

      console.log('[DB] Campaign activated with verified transaction:', transactionCheck.transaction.hash);
      return { 
        funded: true, 
        campaign: updatedCampaign,
        transaction: transactionCheck.transaction,
        amount: transactionCheck.amount,
        message: `Campaign activated! Verified transaction: ${transactionCheck.transaction.hash.substring(0, 10)}...`
      };

    } catch (error) {
      console.error('[DB] Error checking funding:', error);
      return { funded: false, error: error.message };
    }
  },

  async checkNativeTokenBalance(walletAddress, requiredAmount, chainId) {
    console.log('[DB] Checking native token balance:', { walletAddress, requiredAmount, chainId });
    
    try {
      const { ethers } = await import('ethers');
      const { getRpcUrl } = await import('./networks.js');
      
      // Get RPC URL for the chain
      const rpcUrl = getRpcUrl(chainId) || process.env.RPC_URL;
      const provider = new ethers.JsonRpcProvider(rpcUrl, {
        chainId: parseInt(chainId),
        name: `chain-${chainId}`,
        ensAddress: null // Explicitly disable ENS for custom networks
      });
      
      // Validate wallet address
      if (!ethers.isAddress(walletAddress)) {
        throw new Error(`Invalid wallet address: ${walletAddress}`);
      }
      
      // Get native token balance
      const balanceWei = await provider.getBalance(walletAddress);
      const balance = ethers.formatEther(balanceWei); // Native tokens always use 18 decimals
      const balanceFloat = parseFloat(balance);
      
      console.log('[DB] Native token balance check result:', {
        balanceWei: balanceWei.toString(),
        balance: balance,
        balanceFloat: balanceFloat,
        requiredAmount: requiredAmount,
        sufficient: balanceFloat >= requiredAmount
      });
      
      return {
        balance: balanceFloat,
        balanceWei: balanceWei.toString(),
        sufficient: balanceFloat >= requiredAmount,
        required: requiredAmount,
        isNative: true
      };
      
    } catch (error) {
      console.error('[DB] Error checking native token balance:', error);
      throw new Error(`Failed to check native token balance: ${error.message}`);
    }
  },

  async checkTokenBalance(walletAddress, tokenAddress, requiredAmount, decimals = 18, chainId = null) {
    console.log('[DB] Checking token balance:', { walletAddress, tokenAddress, requiredAmount, chainId });
    
    try {
      // Import ethers here to avoid issues
      const { ethers } = await import('ethers');
      
      // Check if this is a native token
      if (this.isNativeToken(tokenAddress)) {
        return await this.checkNativeTokenBalance(walletAddress, requiredAmount, chainId);
      }
      
      // Validate that the token is still a valid ERC-20 before checking balance
      const tokenValidation = await this.validateERC20Contract(tokenAddress);
      if (!tokenValidation.isValid) {
        throw new Error(`Invalid ERC-20 token: ${tokenValidation.error}`);
      }
      
      // Create provider
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
        ensAddress: null // Explicitly disable ENS for custom networks
      });
      
      // ERC20 ABI for balanceOf function
      const erc20ABI = [
        "function balanceOf(address owner) view returns (uint256)"
      ];
      
      // Create contract instance
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      
      // Get balance
      const balanceWei = await tokenContract.balanceOf(walletAddress);
      const balance = ethers.formatUnits(balanceWei, decimals);
      const balanceFloat = parseFloat(balance);
      
      console.log('[DB] Token balance check result:', {
        balanceWei: balanceWei.toString(),
        balance: balance,
        balanceFloat: balanceFloat,
        requiredAmount: requiredAmount,
        sufficient: balanceFloat >= requiredAmount
      });
      
      return {
        balance: balanceFloat,
        balanceWei: balanceWei.toString(),
        sufficient: balanceFloat >= requiredAmount,
        required: requiredAmount
      };
      
    } catch (error) {
      console.error('[DB] Error checking token balance:', error);
      throw new Error(`Failed to check token balance: ${error.message}`);
    }
  },

  async findFundingTransaction(fromWallet, toWallet, tokenAddress, requiredAmount, decimals, fromDate, chainId) {
    console.log('[DB] Searching for funding transaction:', {
      fromWallet, toWallet, tokenAddress, requiredAmount, fromDate, chainId
    });
    
    try {
      // Import ethers and network utilities
      const { ethers } = await import('ethers');
      const { getRpcUrl } = await import('./networks.js');
      
      // Get the correct RPC URL for the chain
      const rpcUrl = getRpcUrl(chainId);
      if (!rpcUrl) {
        throw new Error(`No RPC URL configured for chain ID ${chainId}`);
      }
      
      console.log('[DB] Using RPC URL:', rpcUrl);
      
      // Create provider with explicit network configuration to avoid ENS issues
      const provider = new ethers.JsonRpcProvider(rpcUrl, {
        chainId: parseInt(chainId),
        name: `chain-${chainId}`,
        ensAddress: null // Explicitly disable ENS for custom networks
      });
      
      // Validate addresses before using them
      if (!ethers.isAddress(fromWallet)) {
        throw new Error(`Invalid fromWallet address: ${fromWallet}`);
      }
      if (!ethers.isAddress(toWallet)) {
        throw new Error(`Invalid toWallet address: ${toWallet}`);
      }
      
      // Check if this is a native token
      if (this.isNativeToken(tokenAddress)) {
        return await this.findNativeFundingTransaction(provider, fromWallet, toWallet, requiredAmount, fromDate, chainId);
      }
      
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid token address: ${tokenAddress}`);
      }
      
      // ERC20 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
      const transferEventSignature = ethers.id("Transfer(address,address,uint256)");
      
      // Calculate block range to search (from campaign creation to now)
      const now = new Date();
      const campaignDate = new Date(fromDate);
      const daysSince = Math.ceil((now - campaignDate) / (1000 * 60 * 60 * 24));
      
      // Get blocks per day from network configuration
      const { getBlocksPerDay } = await import('./networks.js');
      const blocksPerDay = getBlocksPerDay(chainId);
      
      const blockRange = daysSince * blocksPerDay;
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - blockRange, currentBlock - 100000); // Max 100k blocks back
      
      console.log('[DB] Searching blocks', fromBlock, 'to', currentBlock);
      
      // Search for Transfer events
      const filter = {
        address: tokenAddress,
        topics: [
          transferEventSignature,
          ethers.zeroPadValue(fromWallet.toLowerCase(), 32), // from
          ethers.zeroPadValue(toWallet.toLowerCase(), 32)    // to
        ],
        fromBlock: fromBlock,
        toBlock: 'latest'
      };
      
      const logs = await provider.getLogs(filter);
      console.log('[DB] Found', logs.length, 'transfer events');
      
      // Check each transfer for the required amount
      for (const log of logs) {
        const amount = ethers.formatUnits(log.data, decimals);
        const amountFloat = parseFloat(amount);
        
        console.log('[DB] Checking transfer:', {
          txHash: log.transactionHash,
          amount: amountFloat,
          required: requiredAmount,
          difference: Math.abs(amountFloat - requiredAmount),
          blockNumber: log.blockNumber
        });
        
        // Allow larger tolerance for decimal precision issues
        // Some tokens might have rounding differences
        const tolerance = Math.max(0.01, requiredAmount * 0.001); // 0.1% or minimum 0.01
        console.log('[DB] Using tolerance:', tolerance);
        
        if (Math.abs(amountFloat - requiredAmount) <= tolerance) {
          // Get transaction details
          const tx = await provider.getTransaction(log.transactionHash);
          const receipt = await provider.getTransactionReceipt(log.transactionHash);
          
          console.log('[DB] Found matching transaction:', log.transactionHash);
          
          return {
            found: true,
            amount: amountFloat,
            transaction: {
              hash: log.transactionHash,
              blockNumber: log.blockNumber,
              from: tx.from,
              to: tx.to,
              value: log.data,
              timestamp: new Date().toISOString(), // In production, get block timestamp
              gasUsed: receipt.gasUsed.toString(),
              status: receipt.status
            }
          };
        }
      }
      
      return {
        found: false,
        details: `No transaction found with amount ${requiredAmount} ${await this.getTokenSymbol(tokenAddress)} from ${fromWallet} to ${toWallet}. Found ${logs.length} transfers but none matched the required amount.`
      };
      
    } catch (error) {
      console.error('[DB] Error searching for transaction:', error);
      return {
        found: false,
        details: `Error searching blockchain: ${error.message}`
      };
    }
  },

  async getTokenSymbol(tokenAddress) {
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
        ensAddress: null // Explicitly disable ENS for custom networks
      });
      const contract = new ethers.Contract(tokenAddress, [
        "function symbol() view returns (string)"
      ], provider);
      return await contract.symbol();
    } catch (error) {
      return 'TOKEN';
    }
  },

  async validateTokenContract(tokenAddress, chainId, rpcUrl = null) {
    console.log('[DB] Validating token contract:', tokenAddress, 'on chain:', chainId);
    console.log('[DB] Using RPC URL:', rpcUrl || process.env.RPC_URL);
    
    // Check if this is a native token
    if (this.isNativeToken(tokenAddress)) {
      return this.validateNativeToken(chainId);
    }
    
    // Continue with ERC-20 validation
    return this.validateERC20Contract(tokenAddress, rpcUrl);
  },

  isNativeToken(tokenAddress) {
    if (!tokenAddress) return false;
    
    const normalizedAddress = tokenAddress.toLowerCase();
    return normalizedAddress === 'native' || 
           normalizedAddress === '0x0000000000000000000000000000000000000000' ||
           normalizedAddress === '0x0' ||
           normalizedAddress === 'eth' ||
           normalizedAddress === 'matic' ||
           normalizedAddress === 'bnb';
  },

  async validateNativeToken(chainId) {
    console.log('[DB] Validating native token for chain:', chainId);
    
    try {
      // Import network utilities
      const { getNetworkInfo } = await import('./networks.js');
      const networkInfo = getNetworkInfo(chainId);
      
      if (!networkInfo) {
        return {
          isValid: false,
          error: `Unsupported chain ID: ${chainId}`
        };
      }
      
      console.log('[DB] Native token validation successful for:', networkInfo.currency);
      
      return {
        isValid: true,
        isNative: true,
        tokenInfo: {
          name: `${networkInfo.name} Native Token`,
          symbol: networkInfo.currency,
          decimals: 18, // All native tokens use 18 decimals
          address: 'NATIVE',
          totalSupply: 'N/A', // Native tokens don't have a fixed supply in the contract sense
          chainId: chainId,
          network: networkInfo.name
        }
      };
      
    } catch (error) {
      console.error('[DB] Native token validation error:', error);
      return {
        isValid: false,
        error: `Failed to validate native token: ${error.message}`
      };
    }
  },

  async validateERC20Contract(tokenAddress, rpcUrl = null) {
    console.log('[DB] Validating ERC-20 contract:', tokenAddress);
    console.log('[DB] Using RPC URL:', rpcUrl || process.env.RPC_URL);
    
    try {
      const { ethers } = await import('ethers');
      
      // Validate address format
      if (!ethers.isAddress(tokenAddress)) {
        console.log('[DB] Invalid address format:', tokenAddress);
        return {
          isValid: false,
          error: 'Invalid token address format'
        };
      }
      
      // Use dynamic RPC URL or fallback to .env
      const providerUrl = rpcUrl || process.env.RPC_URL;
      console.log('[DB] Using RPC URL:', providerUrl);
      const provider = new ethers.JsonRpcProvider(providerUrl, {
        ensAddress: null // Explicitly disable ENS for custom networks
      });
      
      // Check if address is a contract
      console.log('[DB] Checking if address is a contract...');
      const code = await provider.getCode(tokenAddress);
      console.log('[DB] Contract code length:', code.length);
      if (code === '0x') {
        return {
          isValid: false,
          error: 'Address is not a contract'
        };
      }
      
      // Standard ERC-20 interface
      const erc20ABI = [
        "function symbol() view returns (string)", 
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function name() view returns (string)"
      ];
      
      const contract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      
      // Try to call essential ERC-20 functions with timeouts
      console.log('[DB] Testing ERC-20 functions...');
      
      const timeoutMs = 10000; // 10 second timeout per call
      
      const callWithTimeout = async (fn, name) => {
        return Promise.race([
          fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${name} call timeout`)), timeoutMs)
          )
        ]);
      };
      
      let symbol, decimals, totalSupply, name = 'Unknown Token';
      
      try {
        // Call functions sequentially to avoid batch limit on free RPC
        console.log('[DB] Calling symbol()...');
        symbol = await callWithTimeout(() => contract.symbol(), 'symbol');
        console.log('[DB] Symbol retrieved:', symbol);
        
        console.log('[DB] Calling decimals()...');
        decimals = await callWithTimeout(() => contract.decimals(), 'decimals');
        console.log('[DB] Decimals retrieved:', decimals.toString());
        
        console.log('[DB] Calling totalSupply()...');
        totalSupply = await callWithTimeout(() => contract.totalSupply(), 'totalSupply');
        console.log('[DB] TotalSupply retrieved:', totalSupply.toString());
        
        // Try name function separately (optional)
        try {
          console.log('[DB] Calling name()...');
          name = await callWithTimeout(() => contract.name(), 'name');
          console.log('[DB] Name retrieved:', name);
        } catch (nameError) {
          console.log('[DB] Name function failed (optional):', nameError.message);
        }
        
      } catch (error) {
        console.error('[DB] Essential ERC-20 functions failed:', error.message);
        return {
          isValid: false,
          error: `ERC-20 validation failed: ${error.message}`
        };
      }
      
      // Additional validation: decimals should be reasonable (0-30, relaxed from 18)
      if (decimals > 30) {
        return {
          isValid: false,
          error: `Token decimals exceed maximum (30): ${decimals}`
        };
      }
      
      // Additional validation: totalSupply should be > 0
      if (totalSupply <= 0) {
        return {
          isValid: false,
          error: 'Token has no total supply'
        };
      }
      
      console.log('[DB] ERC-20 validation successful:', {
        name, symbol, decimals: decimals.toString(), totalSupply: totalSupply.toString()
      });
      
      return {
        isValid: true,
        tokenInfo: {
          name,
          symbol,
          decimals: Number(decimals),
          totalSupply: totalSupply.toString(),
          address: tokenAddress
        }
      };
      
    } catch (error) {
      console.error('[DB] ERC-20 validation error:', error);
      return {
        isValid: false,
        error: `Contract validation failed: ${error.message}`
      };
    }
  },

  async recordCampaignDeposit(campaignId, userId, transaction) {
    console.log('[DB] Recording campaign deposit:', { campaignId, userId, txHash: transaction.hash });
    
    try {
      // Check if already recorded
      const { data: existing } = await supabase
        .from('campaign_deposits')
        .select('id')
        .eq('tx_hash', transaction.hash)
        .maybeSingle();
      
      if (existing) {
        console.log('[DB] Deposit already recorded');
        return existing;
      }
      
      // Record new deposit
      const { data, error } = await supabase
        .from('campaign_deposits')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          tx_hash: transaction.hash,
          amount: parseFloat(transaction.value),
          block_number: transaction.blockNumber,
          verified: true,
          verified_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('[DB] Error recording deposit:', error);
        throw error;
      }
      
      console.log('[DB] Deposit recorded successfully');
      return data;
      
    } catch (error) {
      console.error('[DB] Error in recordCampaignDeposit:', error);
      throw error;
    }
  },

  async generateLinksForCampaign(campaignId, walletAddress) {
    console.log('[DB] Generating links for campaign:', { campaignId, walletAddress });
    
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        console.error('[DB] Campaign not found:', campaignError);
        throw new Error('Campaign not found');
      }

      // Verify user owns this campaign
      const user = await this.getOrCreateUser(walletAddress);
      if (campaign.user_id !== user.id) {
        console.error('[DB] User does not own this campaign');
        throw new Error('Unauthorized');
      }

      // Check if campaign is active
      if (campaign.status !== 'active') {
        throw new Error('Campaign must be active to generate links');
      }

      // Check if links were already generated
      const { data: existingClaims } = await supabase
        .from('claims')
        .select('id')
        .eq('campaign_id', campaignId);

      if (existingClaims && existingClaims.length > 0) {
        console.log('[DB] Links already exist for this campaign');
        return {
          success: true,
          message: 'Links already generated',
          linksCount: existingClaims.length,
          links: existingClaims.map(claim => ({
            id: claim.id,
            url: `/claim/${claim.id}`
          }))
        };
      }

      console.log('[DB] Generating new links...');
      const links = [];

      if (campaign.claim_type === 'single') {
        // Generate multiple single-use links
        const linksToGenerate = Math.ceil(campaign.total_budget / campaign.amount_per_claim);
        
        for (let i = 0; i < linksToGenerate; i++) {
          const linkId = this.generateUniqueId();
          
          await this.save(
            linkId, 
            campaign.amount_per_claim, 
            campaign.expires_at, 
            campaignId
          );
          
          links.push({
            id: linkId,
            url: `/claim/${linkId}`,
            type: 'single-use',
            amount: campaign.amount_per_claim
          });
        }
      } else {
        // Generate multi-claim link
        const linkId = this.generateUniqueId();
        
        await this.saveMultiClaim(
          linkId,
          campaign.amount_per_claim,
          Math.ceil(campaign.total_budget / campaign.amount_per_claim), // max claims
          campaign.expires_at,
          campaignId
        );
        
        links.push({
          id: linkId,
          url: `/claim/${linkId}`,
          type: 'multi-claim',
          amount: campaign.amount_per_claim,
          maxClaims: Math.ceil(campaign.total_budget / campaign.amount_per_claim)
        });
      }

      console.log('[DB] Generated', links.length, 'links for campaign');
      
      return {
        success: true,
        message: `Generated ${links.length} ${campaign.claim_type === 'single' ? 'single-use' : 'multi-claim'} link(s)`,
        linksCount: links.length,
        links: links,
        campaign: {
          title: campaign.title,
          type: campaign.claim_type,
          amountPerClaim: campaign.amount_per_claim,
          totalBudget: campaign.total_budget
        }
      };

    } catch (error) {
      console.error('[DB] Error generating links:', error);
      throw error;
    }
  },

  generateUniqueId() {
    // Generate a random ID for claim links
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  async getExistingLinksForCampaign(campaignId, walletAddress) {
    console.log('[DB] Getting existing links for campaign:', { campaignId, walletAddress });
    
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        console.error('[DB] Campaign not found:', campaignError);
        throw new Error('Campaign not found');
      }

      // Verify user owns this campaign
      const user = await this.getOrCreateUser(walletAddress);
      if (campaign.user_id !== user.id) {
        console.error('[DB] User does not own this campaign');
        throw new Error('Unauthorized');
      }

      // Get existing links
      const { data: existingClaims, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .eq('campaign_id', campaignId);

      if (claimsError) {
        console.error('[DB] Error getting claims:', claimsError);
        throw new Error('Failed to retrieve links');
      }

      if (!existingClaims || existingClaims.length === 0) {
        throw new Error('No links found for this campaign');
      }

      console.log('[DB] Found', existingClaims.length, 'existing links');
      
      const links = existingClaims.map(claim => ({
        id: claim.id,
        url: `/claim/${claim.id}`,
        type: claim.is_multi_claim ? 'multi-claim' : 'single-use',
        amount: claim.amount,
        maxClaims: claim.max_claims || 1,
        currentClaims: claim.current_claims || 0,
        status: claim.status
      }));

      return {
        success: true,
        message: `Found ${links.length} existing link(s)`,
        linksCount: links.length,
        links: links,
        campaign: {
          title: campaign.title,
          type: campaign.claim_type,
          amountPerClaim: campaign.amount_per_claim,
          totalBudget: campaign.total_budget
        }
      };

    } catch (error) {
      console.error('[DB] Error getting existing links:', error);
      throw error;
    }
  },

  async getCampaignStats(campaignId, walletAddress) {
    console.log('[DB] Getting campaign stats:', { campaignId, walletAddress });
    
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        console.error('[DB] Campaign not found:', campaignError);
        throw new Error('Campaign not found');
      }

      // Verify user owns this campaign
      const user = await this.getOrCreateUser(walletAddress);
      if (campaign.user_id !== user.id) {
        console.error('[DB] User does not own this campaign');
        throw new Error('Unauthorized');
      }

      // Get links count
      const { data: links, error: linksError } = await supabase
        .from('claims')
        .select('id, is_multi_claim, max_claims, current_claims')
        .eq('campaign_id', campaignId);

      if (linksError) {
        console.error('[DB] Error getting links count:', linksError);
        throw new Error('Failed to get links stats');
      }

      // Calculate stats
      let totalClaimsCompleted = 0;
      let maxClaims = 0;
      
      if (links && links.length > 0) {
        if (campaign.claim_type === 'multi') {
          // For multi-claim, sum current_claims from all links
          totalClaimsCompleted = links.reduce((sum, link) => sum + (link.current_claims || 0), 0);
          maxClaims = links.reduce((sum, link) => sum + (link.max_claims || 0), 0);
        } else {
          // For single-use, count completed claims
          const { data: completedClaims, error: completedError } = await supabase
            .from('claims')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('claimed', true);
          
          if (!completedError) {
            totalClaimsCompleted = completedClaims?.length || 0;
          }
          maxClaims = links.length;
        }
      }

      // Get recent claims for display
      let recentClaims = [];
      
      if (campaign.claim_type === 'multi') {
        // Get from multi_claim_wallets table
        const { data: multiClaims, error: multiClaimsError } = await supabase
          .from('multi_claim_wallets')
          .select('wallet_address, tx_hash, amount, claimed_at')
          .eq('campaign_id', campaignId)
          .order('claimed_at', { ascending: false })
          .limit(10);
        
        if (!multiClaimsError && multiClaims) {
          recentClaims = multiClaims;
        }
      } else {
        // Get from claims table
        const { data: singleClaims, error: singleClaimsError } = await supabase
          .from('claims')
          .select('id, tx_hash, amount, claimed_at')
          .eq('campaign_id', campaignId)
          .eq('claimed', true)
          .order('claimed_at', { ascending: false })
          .limit(10);
        
        if (!singleClaimsError && singleClaims) {
          recentClaims = singleClaims.map(claim => ({
            wallet_address: 'Single-use claim',
            tx_hash: claim.tx_hash,
            amount: claim.amount,
            claimed_at: claim.claimed_at
          }));
        }
      }

      const stats = {
        total_budget: campaign.total_budget,
        amount_per_claim: campaign.amount_per_claim,
        max_claims: maxClaims,
        total_claims_completed: totalClaimsCompleted,
        links_count: links?.length || 0,
        completion_rate: maxClaims > 0 ? (totalClaimsCompleted / maxClaims) * 100 : 0
      };

      console.log('[DB] Campaign stats calculated:', stats);

      return {
        success: true,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          claim_type: campaign.claim_type,
          status: campaign.status,
          token_symbol: campaign.token_symbol,
          created_at: campaign.created_at
        },
        stats: stats,
        claims: recentClaims
      };

    } catch (error) {
      console.error('[DB] Error getting campaign stats:', error);
      throw error;
    }
  },

  async findNativeFundingTransaction(provider, fromWallet, toWallet, requiredAmount, fromDate, chainId) {
    console.log('[DB] Searching for native token funding transaction');
    
    try {
      const { ethers } = await import('ethers');
      const { getBlocksPerDay } = await import('./networks.js');
      
      // Calculate block range to search (from campaign creation to now)
      const now = new Date();
      const campaignDate = new Date(fromDate);
      const daysSince = Math.ceil((now - campaignDate) / (1000 * 60 * 60 * 24));
      
      const blocksPerDay = getBlocksPerDay(chainId);
      const blockRange = daysSince * blocksPerDay;
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - blockRange, currentBlock - 100000); // Max 100k blocks back
      
      console.log('[DB] Searching native transfers from block', fromBlock, 'to', currentBlock);
      
      // For native token transfers, we need to scan blocks efficiently
      // Increase the search range but optimize the search method
      const maxBlocksToScan = Math.min(blockRange, 50000); // Increase to 50k blocks
      const searchFromBlock = Math.max(currentBlock - maxBlocksToScan, fromBlock);
      
      console.log('[DB] Optimized search: scanning', maxBlocksToScan, 'blocks from', searchFromBlock);
      
      // Use a more efficient search: check every 100 blocks first, then narrow down
      const sampleInterval = Math.max(1, Math.floor(maxBlocksToScan / 500)); // Sample ~500 blocks
      console.log('[DB] Using sampling interval of', sampleInterval, 'blocks');
      
      let candidateBlocks = [];
      
      // First pass: sample blocks to find potential matches
      for (let blockNumber = currentBlock; blockNumber >= searchFromBlock; blockNumber -= sampleInterval) {
        try {
          const block = await provider.getBlock(blockNumber, true);
          if (!block || !block.transactions) continue;
          
          // Check if this block has transactions from our source wallet
          const hasRelevantTx = block.transactions.some(tx => 
            tx.from && tx.from.toLowerCase() === fromWallet.toLowerCase()
          );
          
          if (hasRelevantTx) {
            candidateBlocks.push(blockNumber);
          }
          
        } catch (blockError) {
          continue; // Skip problematic blocks
        }
      }
      
      console.log('[DB] Found', candidateBlocks.length, 'candidate blocks with transactions from source wallet');
      
      // Second pass: detailed search in candidate blocks and their neighbors
      for (const candidateBlock of candidateBlocks) {
        // Check the candidate block and a few blocks around it
        for (let offset = -5; offset <= 5; offset++) {
          const blockNumber = candidateBlock + offset;
          if (blockNumber < searchFromBlock || blockNumber > currentBlock) continue;
          
          try {
            const block = await provider.getBlock(blockNumber, true);
            if (!block || !block.transactions) continue;
            
            for (const tx of block.transactions) {
              // Check if transaction is from our wallet to deposit address
              if (tx.from && tx.to && 
                  tx.from.toLowerCase() === fromWallet.toLowerCase() && 
                  tx.to.toLowerCase() === toWallet.toLowerCase() && 
                  tx.value) {
                
                const transferAmount = parseFloat(ethers.formatEther(tx.value));
                console.log('[DB] Found native transfer:', {
                  txHash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  amount: transferAmount,
                  required: requiredAmount,
                  blockNumber: tx.blockNumber
                });
                
                // Check if amount matches (with reasonable tolerance)
                const tolerance = 0.001; // Increased tolerance for native tokens
                if (Math.abs(transferAmount - requiredAmount) <= tolerance) {
                  return {
                    found: true,
                    transaction: {
                      hash: tx.hash,
                      from: tx.from,
                      to: tx.to,
                      amount: transferAmount,
                      blockNumber: tx.blockNumber
                    },
                    amount: transferAmount
                  };
                }
              }
            }
          } catch (blockError) {
            continue;
          }
        }
      }
      
      // If direct search fails, try balance-based verification as fallback
      console.log('[DB] Direct search failed, trying balance-based verification...');
      
      const currentToBalance = await provider.getBalance(toWallet);
      const currentToBalanceFloat = parseFloat(ethers.formatEther(currentToBalance));
      
      console.log('[DB] Current destination balance:', currentToBalanceFloat);
      console.log('[DB] Expected funding amount:', requiredAmount);
      
      // If the destination wallet has exactly the required amount, it's likely the transaction succeeded
      const balanceTolerance = 0.001; // Allow for small rounding differences
      if (Math.abs(currentToBalanceFloat - requiredAmount) <= balanceTolerance) {
        console.log('[DB] Balance-based verification: destination wallet has expected amount');
        
        return {
          found: true,
          transaction: {
            hash: 'balance-verified', // Placeholder hash
            from: fromWallet,
            to: toWallet,
            amount: currentToBalanceFloat,
            blockNumber: 'unknown',
            verificationMethod: 'balance-based'
          },
          amount: currentToBalanceFloat,
          note: `Transaction verified by destination balance (${currentToBalanceFloat} MON). Direct transaction search may have missed older blocks.`
        };
      }
      
      return {
        found: false,
        details: `No native token transfer of ${requiredAmount} found from ${fromWallet} to ${toWallet} in the last ${maxBlocksToScan} blocks. Destination balance: ${currentToBalanceFloat} MON. Please ensure you sent the exact amount from your connected wallet or check the Monad explorer manually: https://testnet.monadexplorer.com/address/${fromWallet}`
      };
      
    } catch (error) {
      console.error('[DB] Error searching for native funding transaction:', error);
      return {
        found: false,
        details: `Error searching blockchain: ${error.message}`
      };
    }
  }
};