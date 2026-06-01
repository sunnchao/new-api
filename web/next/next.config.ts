import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000"}/api/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000"}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
