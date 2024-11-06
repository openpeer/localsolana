/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.localsolana.com';
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },
  // Configure images to work with your CloudFront setup
  images: {
    domains: ['d1h6uvabx4uqh.cloudfront.net']
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;