import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Shield, Clock, Users, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20" />
          <h1 className="text-xl font-bold text-foreground">Chingadrop.xyz</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Service Online
          </span>
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 md:text-5xl">
            Token Distribution System
          </h2>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            A secure token distribution system using <strong>one-time claim links</strong>. 
            Built for ERC-20 tokens with hot wallet backend integration.
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                🔗 Connect & Start
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">🔗 One-Time Links</h3>
            <p className="text-sm text-muted">Generate unique URLs that can only be used once to claim tokens</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">🛡️ Secure Claims</h3>
            <p className="text-sm text-muted">Atomic reservations prevent double-spending with automatic rollback</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">⏰ Expirable</h3>
            <p className="text-sm text-muted">Set custom expiration times for each batch of links</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">🔐 Admin Protected</h3>
            <p className="text-sm text-muted">Link generation requires admin authentication</p>
          </Card>
        </div>

        {/* API Info */}
        <Card className="p-8 mb-16">
          <h3 className="text-xl font-semibold text-foreground mb-6">🚀 API Endpoints</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <span className="px-3 py-1 rounded-md bg-green-500 text-white text-xs font-semibold">POST</span>
              <code className="text-sm font-mono">/api/claims/generate</code>
              <span className="text-sm text-muted">Generate new claim links (requires admin token)</span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <span className="px-3 py-1 rounded-md bg-blue-500 text-white text-xs font-semibold">POST</span>
              <code className="text-sm font-mono">/api/claims/process</code>
              <span className="text-sm text-muted">Process token claim from a valid link</span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <span className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold">GET</span>
              <code className="text-sm font-mono">/claim/[id]</code>
              <span className="text-sm text-muted">Claim page with user-friendly interface</span>
            </div>
          </div>
        </Card>

        {/* Usage Example */}
        <Card className="p-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">💼 Usage Example</h3>
          <div className="bg-black/50 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono">
{`curl -X POST https://chingadrop.xyz/api/claims/generate \\
  -H "Content-Type: application/json" \\
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \\
  -d '{
    "count": 10,
    "amount": 50,
    "expiresInHours": 24
  }'`}
            </pre>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-muted">
        <p>🛠️ Built with Next.js + Ethers.js + Supabase</p>
      </footer>
    </div>
  );
}