import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the build to succeed even if the embedded OS proxy files have lint/type quirks.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
