'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Wallet, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export default function LoginPage() {
  const router = useRouter();
  const { 
    address, 
    isConnected, 
    isLoading,
    connectWallet 
  } = useWallet();

  // Redirect to dashboard if wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back to home */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Connect Wallet</h1>
          <p className="text-muted">Connect your wallet to access your dashboard</p>
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>
              Connect your wallet to access your personal dashboard and manage your claims.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Connected wallet info */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-medium">Wallet Connected</span>
                  </div>
                  <p className="text-sm text-muted font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>

                {/* Connected status */}
                <div className="p-4 rounded-lg border bg-success/5 border-success/20">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">Wallet Connected</span>
                  </div>
                  <p className="text-sm text-muted">
                    Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted">
          Connect any wallet to access your personal dashboard.
        </div>
      </div>
    </div>
  );
}