import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
let extractor: any = null;

export async function initExtractor() {
  if (!extractor) {
    console.log("[Embed] Initializing Xenova/all-MiniLM-L6-v2 embedding model...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("[Embed] Embedding model loaded successfully.");
  }
  return extractor;
}

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const getExtractor = await initExtractor();
    const output = await getExtractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data) as number[];
  } catch (error) {
    console.error("[Embed] Failed to generate embeddings:", error);
    throw error;
  }
}
