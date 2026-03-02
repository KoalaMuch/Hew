/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hew/shared'],
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
