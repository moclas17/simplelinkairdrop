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
  const { address, isConnected, isAdmin, openModal } = useWallet();
  
  // Form states
  const [count, setCount] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [error, setError] = useState('');

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
          campaign_id: 'wallet-auth-campaign'
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isConnected || !isAdmin) {
      router.push('/login');
    }
  }, [isConnected, isAdmin, router]);

  // Show loading if not authenticated
  if (!isConnected || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Checking authentication...</p>
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
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          
          {/* User info and logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border">
              <Shield className="h-4 w-4 text-success" />
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
              Create new token claim links for distribution
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
                  Wallet-Based Authentication
                </h3>
                <p className="text-sm text-muted">
                  This dashboard is now secured with wallet-based authentication using Reown (WalletConnect). 
                  Only authorized wallet addresses can access admin functions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}