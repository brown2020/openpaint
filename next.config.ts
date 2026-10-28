import type { NextConfig } from "next";
import { securityHeaderRoutes } from "./src/lib/security/securityHeaders";

const nextConfig: NextConfig = {
  async headers() {
    return securityHeaderRoutes();
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
