/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // Use webpack for sql.js compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // Add empty turbopack config to silence warning
  // We use webpack for sql.js compatibility
  turbopack: {},
};

module.exports = nextConfig;
  