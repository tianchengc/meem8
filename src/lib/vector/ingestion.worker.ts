import { parentPort } from "worker_threads";
import { pipeline, env } from "@xenova/transformers";
import { vectorStore } from "./store";

env.allowLocalModels = false;
let extractor: any;

async function initExtractor() {
  if (!extractor) {
    console.log("[Worker] Loading Xenova/all-MiniLM-L6-v2 embedding model...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("[Worker] Embedding model initialized.");
  }
  return extractor;
}

parentPort?.on("message", async (task) => {
  if (task.type === "INGEST_DOCUMENT") {
    console.log(`[Worker] Started document ingestion: ${task.payload.filename}`);
    
    try {
      const getExtractor = await initExtractor();
      
      // For MVP demonstration, we mock the parsed text chunks
      const mockChunks = [
        "Project meem8 architecture strictly uses local Ollama models for privacy.",
        "Obsidian Vault integration is an optional enhancement for the local RAG.",
        "The Intel Mac optimization relies heavily on worker_threads and direct DOM manipulation."
      ];
      
      for (const chunk of mockChunks) {
        const output = await getExtractor(chunk, { pooling: 'mean', normalize: true });
        const vectorArray = Array.from(output.data) as number[];
        
        // Add to persistent local store
        vectorStore.addText(vectorArray, chunk);
        console.log(`[Worker] Embedded and stored: "${chunk.substring(0, 30)}..."`);
      }
      
      parentPort?.postMessage({
        status: "SUCCESS",
        filename: task.payload.filename,
        vectorCount: mockChunks.length
      });
    } catch (error) {
      parentPort?.postMessage({
        status: "ERROR",
        filename: task.payload.filename,
        error: String(error)
      });
    }
  }
});
