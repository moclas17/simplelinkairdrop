// Database types for campaigns and related entities

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: 'pending_funding' | 'active' | 'completed' | 'expired';
  token_address: string;
  token_symbol: string;
  chain_id: number;
  amount_per_claim: number;
  total_claims: number;
  max_claims_per_link: number;
  claim_type: 'single' | 'multi';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  total_budget?: number;
  required_balance?: number;
  deposit_address?: string;
  links_generated?: boolean;
}

export interface User {
  id: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimLink {
  id: string;
  url: string;
  type: 'single' | 'multi';
  amount: number;
  maxClaims?: number;
  status?: 'active' | 'claimed' | 'expired';
  claimsUsed?: number;
  campaign_id: string;
  created_at: string;
}

export interface DatabaseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FundingResult {
  funded: boolean;
  campaign?: Campaign;
  transaction?: {
    hash: string;
    from: string;
    to: string;
    amount: number;
    blockNumber: number;
  };
  amount?: number;
  message?: string;
  error?: string;
  details?: string;
}

export interface CampaignStats {
  totalClaims: number;
  successfulClaims: number;
  tokensDistributed: number;
  completionRate: number;
  recentClaims?: Array<{
    claimerAddress: string;
    claimedAt: string;
    amount: number;
    txHash?: string;
  }>;
}

export interface GenerateLinksResult {
  success: boolean;
  message: string;
  linksCount: number;
  links: ClaimLink[];
  campaign?: Campaign;
  totalBudget?: number;
}