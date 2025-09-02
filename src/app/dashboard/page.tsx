'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Copy, 
  ExternalLink, 
  Wallet,
  LogOut,
  Shield,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getNetworkInfo, getExplorerUrl } from '../../../lib/networks.js';

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected, disconnectWallet } = useWallet();
  
  // Form states
  const [count, setCount] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [checkingFunding, setCheckingFunding] = useState<string | null>(null);
  const [fundingResults, setFundingResults] = useState<Record<string, any>>({});
  const [campaignLinks, setCampaignLinks] = useState<Record<string, any>>({});
  const [campaignStats, setCampaignStats] = useState<Record<string, any>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>({});
  const [showLinksModal, setShowLinksModal] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<string | null>(null);

  // Load campaigns when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadCampaigns();
    }
  }, [isConnected, address]);

  const loadCampaigns = async () => {
    if (!address) {
      console.error('No wallet address for loading campaigns');
      return;
    }
    
    console.log('Loading campaigns for wallet:', address);
    setLoadingCampaigns(true);
    
    try {
      const url = `/api/campaigns?wallet=${address}`;
      console.log('Fetching campaigns from:', url);
      
      const response = await fetch(url);
      console.log('Campaigns response status:', response.status);
      console.log('Campaigns response ok:', response.ok);
      
      const data = await response.json();
      console.log('Campaigns response data:', data);
      
      if (response.ok) {
        console.log('Setting campaigns:', data.campaigns?.length || 0, 'campaigns');
        setCampaigns(data.campaigns || []);
      } else {
        console.error('Failed to load campaigns:', data.error);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const checkCampaignFunding = async (campaignId: string) => {
    if (!address) {
      console.error('No wallet address available');
      return;
    }
    
    console.log('Starting funding check for campaign:', campaignId, 'wallet:', address);
    setCheckingFunding(campaignId);
    
    try {
      // Use simplified endpoint temporarily to debug
      const url = `/api/check-funding-simple`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaignId,
          walletAddress: address
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);
      
      // Store the result
      setFundingResults(prev => ({
        ...prev,
        [campaignId]: data
      }));

      if (data.funded) {
        console.log('Campaign funded! Refreshing campaigns...');
        // Refresh campaigns to get updated status
        loadCampaigns();
      } else {
        console.log('Campaign not funded:', data.details || data.error);
      }
      
    } catch (error) {
      console.error('Error checking funding:', error);
      setFundingResults(prev => ({
        ...prev,
        [campaignId]: {
          success: false,
          funded: false,
          error: `Failed to check funding: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setCheckingFunding(null);
    }
  };

  const getCampaignLinks = async (campaignId: string) => {
    if (!address) return;
    
    setLoadingStates(prev => ({ ...prev, [campaignId]: 'links' }));
    try {
      const response = await fetch('/api/campaigns/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, walletAddress: address }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCampaignLinks(prev => ({ ...prev, [campaignId]: data.links }));
        setShowLinksModal(campaignId);
      } else {
        console.error('Failed to get links:', data.error);
      }
    } catch (error) {
      console.error('Error getting links:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [campaignId]: '' }));
    }
  };

  const getCampaignStats = async (campaignId: string) => {
    if (!address) return;
    
    setLoadingStates(prev => ({ ...prev, [campaignId]: 'stats' }));
    try {
      const response = await fetch('/api/campaigns/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, walletAddress: address }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCampaignStats(prev => ({ ...prev, [campaignId]: data.stats }));
        setShowStatsModal(campaignId);
      } else {
        console.error('Failed to get stats:', data.error);
      }
    } catch (error) {
      console.error('Error getting stats:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [campaignId]: '' }));
    }
  };

  const generateCampaignLinks = async (campaignId: string) => {
    if (!address) return;
    
    setLoadingStates(prev => ({ ...prev, [campaignId]: 'generating' }));
    try {
      const response = await fetch('/api/campaigns/generate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, walletAddress: address }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCampaignLinks(prev => ({ ...prev, [campaignId]: data.links }));
        setShowLinksModal(campaignId);
        loadCampaigns(); // Refresh to update links_generated status
      } else {
        console.error('Failed to generate links:', data.error);
      }
    } catch (error) {
      console.error('Error generating links:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [campaignId]: '' }));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setGeneratedLinks([]);

    try {
      const response = await fetch('/api/claims/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': process.env.NEXT_PUBLIC_ADMIN_TOKEN || '2b73c9c4e023564e6f91f7f5e74291c3b4',
        },
        body: JSON.stringify({
          count: parseInt(count),
          amount: parseFloat(amount),
          expiresInHours: expiresInHours ? parseFloat(expiresInHours) : null,
          campaign_id: address, // Use wallet address as campaign_id
          wallet_address: address // Add wallet address to request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate links');
      }

      const data = await response.json();
      setGeneratedLinks(data.links);
    } catch (err: any) {
      setError(err.message || 'Failed to generate links');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadLinks = () => {
    const content = generatedLinks.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-links-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    // Disconnect wallet directly
    disconnectWallet();
  };

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/login');
    }
  }, [isConnected, router]);

  // Show loading if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Connecting to wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          </div>
          
          {/* User info and logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border">
              <Wallet className="h-4 w-4 text-success" />
              <span className="text-sm font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Create new campaigns or generate links for existing ones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/campaigns/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-gradient-to-b from-primary to-primary/80 px-6 py-4 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Plus className="h-4 w-4" />
                Create New Campaign
              </Link>
              
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-secondary px-6 py-4 text-sm font-medium text-secondary-foreground opacity-75">
                <Shield className="h-4 w-4" />
                Generate Links (Select Campaign)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Quick Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Legacy: Quick Generate Links
            </CardTitle>
            <CardDescription>
              Quick generation using wallet address as campaign ID (legacy method)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="count" className="block text-sm font-medium text-foreground mb-2">
                    Number of Links
                  </label>
                  <Input
                    id="count"
                    type="number"
                    placeholder="10"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    min="1"
                    max="100"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
                    Amount per Link
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="any"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="expires" className="block text-sm font-medium text-foreground mb-2">
                    Expires In (Hours)
                  </label>
                  <Input
                    id="expires"
                    type="number"
                    placeholder="24 (optional)"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isGenerating || !count || !amount}
                className="w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Links
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              My Campaigns ({campaigns.length})
            </CardTitle>
            <CardDescription>
              Your previous token distribution campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="ml-2 text-muted">Loading campaigns...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns found</p>
                <p className="text-sm">Create your first campaign above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{campaign.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'active' 
                            ? 'bg-success/20 text-success' 
                            : campaign.status === 'pending_funding'
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted">
                        {campaign.token_symbol} • {campaign.amount_per_claim} per claim • {campaign.claim_type} claim
                      </div>
                      <div className="text-xs text-muted mt-1">
                        Created: {new Date(campaign.created_at).toLocaleDateString()}
                        {campaign.total_budget && (
                          <span> • Budget: {campaign.total_budget} {campaign.token_symbol}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {campaign.links_generated && (
                        <span className="text-xs text-success">Links Generated</span>
                      )}
                      
                      {/* Buttons for active campaigns */}
                      {campaign.status === 'active' && (
                        <>
                          {campaign.links_generated ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => getCampaignLinks(campaign.id)}
                                disabled={loadingStates[campaign.id] === 'links'}
                                className="text-xs"
                              >
                                {loadingStates[campaign.id] === 'links' ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                                ) : (
                                  <Eye className="h-3 w-3 mr-1" />
                                )}
                                View Links
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => getCampaignStats(campaign.id)}
                                disabled={loadingStates[campaign.id] === 'stats'}
                                className="text-xs"
                              >
                                {loadingStates[campaign.id] === 'stats' ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                                ) : (
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                )}
                                Stats
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateCampaignLinks(campaign.id)}
                              disabled={loadingStates[campaign.id] === 'generating'}
                              className="text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                            >
                              {loadingStates[campaign.id] === 'generating' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  Generate Links
                                </>
                              )}
                            </Button>
                          )}
                        </>
                      )}
                      
                      {/* Check Funding Button for pending campaigns */}
                      {campaign.status === 'pending_funding' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkCampaignFunding(campaign.id)}
                          disabled={checkingFunding === campaign.id}
                          className="text-xs"
                        >
                          {checkingFunding === campaign.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Search className="h-3 w-3 mr-1" />
                              Check Funding
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(campaign.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Funding Information for pending campaigns */}
                    {campaign.status === 'pending_funding' && (
                      <div className="mt-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-600">Funding Required</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted uppercase tracking-wide">Amount to Send</div>
                              <div className="font-mono text-foreground">
                                {campaign.total_budget || campaign.required_balance} {campaign.token_symbol}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted uppercase tracking-wide">Token Type</div>
                              <div className="text-foreground">
                                {campaign.token_address === 'NATIVE' || campaign.token_address?.toLowerCase() === 'native' 
                                  ? `Native Token (${campaign.token_symbol})`
                                  : 'ERC-20 Token'
                                }
                              </div>
                            </div>
                          </div>
                          
                          {campaign.deposit_address && (
                            <div>
                              <div className="text-xs text-muted uppercase tracking-wide">Send To Address</div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono text-foreground break-all">
                                  {campaign.deposit_address}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => navigator.clipboard.writeText(campaign.deposit_address)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {campaign.token_address && campaign.token_address !== 'NATIVE' && campaign.token_address?.toLowerCase() !== 'native' && (
                            <div>
                              <div className="text-xs text-muted uppercase tracking-wide">Token Contract</div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono text-foreground break-all">
                                  {campaign.token_address}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => navigator.clipboard.writeText(campaign.token_address)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {campaign.chain_id && (
                            <div>
                              <div className="text-xs text-muted uppercase tracking-wide">Network</div>
                              <div className="flex items-center gap-2">
                                <div className="text-foreground">
                                  {(() => {
                                    const network = getNetworkInfo(campaign.chain_id);
                                    return network 
                                      ? `${network.icon} ${network.name} (${network.currency})` 
                                      : `Chain ID: ${campaign.chain_id}`;
                                  })()}
                                </div>
                                {getExplorerUrl(campaign.chain_id) && (
                                  <a
                                    href={getExplorerUrl(campaign.chain_id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Explorer
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-secondary">
                            <div className="text-xs text-muted mb-1">💡 Instructions:</div>
                            <div className="text-xs text-foreground space-y-1">
                              <div>1. Send exactly <strong>{campaign.total_budget || campaign.required_balance} {campaign.token_symbol}</strong> from your connected wallet</div>
                              <div>2. To address: <strong>{campaign.deposit_address}</strong></div>
                              <div>3. Click "Check Funding" once transaction is confirmed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Funding check results */}
                    {fundingResults[campaign.id] && (
                      <div className="mt-3 p-3 rounded-lg border-t">
                        {fundingResults[campaign.id].funded ? (
                          <div className="flex items-start gap-2 text-sm text-success">
                            <CheckCircle className="h-4 w-4 mt-0.5" />
                            <div>
                              <div className="font-medium">Campaign Funded Successfully!</div>
                              <div className="text-xs text-muted mt-1">
                                {fundingResults[campaign.id].message}
                              </div>
                              {fundingResults[campaign.id].transaction?.hash && (
                                <div className="text-xs text-muted mt-1 font-mono">
                                  TX: {fundingResults[campaign.id].transaction.hash.substring(0, 20)}...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 text-sm text-destructive">
                            <XCircle className="h-4 w-4 mt-0.5" />
                            <div>
                              <div className="font-medium">Funding Not Found</div>
                              <div className="text-xs text-muted mt-1">
                                {fundingResults[campaign.id].details || 'Please ensure you have sent the required tokens to the deposit address.'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Links */}
        {generatedLinks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Links ({generatedLinks.length})</CardTitle>
                  <CardDescription>
                    Share these links with users to claim tokens
                  </CardDescription>
                </div>
                <Button onClick={downloadLinks}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {generatedLinks.map((link, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border"
                  >
                    <span className="text-sm text-muted w-8">
                      {index + 1}.
                    </span>
                    <code className="flex-1 text-xs font-mono text-foreground truncate">
                      {link}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(link)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(link, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Personal Wallet Dashboard
                </h3>
                <p className="text-sm text-muted">
                  This is your personal dashboard. You can generate and manage claim links 
                  associated with your connected wallet address. Other users will only see their own links.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Modal */}
        {showLinksModal && campaignLinks[showLinksModal] && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Campaign Links</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLinksModal(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {campaignLinks[showLinksModal].map((link: any, index: number) => (
                    <div 
                      key={link.id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border"
                    >
                      <span className="text-sm text-muted w-8">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                            {link.type}
                          </span>
                          {link.status === 'claimed' && (
                            <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">
                              Claimed
                            </span>
                          )}
                          {link.claimsUsed > 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                              {link.claimsUsed} claimed
                            </span>
                          )}
                        </div>
                        <code className="text-xs font-mono text-foreground">
                          {`${window.location.origin}${link.url}`}
                        </code>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}${link.url}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`${window.location.origin}${link.url}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Modal */}
        {showStatsModal && campaignStats[showStatsModal] && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Campaign Statistics</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatsModal(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-sm text-muted mb-1">Total Claims</div>
                      <div className="text-2xl font-bold text-foreground">
                        {campaignStats[showStatsModal].totalClaims || 0}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="text-sm text-muted mb-1">Successfully Claimed</div>
                      <div className="text-2xl font-bold text-foreground">
                        {campaignStats[showStatsModal].successfulClaims || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="text-sm text-muted mb-1">Tokens Distributed</div>
                      <div className="text-2xl font-bold text-foreground">
                        {campaignStats[showStatsModal].tokensDistributed || 0}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-sm text-muted mb-1">Completion Rate</div>
                      <div className="text-2xl font-bold text-foreground">
                        {campaignStats[showStatsModal].completionRate || 0}%
                      </div>
                    </div>
                  </div>
                </div>
                
                {campaignStats[showStatsModal].recentClaims && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Recent Claims</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {campaignStats[showStatsModal].recentClaims.map((claim: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="font-mono text-xs text-foreground">
                            {claim.claimerAddress.substring(0, 10)}...{claim.claimerAddress.substring(claim.claimerAddress.length - 8)}
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(claim.claimedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}