import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a second dev server (e.g. an isolated test run) use its own build folder
  ...(process.env.NEXT_DIST_DIR && { distDir: process.env.NEXT_DIST_DIR }),
  // Bundle the SQLite database file with serverless functions on Vercel
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/dev.db"],
  },
  // Allow landing.html to be served directly from public folder or custom rewrites if needed
  async rewrites() {
    return [
      {
        source: "/landing",
        destination: "/landing.html",
      },
    ];
  },
};

export default nextConfig;
