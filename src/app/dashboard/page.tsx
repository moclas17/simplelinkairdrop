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
  AlertTriangle
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected, openModal } = useWallet();
  
  // Form states
  const [count, setCount] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Load campaigns when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadCampaigns();
    }
  }, [isConnected, address]);

  const loadCampaigns = async () => {
    if (!address) return;
    
    setLoadingCampaigns(true);
    try {
      const response = await fetch(`/api/campaigns?wallet=${address}`);
      const data = await response.json();
      
      if (response.ok) {
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
    // Open AppKit modal to disconnect
    openModal();
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

        {/* Generate Links Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate Claim Links
            </CardTitle>
            <CardDescription>
              Create token claim links from your wallet
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.links_generated && (
                        <span className="text-xs text-success">Links Generated</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Copy campaign ID to clipboard for now
                          navigator.clipboard.writeText(campaign.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
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
      </div>
    </div>
  );
}