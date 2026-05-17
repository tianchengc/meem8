import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'meem8.config.json');

export interface Meem8Config {
  triggerWord: string;
  activeBotId: string | null;
  activeBotStatus: string | null;
}

const defaultConfig: Meem8Config = {
  triggerWord: 'hi gemma',
  activeBotId: null,
  activeBotStatus: null,
};

export const configManager = {
  get(): Meem8Config {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error("Failed to read config:", error);
    }
    return defaultConfig;
  },
  
  update(updates: Partial<Meem8Config>) {
    const current = this.get();
    const newConfig = { ...current, ...updates };
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (error) {
      console.error("Failed to write config:", error);
    }
    return newConfig;
  }
};
