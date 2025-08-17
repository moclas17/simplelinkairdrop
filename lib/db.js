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
        deposit_address: process.env.HOT_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b8D77d4120F34e0c4c', // Use env var
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
  }
};