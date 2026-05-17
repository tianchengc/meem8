import hnswlib from "hnswlib-node";
import fs from "fs";
import path from "path";

const VECTOR_DIR = path.join(process.cwd(), "vector_store");
const INDEX_FILE = path.join(VECTOR_DIR, "index.dat");
const MAPPING_FILE = path.join(VECTOR_DIR, "mapping.json");

// 384 dimensions for Xenova/all-MiniLM-L6-v2
const DIMENSIONS = 384; 
const MAX_ELEMENTS = 10000;

export class VectorStore {
  private index: hnswlib.HierarchicalNSW;
  private metadataMap: Record<number, string> = {};
  private currentId = 0;

  constructor() {
    if (!fs.existsSync(VECTOR_DIR)) {
      fs.mkdirSync(VECTOR_DIR, { recursive: true });
    }

    this.index = new hnswlib.HierarchicalNSW("cosine", DIMENSIONS);

    if (fs.existsSync(INDEX_FILE) && fs.existsSync(MAPPING_FILE)) {
      this.index.readIndexSync(INDEX_FILE);
      this.metadataMap = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
      this.currentId = Object.keys(this.metadataMap).length;
    } else {
      this.index.initIndex(MAX_ELEMENTS, 16, 200, 100);
    }
  }

  public addText(vector: number[], text: string) {
    this.currentId += 1;
    this.index.addPoint(vector, this.currentId);
    this.metadataMap[this.currentId] = text;
    this.save();
  }

  public search(vector: number[], topK: number = 3) {
    if (this.currentId === 0) return [];
    
    const k = Math.min(topK, this.currentId);
    const results = this.index.searchKnn(vector, k);
    
    return results.neighbors.map((id, index) => ({
      text: this.metadataMap[id],
      distance: results.distances[index]
    }));
  }

  private save() {
    this.index.writeIndexSync(INDEX_FILE);
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(this.metadataMap, null, 2));
  }
}

// Singleton instance
export const vectorStore = new VectorStore();
