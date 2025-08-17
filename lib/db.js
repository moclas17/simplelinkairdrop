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

      return data || [];
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
        token_address: campaignData.tokenAddress,
        token_symbol: campaignData.tokenSymbol,
        token_decimals: campaignData.tokenDecimals,
        claim_type: campaignData.claimType,
        amount_per_claim: campaignData.amountPerClaim,
        max_claims: campaignData.maxClaimsPerLink,
        total_budget: totalBudget,
        required_balance: totalBudget,
        expires_at: expiresAt,
        deposit_address: process.env.HOT_WALLET_ADDRESS || '0x86300E0a857aAB39A601E89b0e7F15e1488d9F0C', // Use correct hot wallet
        status: 'pending_funding'
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
        campaign.created_at       // Search from campaign creation
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

  async checkTokenBalance(walletAddress, tokenAddress, requiredAmount, decimals = 18) {
    console.log('[DB] Checking token balance:', { walletAddress, tokenAddress, requiredAmount });
    
    try {
      // Import ethers here to avoid issues
      const { ethers } = await import('ethers');
      
      // Create provider
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
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

  async findFundingTransaction(fromWallet, toWallet, tokenAddress, requiredAmount, decimals, fromDate) {
    console.log('[DB] Searching for funding transaction:', {
      fromWallet, toWallet, tokenAddress, requiredAmount, fromDate
    });
    
    try {
      // Import ethers
      const { ethers } = await import('ethers');
      
      // Create provider
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
      // ERC20 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
      const transferEventSignature = ethers.id("Transfer(address,address,uint256)");
      
      // Calculate block range to search (from campaign creation to now)
      const now = new Date();
      const campaignDate = new Date(fromDate);
      const blockRange = Math.ceil((now - campaignDate) / (1000 * 60 * 60 * 24)) * 7200; // Estimate blocks per day
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(currentBlock - blockRange, currentBlock - 50000); // Max 50k blocks back
      
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
          blockNumber: log.blockNumber
        });
        
        // Allow small tolerance for decimal precision issues
        const tolerance = 0.001;
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
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const contract = new ethers.Contract(tokenAddress, [
        "function symbol() view returns (string)"
      ], provider);
      return await contract.symbol();
    } catch (error) {
      return 'TOKEN';
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
  }
};