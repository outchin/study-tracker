export interface NotionConfig {
  apiKey: string;
  categoriesDbId: string;
  sessionsDbId: string;
}

export interface AppConfig {
  notion: NotionConfig;
}