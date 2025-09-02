'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Lock, LogIn } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
  const [adminToken, setAdminToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.login(adminToken);
      
      if (result.success) {
        // Store token in localStorage
        localStorage.setItem('adminToken', adminToken);
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted">Enter your admin token to access the dashboard</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>
              Only authorized administrators can access the token distribution system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="adminToken" className="block text-sm font-medium text-foreground mb-2">
                  Admin Token
                </label>
                <Input
                  id="adminToken"
                  type="password"
                  placeholder="Enter your admin token"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !adminToken}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted">
          Need access? Contact the system administrator.
        </div>
      </div>
    </div>
  );
}