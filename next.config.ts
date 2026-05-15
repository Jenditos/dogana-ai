import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse uses fs/path at runtime — must not be bundled by Next.js
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
