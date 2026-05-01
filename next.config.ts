import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'better-auth',
    '@libsql/client',
    'drizzle-orm',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
