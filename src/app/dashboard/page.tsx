'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Plus, 
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
import { getNetworkInfo, getExplorerUrl } from '@/lib/networks.js';
import type { Campaign, FundingResult, ClaimLink, CampaignStats } from '@/types/database';

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected, disconnectWallet } = useWallet();
  
  // Form states (removed legacy form variables)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [checkingFunding, setCheckingFunding] = useState<string | null>(null);
  const [fundingResults, setFundingResults] = useState<Record<string, FundingResult>>({});
  const [campaignLinks, setCampaignLinks] = useState<Record<string, ClaimLink[]>>({});
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>({});
  const [showLinksModal, setShowLinksModal] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
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
  }, [address]);

  // Load campaigns when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadCampaigns();
    }
  }, [isConnected, address, loadCampaigns]);

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
            <div className="flex items-center gap-3">
              <Image 
                src="/chingadrop-logo.svg" 
                alt="CHINGADROP" 
                width={40} 
                height={40}
                className="opacity-80"
              />
              <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            </div>
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
              Create new token distribution campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/campaigns/create"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-primary/30 bg-gradient-to-b from-primary to-primary/80 px-6 py-4 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Plus className="h-4 w-4" />
              Create New Campaign
            </Link>
          </CardContent>
        </Card>


        {/* My Campaigns - Modern Grid Layout */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-background via-background to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  My Campaigns
                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-primary/15 text-primary text-sm font-bold">
                    {campaigns.length}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage your token distribution campaigns across multiple networks
                </CardDescription>
              </div>
              {campaigns.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted font-medium">
                    {campaigns.filter(c => c.status === 'active').length} Active
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="text-sm text-muted font-medium">
                    {campaigns.filter(c => c.status === 'pending_funding').length} Pending
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Loading your campaigns...</p>
                    <p className="text-xs text-muted">Fetching data from blockchain</p>
                  </div>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-6">
                  <Shield className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
                <p className="text-sm text-muted mb-6 max-w-md mx-auto">
                  Create your first token distribution campaign to get started with decentralized airdrops
                </p>
                <Link 
                  href="/campaigns/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {campaigns.map((campaign) => {
                  const network = getNetworkInfo(campaign.chain_id);
                  const isActive = campaign.status === 'active';
                  const isPending = campaign.status === 'pending_funding';
                  
                  return (
                    <div
                      key={campaign.id}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                        isActive 
                          ? 'border-success/30 bg-gradient-to-br from-success/5 via-background to-success/5 hover:border-success/50 hover:shadow-success/20' 
                          : isPending
                          ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-background to-yellow-500/5 hover:border-yellow-500/50 hover:shadow-yellow-500/20'
                          : 'border-border bg-gradient-to-br from-background to-muted/20 hover:border-border hover:shadow-muted/20'
                      }`}
                    >
                      {/* Header */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground text-lg leading-tight">
                                {campaign.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  isActive 
                                    ? 'bg-success/20 text-success' 
                                    : isPending
                                    ? 'bg-yellow-500/20 text-yellow-600'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {campaign.status.replace('_', ' ')}
                                </span>
                                {campaign.links_generated && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    Links Ready
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">
                                    {campaign.token_symbol?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <span className="font-semibold text-foreground">{campaign.token_symbol}</span>
                              </div>
                              <div className="h-4 w-px bg-border" />
                              <div className="text-muted">
                                <span className="font-semibold text-foreground">{campaign.amount_per_claim}</span> per claim
                              </div>
                              <div className="h-4 w-px bg-border" />
                              <div className="text-muted">
                                <span className="font-semibold text-primary capitalize">{campaign.claim_type}</span> use
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-60 hover:opacity-100 h-8 w-8 p-0"
                            onClick={() => navigator.clipboard.writeText(campaign.id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Network & Budget Info */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {network && (
                              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-border/50">
                                <span className="text-sm">{network.icon}</span>
                                <span className="text-xs font-medium text-foreground">{network.shortName}</span>
                              </div>
                            )}
                            {campaign.total_budget && (
                              <div className="px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-xs font-semibold text-primary">
                                  {campaign.total_budget} {campaign.token_symbol} Budget
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-muted">Created</div>
                            <div className="text-xs font-semibold text-foreground">
                              {new Date(campaign.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Active Campaign Actions */}
                          {isActive && (
                            <>
                              {campaign.links_generated ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => getCampaignLinks(campaign.id)}
                                    disabled={loadingStates[campaign.id] === 'links'}
                                    className="flex-1 min-w-0 bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 text-xs"
                                  >
                                    {loadingStates[campaign.id] === 'links' ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
                                    ) : (
                                      <Eye className="h-3 w-3 mr-1.5" />
                                    )}
                                    View Links
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => getCampaignStats(campaign.id)}
                                    disabled={loadingStates[campaign.id] === 'stats'}
                                    className="flex-1 min-w-0 text-xs"
                                  >
                                    {loadingStates[campaign.id] === 'stats' ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
                                    ) : (
                                      <BarChart3 className="h-3 w-3 mr-1.5" />
                                    )}
                                    Analytics
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => generateCampaignLinks(campaign.id)}
                                  disabled={loadingStates[campaign.id] === 'generating'}
                                  className="w-full text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                >
                                  {loadingStates[campaign.id] === 'generating' ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                                      Generating Links...
                                    </>
                                  ) : (
                                    <>
                                      <LinkIcon className="h-3 w-3 mr-2" />
                                      Generate Distribution Links
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                          
                          {/* Pending Campaign Actions */}
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checkCampaignFunding(campaign.id)}
                              disabled={checkingFunding === campaign.id}
                              className="w-full text-xs bg-yellow-500/5 border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/10"
                            >
                              {checkingFunding === campaign.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                                  Checking Funding...
                                </>
                              ) : (
                                <>
                                  <Search className="h-3 w-3 mr-2" />
                                  Verify Funding Status
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Funding Information Panel */}
                      {isPending && (
                        <div className="border-t border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-yellow-500/20">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </div>
                            <span className="font-semibold text-yellow-700">Awaiting Token Deposit</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-yellow-700/70 uppercase tracking-wide font-semibold mb-1">Required Amount</div>
                                <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                  <span className="font-bold text-yellow-700 text-lg">
                                    {campaign.total_budget || campaign.required_balance}
                                  </span>
                                  <span className="text-yellow-600 ml-2 font-semibold">{campaign.token_symbol}</span>
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-yellow-700/70 uppercase tracking-wide font-semibold mb-1">Token Type</div>
                                <div className="text-sm text-yellow-700 font-medium">
                                  {campaign.token_address === 'NATIVE' || campaign.token_address?.toLowerCase() === 'native' 
                                    ? `${network?.icon || '🟣'} Native Token (${campaign.token_symbol})`
                                    : '🔧 ERC-20 Contract'
                                  }
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {campaign.deposit_address && (
                                <div>
                                  <div className="text-xs text-yellow-700/70 uppercase tracking-wide font-semibold mb-1">Deposit Address</div>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5 rounded font-mono text-yellow-700 truncate">
                                      {campaign.deposit_address}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                                      onClick={() => campaign.deposit_address && navigator.clipboard.writeText(campaign.deposit_address)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {network && getExplorerUrl(campaign.chain_id) && (
                                <div>
                                  <div className="text-xs text-yellow-700/70 uppercase tracking-wide font-semibold mb-1">Network Explorer</div>
                                  <a
                                    href={getExplorerUrl(campaign.chain_id)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {network.name} Explorer
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <div className="flex items-center gap-2 text-xs text-yellow-700/80 mb-2">
                              <span className="text-lg">💡</span>
                              <span className="font-semibold uppercase tracking-wide">Quick Instructions</span>
                            </div>
                            <div className="text-xs text-yellow-700 space-y-1 font-medium">
                              <div>• Send <strong>{campaign.total_budget || campaign.required_balance} {campaign.token_symbol}</strong> from your connected wallet</div>
                              <div>• Use the deposit address above as the recipient</div>
                              <div>• Click &quot;Verify Funding&quot; once transaction confirms</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Funding Status Results */}
                      {fundingResults[campaign.id] && (
                        <div className={`border-t p-4 ${
                          fundingResults[campaign.id].funded 
                            ? 'border-success/20 bg-success/5' 
                            : 'border-destructive/20 bg-destructive/5'
                        }`}>
                          <div className="flex items-start gap-3">
                            {fundingResults[campaign.id].funded ? (
                              <div className="p-1.5 rounded-lg bg-success/20">
                                <CheckCircle className="h-4 w-4 text-success" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-lg bg-destructive/20">
                                <XCircle className="h-4 w-4 text-destructive" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className={`font-semibold text-sm ${
                                fundingResults[campaign.id].funded ? 'text-success' : 'text-destructive'
                              }`}>
                                {fundingResults[campaign.id].funded ? '🎉 Funding Verified!' : 'Funding Not Detected'}
                              </div>
                              <div className="text-xs text-muted mt-1">
                                {fundingResults[campaign.id].message || fundingResults[campaign.id].details}
                              </div>
                              {fundingResults[campaign.id].transaction?.hash && (
                                <div className="text-xs text-muted mt-2 font-mono bg-background/50 px-2 py-1 rounded">
                                  TX: {fundingResults[campaign.id].transaction!.hash.substring(0, 20)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


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
                  {campaignLinks[showLinksModal].map((link, index: number) => (
                    <div 
                      key={(link as ClaimLink).id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border"
                    >
                      <span className="text-sm text-muted w-8">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                            {(link as ClaimLink).type}
                          </span>
                          {(link as ClaimLink).status === 'claimed' && (
                            <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">
                              Claimed
                            </span>
                          )}
                          {(link as ClaimLink).claimsUsed && (link as ClaimLink).claimsUsed! > 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                              {(link as ClaimLink).claimsUsed} claimed
                            </span>
                          )}
                        </div>
                        <code className="text-xs font-mono text-foreground">
                          {`${window.location.origin}${(link as ClaimLink).url}`}
                        </code>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}${(link as ClaimLink).url}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`${window.location.origin}${(link as ClaimLink).url}`, '_blank')}
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
                      {campaignStats[showStatsModal].recentClaims!.map((claim, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="font-mono text-xs text-foreground">
                            {(claim as { claimerAddress: string }).claimerAddress.substring(0, 10)}...{(claim as { claimerAddress: string }).claimerAddress.substring((claim as { claimerAddress: string }).claimerAddress.length - 8)}
                          </div>
                          <div className="text-xs text-muted">
                            {new Date((claim as { claimedAt: string }).claimedAt).toLocaleDateString()}
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