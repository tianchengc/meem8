import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["hnswlib-node", "onnxruntime-node", "@xenova/transformers", "chokidar"],
};

export default nextConfig;
