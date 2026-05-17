import fs from "fs";
import path from "path";

const TRANSCRIPTS_PATH = path.join(process.cwd(), "meem8.transcripts.json");

export interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

export const transcriptsManager = {
  get(): TranscriptItem[] {
    try {
      if (fs.existsSync(TRANSCRIPTS_PATH)) {
        const data = fs.readFileSync(TRANSCRIPTS_PATH, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to read transcripts:", error);
    }
    return [];
  },

  add(speaker: string, text: string): TranscriptItem {
    const list = this.get();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newItem: TranscriptItem = {
      id: Math.random().toString(36).substring(2, 9),
      speaker,
      text,
      timestamp: time,
    };
    list.push(newItem);

    // Keep only the last 100 entries to prevent infinite growth
    if (list.length > 100) {
      list.shift();
    }

    try {
      fs.writeFileSync(TRANSCRIPTS_PATH, JSON.stringify(list, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to write transcripts:", error);
    }
    return newItem;
  },

  clear() {
    try {
      fs.writeFileSync(TRANSCRIPTS_PATH, JSON.stringify([], null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to clear transcripts:", error);
    }
  },
};
