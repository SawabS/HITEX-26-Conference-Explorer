import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  ...(staticExport ? { output: "export" as const, trailingSlash: true } : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: staticExport,
  },
  experimental: { optimizePackageImports: ["lucide-react", "recharts"] },
};

export default nextConfig;
