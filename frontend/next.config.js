/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async rewrites() {
    // Only use rewrites for local development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*'
        }
      ]
    }
    // No rewrites in production - use NEXT_PUBLIC_API_URL instead
    return []
  }
}

module.exports = nextConfig