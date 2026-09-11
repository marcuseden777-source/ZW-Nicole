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
      {
        // The landing film and its poster frames never change without
        // changing name, so let a guest who reopens the invitation — and
        // every CDN edge between — keep them for a year.
        source: "/hero/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/gallery/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
