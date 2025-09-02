export interface ApiError {
  error: string;
  details?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  token_address: string;
  token_symbol: string;
  token_decimals: number;
  chain_id?: number;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ClaimLink {
  id: string;
  amount: number;
  claimed: boolean;
  status: 'new' | 'processing' | 'done' | 'failed';
  tx_hash: string | null;
  created_at: string;
  claimed_at: string | null;
  expires_at: string | null;
  is_multi_claim: boolean;
  max_claims: number;
  current_claims: number;
  campaign_id: string;
  user_id?: string | null;
}

export interface DashboardStats {
  totalCampaigns: number;
  totalLinks: number;
  totalClaimed: number;
  totalAmount: string;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'claim' | 'generate' | 'campaign';
  description: string;
  timestamp: string;
  amount?: number;
  tx_hash?: string;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
}