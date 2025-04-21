/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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