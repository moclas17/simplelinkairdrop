/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ethers']
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/claim/:id',
        destination: '/claim/:id'
      }
    ];
  },
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-ethers'],
};

export default nextConfig;