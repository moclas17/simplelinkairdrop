-- Migration: Add chain_id column to campaigns table
-- Run this in your Supabase SQL editor to add multi-chain support

-- Add chain_id column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS chain_id INTEGER;

-- Set default chain_id for existing campaigns (Optimism was the original network)
-- Supported networks:
-- Optimism: 10 (original network)
-- Arbitrum: 42161
-- Base: 8453
-- Scroll: 534352
-- Mantle: 5000

-- Set Optimism as default for existing campaigns (original network)
UPDATE campaigns 
SET chain_id = 10 -- Optimism (original network)
WHERE chain_id IS NULL;

-- Add NOT NULL constraint after setting defaults
ALTER TABLE campaigns 
ALTER COLUMN chain_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_chain_id ON campaigns(chain_id);