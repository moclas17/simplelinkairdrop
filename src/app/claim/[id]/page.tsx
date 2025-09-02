'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiClient, ClaimData } from '@/lib/api';
import { formatAmount } from '@/lib/utils';

export default function ClaimPage() {
  const params = useParams();
  const claimId = params.id as string;
  
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (claimId) {
      fetchClaimData();
    }
  }, [claimId]);

  const fetchClaimData = async () => {
    try {
      const data = await apiClient.getClaimData(claimId);
      setClaimData(data);
      
      if (data?.claimed) {
        setClaimed(true);
        setTxHash(data.tx_hash || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load claim data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaiming(true);
    setError('');

    try {
      const result = await apiClient.processClaim({
        wallet: wallet.trim(),
        linkId: claimId,
      });

      if (result.success) {
        setClaimed(true);
        setTxHash(result.txHash);
      }
    } catch (err: any) {
      setError(err.message || 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  const getExplorerUrl = (txHash: string) => {
    const chainId = claimData?.campaigns?.chain_id;
    // Default to Ethereum mainnet explorer
    let baseUrl = 'https://etherscan.io';
    
    // Add other explorer URLs based on chain ID
    if (chainId === 10) baseUrl = 'https://optimistic.etherscan.io';
    else if (chainId === 42161) baseUrl = 'https://arbiscan.io';
    else if (chainId === 8453) baseUrl = 'https://basescan.org';
    
    return `${baseUrl}/tx/${txHash}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted">Loading claim data...</p>
        </div>
      </div>
    );
  }

  if (!claimData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Link Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-6">
              This claim link is invalid or has expired. Please check the URL or contact the distributor.
            </p>
            <Link href="/">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = claimData.expires_at && new Date(claimData.expires_at) <= new Date();
  const tokenSymbol = claimData.campaigns?.token_symbol || 'TOKEN';

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-warning">Link Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted mb-4">
              This {claimData.amount} ${tokenSymbol} claim link has expired.
            </p>
            <p className="text-sm text-muted mb-6">
              Expired on: {new Date(claimData.expires_at!).toLocaleString()}
            </p>
            <Link href="/">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-success">Already Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-success/5 border border-success/20 rounded-xl p-4 mb-6">
              <p className="text-lg font-semibold text-foreground mb-2">
                🎉 This claim has been successfully processed!
              </p>
              <div className="text-2xl font-bold text-success mb-2">
                {formatAmount(claimData.amount)} ${tokenSymbol}
              </div>
              {claimData.claimed_at && (
                <p className="text-sm text-muted mb-4">
                  <strong>Claimed on:</strong> {new Date(claimData.claimed_at).toLocaleString()}
                </p>
              )}
              {txHash && (
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-success text-xs font-mono hover:bg-success/20 transition-colors"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <p className="text-sm text-muted mb-6">
              The tokens have been transferred to the recipient wallet. Each claim link can only be used once for security.
            </p>
            <Link href="/">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30 mb-4" />
          <CardTitle>Claim {tokenSymbol} Tokens</CardTitle>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
            <div className="text-2xl font-bold text-primary mb-2">
              {formatAmount(claimData.amount)} ${tokenSymbol}
            </div>
            <p className="text-sm text-muted">
              Available to claim from this link
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleClaim} className="space-y-4">
            <div>
              <label htmlFor="wallet" className="block text-sm font-medium text-foreground mb-2">
                Wallet Address or ENS
              </label>
              <Input
                id="wallet"
                type="text"
                placeholder="0x... or yourname.eth"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                required
              />
              <p className="text-xs text-muted mt-1">
                Enter your Ethereum wallet address or ENS name to receive the tokens
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={claiming || !wallet.trim()}
            >
              {claiming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Processing Claim...
                </>
              ) : (
                <>
                  Claim {formatAmount(claimData.amount)} ${tokenSymbol}
                </>
              )}
            </Button>

            <div className="text-xs text-muted text-center space-y-1">
              <p>• This link can only be used once</p>
              <p>• Transaction will be processed on-chain</p>
              {claimData.expires_at && (
                <p>• Expires: {new Date(claimData.expires_at).toLocaleString()}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}