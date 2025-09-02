const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://chingadrop.xyz' 
  : 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  details?: string;
  data?: T;
}

export interface ClaimData {
  id: string;
  amount: number;
  claimed: boolean;
  status: string;
  tx_hash: string | null;
  created_at: string;
  claimed_at: string | null;
  expires_at: string | null;
  is_multi_claim: boolean;
  max_claims: number;
  current_claims: number;
  campaign_id: string;
  campaigns?: {
    token_address: string;
    token_symbol: string;
    token_decimals: number;
    title: string;
    status: string;
    chain_id?: number;
  };
}

export interface GenerateLinksRequest {
  count: number;
  amount: number;
  expiresInHours?: number;
  campaign_id?: string;
}

export interface GenerateLinksResponse {
  links: string[];
  expires_at: string | null;
}

export interface ProcessClaimRequest {
  wallet: string;
  linkId: string;
}

export interface ProcessClaimResponse {
  success: boolean;
  txHash: string;
  warning?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(adminToken: string): Promise<{ success: boolean }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ adminToken }),
    });
  }

  async validateToken(token: string): Promise<{ valid: boolean }> {
    return this.request('/api/auth/validate', {
      method: 'POST',
      headers: { 'x-admin-token': token },
    });
  }

  // Claims
  async getClaimData(id: string): Promise<ClaimData | null> {
    try {
      return await this.request(`/api/claims/${id}`);
    } catch (error) {
      return null;
    }
  }

  async generateLinks(
    data: GenerateLinksRequest, 
    adminToken: string
  ): Promise<GenerateLinksResponse> {
    return this.request('/api/claims/generate', {
      method: 'POST',
      headers: { 'x-admin-token': adminToken },
      body: JSON.stringify(data),
    });
  }

  async processClaim(data: ProcessClaimRequest): Promise<ProcessClaimResponse> {
    return this.request('/api/claims/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats(adminToken: string): Promise<any> {
    return this.request('/api/dashboard/stats', {
      headers: { 'x-admin-token': adminToken },
    });
  }

  async getDashboardActivity(adminToken: string): Promise<any> {
    return this.request('/api/dashboard/activity', {
      headers: { 'x-admin-token': adminToken },
    });
  }

  // Campaigns
  async getCampaigns(adminToken: string): Promise<any[]> {
    return this.request('/api/campaigns', {
      headers: { 'x-admin-token': adminToken },
    });
  }

  async createCampaign(data: any, adminToken: string): Promise<any> {
    return this.request('/api/campaigns/create', {
      method: 'POST',
      headers: { 'x-admin-token': adminToken },
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();