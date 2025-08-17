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

  async save(id, amount, expires_at = null) {
    console.log('[DB] Saving claim:', { id, amount, expires_at });
    const { error } = await supabase
      .from('claims')
      .insert({ id, amount, status: 'new', claimed: false, expires_at });
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
  async saveMultiClaim(id, amount, maxClaims, expires_at = null) {
    console.log('[DB] Saving multi-claim:', { id, amount, maxClaims, expires_at });
    const { error } = await supabase
      .from('claims')
      .insert({ 
        id, 
        amount, 
        expires_at,
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

  async checkWalletAlreadyClaimed(claimId, walletAddress) {
    console.log('[DB] Checking if wallet already claimed:', { claimId, walletAddress });
    const { data, error } = await supabase
      .from('multi_claim_wallets')
      .select('id, tx_hash, amount, claimed_at')
      .eq('claim_id', claimId)
      .eq('wallet_address', walletAddress.toLowerCase())
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

    // Check if wallet already claimed
    const alreadyClaimed = await this.checkWalletAlreadyClaimed(claimId, walletAddress);
    if (alreadyClaimed) {
      console.log('[DB] Wallet already claimed from this link');
      return { error: 'already_claimed', claimData: alreadyClaimed };
    }

    console.log('[DB] Multi-claim reservation successful:', claimData);
    return claimData;
  },

  async markMultiClaimed(claimId, walletAddress, txHash, amount) {
    console.log('[DB] Marking multi-claim as completed:', { claimId, walletAddress, txHash, amount });
    
    try {
      // Insert the wallet claim record
      const { error: insertError } = await supabase
        .from('multi_claim_wallets')
        .insert({
          claim_id: claimId,
          wallet_address: walletAddress.toLowerCase(),
          tx_hash: txHash,
          amount: amount
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

  async rollbackMultiClaim(claimId, walletAddress) {
    console.log('[DB] Rolling back multi-claim for wallet:', { claimId, walletAddress });
    
    try {
      // Remove wallet claim record if it exists
      const { error: deleteError } = await supabase
        .from('multi_claim_wallets')
        .delete()
        .eq('claim_id', claimId)
        .eq('wallet_address', walletAddress.toLowerCase());

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
  }
};