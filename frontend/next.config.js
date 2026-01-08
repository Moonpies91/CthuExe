/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  output: 'export', // Static HTML export for GitHub Pages
  basePath: '/CthuExe', // Your repo name
  assetPrefix: '/CthuExe/',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
}

module.exports = nextConfig
