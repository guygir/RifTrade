/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds (we'll rely on type checking instead)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Still check types during build
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization in development to avoid Safari issues
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Add headers for cache control and security
  async headers() {
    const headers = [];
    
    // Development cache-busting headers
    if (process.env.NODE_ENV === 'development') {
      headers.push({
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      });
    }
    
    // Security headers (always applied)
    headers.push({
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval in dev, unsafe-inline for inline scripts
            "style-src 'self' 'unsafe-inline'", // Tailwind CSS needs unsafe-inline
            "img-src 'self' data: https:", // Allow images from same origin, data URIs, and HTTPS URLs for card images
            "connect-src 'self' https://*.supabase.co", // Allow API calls to Supabase
            "frame-ancestors 'none'", // Prevent embedding (same as X-Frame-Options but more modern
          ].join('; '),
        },
      ],
    });
    
    return headers;
  },
};

export default nextConfig;

