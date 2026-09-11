import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in places; let Next optimise it properly.
  transpilePackages: ["three"],
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
  async headers() {
    return [
      {
        // The invitation is a public, long-lived link. Keep it safe to share.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
