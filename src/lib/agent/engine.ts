import ollama from 'ollama';
import { pipeline, env } from "@xenova/transformers";
import { vectorStore } from '../vector/store';
import { toolRegistry } from './tools';

env.allowLocalModels = false;
let extractor: any;

async function initExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

/**
 * Agentic Engine for Gemma 4 (Local)
 */
export class AgentEngine {
  async invoke(prompt: string) {
    console.log("Agent Engine Invoked with prompt:", prompt);
    
    // 1. Tool Execution (MCP Router)
    // In a production system, Gemma would output JSON to decide the tool.
    // We use naive keyword parsing for this MVP demonstration.
    let externalContext = "";
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes("wikipedia") || lowerPrompt.includes("search")) {
       console.log("Executing MCP Tool: [wikipedia_search]");
       // Extract naive query (e.g., "search wikipedia for Next.js" -> "Next.js")
       const match = lowerPrompt.match(/search (?:wikipedia for )?(.*)/);
       const query = match ? match[1].trim() : prompt;
       
       externalContext = await this.executeMcpTool("wikipedia_search", query);
    }

    // 2. Query Local Vector DB (RAG)
    console.log("Embedding prompt for RAG search...");
    const getExtractor = await initExtractor();
    const output = await getExtractor(prompt, { pooling: 'mean', normalize: true });
    const promptVector = Array.from(output.data) as number[];
    
    const searchResults = vectorStore.search(promptVector, 3);
    const localContext = searchResults.map((r, i) => `[Doc ${i + 1} | Dist: ${r.distance.toFixed(2)}] ${r.text}`).join("\n");

    const augmentedPrompt = `
You are Gemma, a local privacy-first Meeting Co-Pilot.
Answer the user's prompt based ONLY on the provided Internal Knowledge Base Matches or External Tool Results.
If the context contains the answer, summarize it. If it doesn't, inform the user.

Internal Knowledge Base Matches:
${localContext || "No relevant local documents found."}

External Tool Results:
${externalContext || "No tools executed."}

User Prompt:
${prompt}
`;

    // 3. Stream Response via Ollama
    return this.streamFromOllama(augmentedPrompt);
  }

  private async executeMcpTool(toolName: string, query: string) {
    console.log(`Routing execution to MCP Server for tool: ${toolName}`);
    
    const toolFunc = toolRegistry[toolName];
    if (toolFunc) {
      // Pass only the query to the external internet, keeping the prompt private
      return await toolFunc(query);
    }
    
    return `[Tool execution failed: ${toolName} not found]`;
  }

  private async streamFromOllama(prompt: string) {
    try {
      const response = await ollama.chat({
        model: 'gemma4:latest',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              controller.enqueue(chunk.message.content);
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        }
      });
    } catch (error) {
      console.error("Ollama connection failed:", error);
      return new ReadableStream({
        start(controller) {
          controller.enqueue("[System Error: Ollama is not running locally, or 'gemma:2b' model is missing.]");
          controller.close();
        }
      });
    }
  }
}

export const agentEngine = new AgentEngine();
