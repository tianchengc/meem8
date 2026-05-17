import fs from "fs";
import path from "path";

const STATE_PATH = path.join(process.cwd(), "meem8.agent.json");

export interface AgentState {
  prompt: string;
  response: string;
  status: "idle" | "streaming" | "error";
  source: "meeting" | "dashboard" | "none";
  timestamp: string;
}

const defaultState: AgentState = {
  prompt: "",
  response: "",
  status: "idle",
  source: "none",
  timestamp: "",
};

export const agentStateManager = {
  get(): AgentState {
    try {
      if (fs.existsSync(STATE_PATH)) {
        const data = fs.readFileSync(STATE_PATH, "utf-8");
        return { ...defaultState, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error("Failed to read agent state:", error);
    }
    return defaultState;
  },

  update(updates: Partial<AgentState>) {
    const current = this.get();
    const newState = { 
      ...current, 
      ...updates, 
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }) 
    };
    try {
      fs.writeFileSync(STATE_PATH, JSON.stringify(newState, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to write agent state:", error);
    }
    return newState;
  },

  clear() {
    try {
      fs.writeFileSync(STATE_PATH, JSON.stringify(defaultState, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to clear agent state:", error);
    }
  }
};
