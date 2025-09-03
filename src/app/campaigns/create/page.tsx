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
  AlertTriangle,
  CheckCircle,
  Coins,
  Settings,
  Shield,
  Clock,
  Network
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getAllNetworks } from '@/lib/networks.js';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [networks] = useState(getAllNetworks());
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [chainId, setChainId] = useState('10'); // Default to Optimism
  const [claimType, setClaimType] = useState('single');
  const [amountPerClaim, setAmountPerClaim] = useState('');
  const [totalClaims, setTotalClaims] = useState('');
  const [maxClaimsPerLink, setMaxClaimsPerLink] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('');
  
  // UI states
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    tokenInfo: {
      name?: string;
      symbol?: string;
      decimals?: number;
      address?: string;
      totalSupply?: string;
      chainId?: number;
      network?: string;
    } | null;
    error: string;
  }>({
    isValidating: false,
    isValid: false,
    tokenInfo: null,
    error: ''
  });

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/login');
    }
  }, [isConnected, router]);

  // Token validation effect
  useEffect(() => {
    const validateToken = async () => {
      if (!tokenAddress.trim() || !chainId) {
        setTokenValidation(prev => ({ ...prev, isValid: false, tokenInfo: null, error: '' }));
        return;
      }

      setTokenValidation(prev => ({ ...prev, isValidating: true, error: '' }));

      try {
        // Call the validation API
        const response = await fetch('/api/tokens/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenAddress: tokenAddress.trim(),
            chainId: parseInt(chainId)
          }),
        });

        const data = await response.json();

        if (data.isValid) {
          setTokenValidation({
            isValidating: false,
            isValid: true,
            tokenInfo: data.tokenInfo || null,
            error: ''
          });
        } else {
          setTokenValidation({
            isValidating: false,
            isValid: false,
            tokenInfo: null,
            error: data.error || 'Token validation failed'
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to validate token';
        setTokenValidation({
          isValidating: false,
          isValid: false,
          tokenInfo: null,
          error: errorMessage
        });
      }
    };

    const timeoutId = setTimeout(validateToken, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [tokenAddress, chainId]);

  // Native token check function (commented out as not currently used)
  // const isNativeToken = (address: string) => {
  //   const normalized = address.toLowerCase();
  //   return normalized === 'native' || 
  //          normalized === '0x0000000000000000000000000000000000000000' ||
  //          normalized === '0x0' ||
  //          normalized === 'eth' ||
  //          normalized === 'matic' ||
  //          normalized === 'bnb' ||
  //          normalized === 'mnt' ||
  //          normalized === 'mon';
  // };

  const selectedNetwork = networks.find(n => n.chainId.toString() === chainId);
  const totalBudget = amountPerClaim && totalClaims 
    ? parseFloat(amountPerClaim) * parseInt(totalClaims) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          title,
          description,
          tokenAddress: tokenAddress.trim(),
          chainId: parseInt(chainId),
          claimType,
          amountPerClaim: parseFloat(amountPerClaim),
          totalClaims: parseInt(totalClaims),
          maxClaimsPerLink: claimType === 'multi' ? parseInt(maxClaimsPerLink) : 1,
          expiresInHours: expiresInHours ? parseFloat(expiresInHours) : null
        }),
      });

      const data: { details?: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create campaign');
      }

      setSuccess(true);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Campaign Created!</h2>
            <p className="text-muted mb-4">
              Your campaign has been created successfully. You&apos;ll be redirected to your dashboard.
            </p>
            <div className="space-y-2 text-sm text-muted">
              <p>Next steps:</p>
              <p>1. Fund your campaign</p>
              <p>2. Generate claim links</p>
              <p>3. Distribute to users</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-2xl font-bold text-foreground">Create Campaign</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set up the basic details for your token distribution campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Campaign Title *
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="My Token Airdrop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description (Optional)
                </label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Describe your token distribution campaign"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Network & Token */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network & Token
              </CardTitle>
              <CardDescription>
                Select the blockchain network and token for distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="chainId" className="block text-sm font-medium text-foreground mb-2">
                  Blockchain Network *
                </label>
                <select
                  id="chainId"
                  value={chainId}
                  onChange={(e) => setChainId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  required
                >
                  {networks.map((network) => (
                    <option key={network.chainId} value={network.chainId}>
                      {network.icon} {network.name} ({network.currency})
                    </option>
                  ))}
                </select>
                {selectedNetwork && (
                  <div className="mt-2 text-xs text-muted">
                    Explorer: {selectedNetwork.explorerUrl}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="tokenAddress" className="block text-sm font-medium text-foreground mb-2">
                  Token Address *
                </label>
                <Input
                  id="tokenAddress"
                  type="text"
                  placeholder="0x... or &apos;native&apos; for native token"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  required
                />
                <div className="mt-2 text-xs text-muted">
                  Use &apos;native&apos; for {selectedNetwork?.currency || 'ETH'}, or enter ERC-20 contract address
                </div>
                
                {/* Token Validation Status */}
                {tokenAddress && (
                  <div className="mt-2">
                    {tokenValidation.isValidating ? (
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                        Validating token...
                      </div>
                    ) : tokenValidation.isValid ? (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2 text-sm text-success mb-1">
                          <CheckCircle className="h-4 w-4" />
                          Token Validated Successfully
                        </div>
                        <div className="text-xs text-muted space-y-1">
                          <p><span className="font-medium">Name:</span> {tokenValidation.tokenInfo?.name || 'N/A'}</p>
                          <p><span className="font-medium">Symbol:</span> {tokenValidation.tokenInfo?.symbol || 'N/A'}</p>
                          <p><span className="font-medium">Decimals:</span> {tokenValidation.tokenInfo?.decimals || 'N/A'}</p>
                          {tokenValidation.tokenInfo?.address !== 'NATIVE' && (
                            <p className="font-mono text-xs break-all">
                              <span className="font-medium">Address:</span> {tokenValidation.tokenInfo?.address || 'N/A'}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : tokenValidation.error ? (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {tokenValidation.error}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribution Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Distribution Settings
              </CardTitle>
              <CardDescription>
                Configure how tokens will be distributed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Claim Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                    <input
                      type="radio"
                      name="claimType"
                      value="single"
                      checked={claimType === 'single'}
                      onChange={(e) => setClaimType(e.target.value)}
                      className="text-primary focus:ring-primary/20"
                    />
                    <div>
                      <div className="font-medium text-foreground">Single-use Links</div>
                      <div className="text-xs text-muted">One claim per link</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors">
                    <input
                      type="radio"
                      name="claimType"
                      value="multi"
                      checked={claimType === 'multi'}
                      onChange={(e) => setClaimType(e.target.value)}
                      className="text-primary focus:ring-primary/20"
                    />
                    <div>
                      <div className="font-medium text-foreground">Multi-use Links</div>
                      <div className="text-xs text-muted">Multiple claims per link</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amountPerClaim" className="block text-sm font-medium text-foreground mb-2">
                    Amount per Claim *
                  </label>
                  <Input
                    id="amountPerClaim"
                    type="number"
                    placeholder="100"
                    value={amountPerClaim}
                    onChange={(e) => setAmountPerClaim(e.target.value)}
                    min="0"
                    step="any"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="totalClaims" className="block text-sm font-medium text-foreground mb-2">
                    Total Claims *
                  </label>
                  <Input
                    id="totalClaims"
                    type="number"
                    placeholder="1000"
                    value={totalClaims}
                    onChange={(e) => setTotalClaims(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              {claimType === 'multi' && (
                <div>
                  <label htmlFor="maxClaimsPerLink" className="block text-sm font-medium text-foreground mb-2">
                    Max Claims per Link *
                  </label>
                  <Input
                    id="maxClaimsPerLink"
                    type="number"
                    placeholder="10"
                    value={maxClaimsPerLink}
                    onChange={(e) => setMaxClaimsPerLink(e.target.value)}
                    min="1"
                    required={claimType === 'multi'}
                  />
                  <div className="mt-1 text-xs text-muted">
                    How many users can claim from each link
                  </div>
                </div>
              )}

              {totalBudget > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Campaign Budget</span>
                  </div>
                  <div className="text-sm text-muted space-y-1">
                    <p>Total Budget: <span className="text-foreground font-mono">{totalBudget}</span> {tokenValidation.tokenInfo?.symbol || 'tokens'}</p>
                    <p>Amount per claim: {amountPerClaim} tokens</p>
                    <p>Total claims: {totalClaims}</p>
                    {claimType === 'multi' && maxClaimsPerLink && (
                      <p>Links needed: ~{Math.ceil(parseInt(totalClaims) / parseInt(maxClaimsPerLink))}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Optional settings for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label htmlFor="expiresInHours" className="block text-sm font-medium text-foreground mb-2">
                  Expiration (Hours)
                </label>
                <Input
                  id="expiresInHours"
                  type="number"
                  placeholder="24 (optional)"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  min="1"
                />
                <div className="mt-1 text-xs text-muted">
                  Leave empty for no expiration
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isCreating || !tokenValidation.isValid || !title || !tokenAddress || !amountPerClaim || !totalClaims}
              className="min-w-[200px]"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}