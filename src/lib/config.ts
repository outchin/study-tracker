import { NotionConfig, AppConfig } from '@/types/config';

const CONFIG_STORAGE_KEY = 'study-tracker-config';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig | null = null;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        try {
          this.config = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse stored config:', error);
          this.config = null;
        }
      }
    }
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  getNotionConfig(): NotionConfig | null {
    return this.config?.notion || null;
  }

  setConfig(config: AppConfig): void {
    this.config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  }

  updateNotionConfig(notionConfig: NotionConfig): void {
    if (!this.config) {
      this.config = { notion: notionConfig };
    } else {
      this.config.notion = notionConfig;
    }
    this.setConfig(this.config);
  }

  clearConfig(): void {
    this.config = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  }

  isConfigured(): boolean {
    const notion = this.getNotionConfig();
    return !!(notion?.apiKey && notion?.categoriesDbId && notion?.sessionsDbId);
  }
}