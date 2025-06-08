import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbopack: true,
  },
  images: {
    domains: ['images.pexels.com'],
  },
};

export default nextConfig;
