/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hew/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
