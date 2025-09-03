// Common types to replace 'any' usage throughout the project

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RequestContext {
  headers: Record<string, string>;
  query: Record<string, string | string[]>;
  body?: unknown;
  params?: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface NetworkResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
  blockNumber?: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply?: string;
  chainId: number;
  isNative?: boolean;
}

export interface FundingTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  blockNumber: number;
  value?: number;
  verificationMethod?: string;
}

export interface FundingVerification {
  found: boolean;
  transaction?: FundingTransaction;
  amount?: number;
  details?: string;
  note?: string;
}

export interface CampaignFunding {
  campaignId: string;
  amount: number;
  tokenAddress: string;
  chainId: number;
  status: 'pending' | 'verified' | 'failed';
  transaction?: FundingTransaction;
  verifiedAt?: string;
  createdAt: string;
}

export interface DashboardData {
  campaigns: CampaignFunding[];
  totalAmount: number;
  totalCampaigns: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'claim' | 'generate' | 'campaign' | 'funding';
  description: string;
  timestamp: string;
  amount?: number;
  txHash?: string;
  campaignId?: string;
}

export interface GenerateLinksRequest {
  count: number;
  amount: number;
  expiresInHours: number;
  campaignId?: string;
  isMultiClaim?: boolean;
  maxClaims?: number;
}

export interface GenerateLinksResponse {
  links: string[];
  expiresAt: string;
  campaignId?: string;
}

export interface ProcessClaimRequest {
  id: string;
  address: string;
  signature?: string;
}

export interface ProcessClaimResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  warning?: string;
}

export interface ClaimData {
  id: string;
  amount: number;
  claimed: boolean;
  status: 'new' | 'processing' | 'done' | 'failed';
  txHash?: string;
  createdAt: string;
  claimedAt?: string;
  expiresAt?: string;
  isMultiClaim: boolean;
  maxClaims: number;
  currentClaims: number;
  campaignId?: string;
  userId?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  chainId?: number;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
}

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  isLoading: boolean;
  chainId?: number;
  network?: NetworkInfo;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: unknown) => boolean | string;
  };
  options?: Array<{ value: string; label: string }>;
}

export interface FormData {
  [key: string]: unknown;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
  field?: string;
}
