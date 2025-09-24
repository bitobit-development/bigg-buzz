import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    dirs: ['src'],
    ignoreDuringBuilds: true,
  },
};

// Only apply PWA configuration for production builds
// This avoids conflicts with Turbopack in development
const config = process.env.NODE_ENV === 'development'
  ? nextConfig
  : withPWA({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
      buildExcludes: [/middleware-manifest\.json$/],
    })(nextConfig as any);

export default config;
