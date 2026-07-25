import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "standalone" output — Vercel handles deployment natively.
  // "standalone" is for self-hosted Docker/Node only and breaks Vercel builds.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
