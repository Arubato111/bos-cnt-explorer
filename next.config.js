/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // verhindert "ESLint must be installed…" im Build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
