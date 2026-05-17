import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { pipeline, env } from "@xenova/transformers";
import { vectorStore } from './store';

env.allowLocalModels = false;
let extractor: any;

async function initExtractor() {
  if (!extractor) {
    console.log("[ObsidianSync] Loading Xenova embedding model...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("[ObsidianSync] Embedding model initialized.");
  }
  return extractor;
}

// Function to clean markdown and split into chunks
function chunkText(text: string, chunkSize: number = 1000): string[] {
  // Simple markdown stripping
  const html = marked.parse(text) as string;
  const plainText = html.replace(/<[^>]*>?/gm, '');
  
  const chunks = [];
  for (let i = 0; i < plainText.length; i += chunkSize) {
    chunks.push(plainText.substring(i, i + chunkSize));
  }
  return chunks;
}

export function startObsidianSync() {
  const vaultDir = path.join(process.cwd(), 'obsidian_vault');
  
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
    console.log(`[ObsidianSync] Created local vault directory at ${vaultDir}`);
  }

  console.log(`[ObsidianSync] Watching for changes in ${vaultDir}...`);

  const watcher = chokidar.watch(vaultDir, {
    persistent: true,
    ignoreInitial: false,
    depth: 99
  });

  watcher.on('add', async (filePath) => {
    if (!filePath.endsWith('.md')) return;
    console.log(`[ObsidianSync] File added: ${path.basename(filePath)}`);
    await processFile(filePath);
  });

  watcher.on('change', async (filePath) => {
    if (!filePath.endsWith('.md')) return;
    console.log(`[ObsidianSync] File changed: ${path.basename(filePath)}`);
    await processFile(filePath);
  });
}

async function processFile(filePath: string) {
  try {
    const getExtractor = await initExtractor();
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(content);
    
    let ingestedCount = 0;
    for (const chunk of chunks) {
      if (chunk.trim().length < 10) continue;
      
      const output = await getExtractor(chunk, { pooling: 'mean', normalize: true });
      const vectorArray = Array.from(output.data) as number[];
      
      // Store in our local HNSWLib DB
      vectorStore.addText(vectorArray, `[Source: ${path.basename(filePath)}] ${chunk}`);
      ingestedCount++;
    }
    console.log(`[ObsidianSync] Successfully embedded and saved ${ingestedCount} chunks from ${path.basename(filePath)}.`);
  } catch (error) {
    console.error(`[ObsidianSync] Failed to process ${path.basename(filePath)}:`, error);
  }
}
