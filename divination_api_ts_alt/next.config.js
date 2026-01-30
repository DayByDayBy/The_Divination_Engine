/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Cloudflare Pages
  output: 'standalone',
  
  // API routes only - no pages
  experimental: {
    // Required for Cloudflare Pages
    runtime: 'nodejs',
  },
  
  // Disable image optimization (not needed for API)
  images: {
    unoptimized: true,
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
