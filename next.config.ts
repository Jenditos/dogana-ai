import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // unpdf is serverless-compatible, no serverExternalPackages needed
};

export default nextConfig;
