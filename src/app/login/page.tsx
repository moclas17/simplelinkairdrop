'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Wallet, Shield, CheckCircle, AlertCircle } from 'lucide-react';
// Temporarily disabled while fixing WalletConnect integration
// import { useWalletAuth } from '@/hooks/useWalletAuth';

export default function LoginPage() {
  const router = useRouter();
  
  // Temporary: simulate connecting for demo
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const address = isConnected ? '0x86300E0a857aAB39A601E89b0e7F15e1488d9F0C' : null;
  const isAdmin = isConnected; // For demo purposes
  
  const connectWallet = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
    }, 1500);
  };

  // Redirect to dashboard if authenticated as admin
  useEffect(() => {
    if (isConnected && isAdmin) {
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  }, [isConnected, isAdmin, router]);

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
          <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
          <p className="text-muted">Connect your authorized wallet to access the dashboard</p>
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Wallet Authentication
            </CardTitle>
            <CardDescription>
              Only authorized wallet addresses can access the admin dashboard.
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

                {/* Admin status */}
                {isAdmin ? (
                  <div className="p-4 rounded-lg border bg-success/5 border-success/20">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Admin Access Granted</span>
                    </div>
                    <p className="text-sm text-muted">
                      Your wallet has admin privileges. Redirecting to dashboard...
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border bg-destructive/5 border-destructive/20">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Access Denied</span>
                    </div>
                    <p className="text-sm text-muted">
                      This wallet is not authorized for admin access.
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted">
          Only authorized wallets can access the admin dashboard.
        </div>
      </div>
    </div>
  );
}