// Archivo: lib/db.js (Supabase adapter)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE; // **server only**

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn('[db] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

export default {
  async get(id) {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return data;
  },
  async save(id, amount, expires_at = null) {
    const { error } = await supabase
      .from('claims')
      .insert({ id, amount, status: 'new', claimed: false, expires_at });
    if (error) throw error;
  },
  async reserve(id) {
    // Mark as processing only if not claimed yet and status is 'new'
    const { data, error } = await supabase
      .from('claims')
      .update({ status: 'processing' })
      .eq('id', id)
      .eq('claimed', false)
      .eq('status', 'new')
      .select()
      .maybeSingle();
    if (error || !data) return null;
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
  }
};
