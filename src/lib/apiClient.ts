import { ConfigManager } from './config';

class ApiClient {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  private getHeaders(): HeadersInit {
    const config = this.configManager.getNotionConfig();
    if (!config) {
      throw new Error('Notion configuration not found');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'x-categories-db-id': config.categoriesDbId,
      'x-sessions-db-id': config.sessionsDbId,
    };
  }

  async get(url: string): Promise<Response> {
    return fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async post(url: string, data: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async patch(url: string, data: any): Promise<Response> {
    return fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  }

  async delete(url: string): Promise<Response> {
    return fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  isConfigured(): boolean {
    return this.configManager.isConfigured();
  }
}

export const apiClient = new ApiClient();