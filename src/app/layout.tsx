import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chingadrop.xyz - Token Distribution System',
  description: 'Secure token distribution using one-time claim links',
  keywords: 'crypto, tokens, airdrop, distribution, blockchain',
  authors: [{ name: 'Chingadrop Team' }],
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#7dd3fc" />
      </head>
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}