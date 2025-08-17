-- Add multi-claim support to existing claims table
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS is_multi_claim boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_claims integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_claims integer DEFAULT 0;

-- Multi-claim tracking table - tracks which wallets have claimed from each multi-claim link
CREATE TABLE IF NOT EXISTS public.multi_claim_wallets (
  id serial PRIMARY KEY,
  claim_id text NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  tx_hash text NOT NULL,
  amount numeric NOT NULL,
  UNIQUE(claim_id, wallet_address)  -- prevent same wallet claiming twice from same link
);

-- Additional indexes for multi-claim support
CREATE INDEX IF NOT EXISTS claims_multi_idx ON public.claims(is_multi_claim);
CREATE INDEX IF NOT EXISTS multi_claim_wallets_claim_id_idx ON public.multi_claim_wallets(claim_id);
CREATE INDEX IF NOT EXISTS multi_claim_wallets_wallet_idx ON public.multi_claim_wallets(wallet_address);