import type { NextConfig } from "next";

const workspaceRoot = __dirname.replace(/\/next$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/forbidden", destination: "/403", permanent: false },
      { source: "/login", destination: "/sign-in", permanent: false },
      { source: "/register", destination: "/sign-up", permanent: false },
      { source: "/console", destination: "/dashboard", permanent: false },
      { source: "/console/models", destination: "/models", permanent: false },
      {
        source: "/console/deployment",
        destination: "/models/deployments",
        permanent: false,
      },
      { source: "/console/health", destination: "/health", permanent: false },
      {
        source: "/console/subscription",
        destination: "/subscriptions",
        permanent: false,
      },
      {
        source: "/console/subscription-overview",
        destination: "/subscriptions?tab=all-subscriptions",
        permanent: false,
      },
      {
        source: "/console/channel",
        destination: "/channels",
        permanent: false,
      },
      { source: "/console/token", destination: "/keys", permanent: false },
      {
        source: "/console/admin/token",
        destination: "/admin-tokens",
        permanent: false,
      },
      {
        source: "/console/playground",
        destination: "/playground",
        permanent: false,
      },
      {
        source: "/console/redemption",
        destination: "/redemption-codes",
        permanent: false,
      },
      {
        source: "/console/tickets",
        destination: "/tickets?legacy_admin=1",
        permanent: false,
      },
      {
        source: "/console/ticket/:id",
        destination: "/tickets/:id?legacy_admin=1",
        permanent: false,
      },
      { source: "/console/user", destination: "/users", permanent: false },
      { source: "/console/personal", destination: "/profile", permanent: false },
      {
        source: "/console/subscriptions",
        destination: "/my-subscriptions",
        permanent: false,
      },
      {
        source: "/console/packages",
        destination: "/admin-packages",
        permanent: false,
      },
      {
        source: "/console/midjourney",
        destination: "/usage-logs/drawing",
        permanent: false,
      },
      {
        source: "/console/task",
        destination: "/usage-logs/task",
        permanent: false,
      },
      { source: "/console/chat", destination: "/chat/new", permanent: false },
      {
        source: "/console/chat/:id",
        destination: "/chat/:id",
        permanent: false,
      },
      { source: "/ticket/:id", destination: "/tickets/:id", permanent: false },
      {
        source: "/vibecoding/claude/admin",
        destination: "/vibecoding/admin",
        permanent: false,
      },
      {
        source: "/vibecoding/claude/subscription",
        destination: "/my-subscriptions",
        permanent: false,
      },
      {
        source: "/openclaw",
        destination: "/vibecoding/openclaw",
        permanent: false,
      },
    ];
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
