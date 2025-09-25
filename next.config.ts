import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // Enable external packages for better Vercel performance
  serverExternalPackages: ['@prisma/client'],
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
  // Vercel optimizations
  output: 'standalone',
  // Ensure serverless functions have proper timeout
  serverRuntimeConfig: {
    // API routes timeout (30s max on Vercel Hobby)
    apiTimeout: process.env.VERCEL ? 28000 : 30000,
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
