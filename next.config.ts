import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  // serverExternalPackages only applies to SSR — ignored during static export
  serverExternalPackages: ["hnswlib-node", "onnxruntime-node", "@xenova/transformers", "chokidar"],
  ...(isStaticExport && {
    output: "export",
    // Cloudflare Pages has no Next.js image optimisation server
    images: { unoptimized: true },
  }),
};

export default nextConfig;
