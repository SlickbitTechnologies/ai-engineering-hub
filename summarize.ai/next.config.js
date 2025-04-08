/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
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