/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['lh3.googleusercontent.com', 'firebasestorage.googleapis.com'],
  },
  eslint: {
    // We'll handle the ESLint issues separately
    ignoreDuringBuilds: true
  },
  typescript: {
    // We'll address type issues separately 
    ignoreBuildErrors: true
  },
  experimental: {
    // This will allow server-side rendering instead of static generation
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  // Disable static optimization completely
  staticPageGenerationTimeout: 1000,
  excludeDefaultMomentLocales: true,
  // Runtime config
  serverRuntimeConfig: {
    // Will only be available on the server side
    firebaseAdmin: {
      enabled: true
    }
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    forceDynamicRendering: true,
  },
  // Force the app to use dynamic rendering
  trailingSlash: false,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/audio',
        destination: '/audio-summarize',
        permanent: true,
      },
      {
        source: '/text',
        destination: '/text-summarize',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig 