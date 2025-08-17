-- User Management and Campaign System
-- This adds user authentication and campaign management

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  profile jsonb DEFAULT '{}'::jsonb -- Store additional user data
);

-- Campaigns table (enhanced from existing claims)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id text PRIMARY KEY, -- User-friendly campaign ID like "launch-airdrop"
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  token_address text NOT NULL,
  token_symbol text,
  token_decimals integer DEFAULT 18,
  
  -- Campaign configuration
  claim_type text NOT NULL CHECK (claim_type IN ('single', 'multi')), -- single or multi-claim
  amount_per_claim numeric NOT NULL,
  max_claims integer, -- For multi-claim campaigns
  total_budget numeric NOT NULL, -- Total tokens needed
  expires_at timestamptz,
  
  -- Campaign status and funding
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_funding', 'active', 'completed', 'cancelled')),
  required_balance numeric NOT NULL, -- Tokens needed in hot wallet
  current_balance numeric DEFAULT 0, -- Current tokens in hot wallet for this campaign
  deposit_address text, -- Hot wallet address where tokens should be sent
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb -- Store additional campaign data
);

-- Campaign deposits tracking
CREATE TABLE IF NOT EXISTS public.campaign_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  tx_hash text NOT NULL,
  amount numeric NOT NULL,
  block_number bigint,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Update existing claims table to reference campaigns
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Update multi_claim_wallets to reference campaigns and users
ALTER TABLE public.multi_claim_wallets 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS users_wallet_address_idx ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS campaign_deposits_campaign_id_idx ON public.campaign_deposits(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_deposits_tx_hash_idx ON public.campaign_deposits(tx_hash);
CREATE INDEX IF NOT EXISTS claims_user_id_idx ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS multi_claim_wallets_user_id_idx ON public.multi_claim_wallets(user_id);

-- RLS (Row Level Security) policies for multi-tenancy
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_deposits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_own_data ON public.users FOR ALL USING (auth.uid()::text = wallet_address);

-- Users can only see their own campaigns
CREATE POLICY campaigns_own_data ON public.campaigns FOR ALL USING (user_id IN (
  SELECT id FROM public.users WHERE wallet_address = auth.uid()::text
));

-- Users can only see their own deposits
CREATE POLICY deposits_own_data ON public.campaign_deposits FOR ALL USING (user_id IN (
  SELECT id FROM public.users WHERE wallet_address = auth.uid()::text
));

-- Example campaign states:
-- 'draft' -> User is creating campaign
-- 'pending_funding' -> Campaign created, waiting for token deposit
-- 'active' -> Tokens deposited, links can be generated and claimed
-- 'completed' -> All tokens claimed or campaign ended
-- 'cancelled' -> Campaign cancelled by user