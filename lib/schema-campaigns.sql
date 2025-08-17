-- Migration: Add Campaign System
-- This allows wallets to claim from multiple campaigns

-- Step 1: Add campaign_id column to existing claims table
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS campaign_id text DEFAULT 'default';

-- Step 2: Update multi_claim_wallets table to include campaign context
-- First check if the table exists (it should from previous migrations)
DO $$ 
BEGIN
    -- Add campaign_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'multi_claim_wallets' 
        AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE public.multi_claim_wallets 
        ADD COLUMN campaign_id text DEFAULT 'default';
    END IF;
END $$;

-- Step 3: Update unique constraint for multi_claim_wallets
-- Drop old constraint and create new one that includes campaign_id
DO $$
BEGIN
    -- Drop existing unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'multi_claim_wallets_unique_wallet_per_claim'
    ) THEN
        ALTER TABLE public.multi_claim_wallets 
        DROP CONSTRAINT multi_claim_wallets_unique_wallet_per_claim;
    END IF;
    
    -- Create new unique constraint: one claim per wallet per claim_id per campaign
    ALTER TABLE public.multi_claim_wallets 
    ADD CONSTRAINT multi_claim_wallets_unique_wallet_per_claim_campaign 
    UNIQUE (claim_id, wallet_address, campaign_id);
END $$;

-- Step 4: Add helpful indexes for campaign-based queries
CREATE INDEX IF NOT EXISTS claims_campaign_idx ON public.claims(campaign_id);
CREATE INDEX IF NOT EXISTS multi_claim_wallets_campaign_idx ON public.multi_claim_wallets(campaign_id);
CREATE INDEX IF NOT EXISTS multi_claim_wallets_wallet_campaign_idx ON public.multi_claim_wallets(wallet_address, campaign_id);

-- Step 5: Update existing records to use 'default' campaign
UPDATE public.claims SET campaign_id = 'default' WHERE campaign_id IS NULL;
UPDATE public.multi_claim_wallets SET campaign_id = 'default' WHERE campaign_id IS NULL;

-- Step 6: Make campaign_id required (NOT NULL) after setting defaults
ALTER TABLE public.claims ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE public.multi_claim_wallets ALTER COLUMN campaign_id SET NOT NULL;

-- Example campaigns for reference:
-- campaign_id examples: 'launch-airdrop', 'community-rewards', 'referral-bonus', 'holiday-special'