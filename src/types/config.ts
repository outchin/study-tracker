export type DatabaseProvider = 'notion' | 'dynamodb';

export interface NotionConfig {
  apiKey: string;
  categoriesDbId: string;
  sessionsDbId: string;
}

export interface DynamoDBConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  categoriesTable: string;
  sessionsTable: string;
}

export interface AppConfig {
  databaseProvider: DatabaseProvider;
  notion: NotionConfig;
  dynamodb: DynamoDBConfig;
}