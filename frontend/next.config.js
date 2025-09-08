/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      encoding: false,
      'pino-pretty': false,
    };
    return config;
  },
};

export default nextConfig;
