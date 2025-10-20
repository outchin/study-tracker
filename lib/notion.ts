interface NotionCategory {
  id: string;
  name: string;
  hourlyRate: number;
  totalTarget: number;
  monthlyTarget: number;
  dailyTarget: number;
  totalStudied: number;
  monthStudied: number;
  todayStudied: number;
  earned: number;
  canWithdraw: boolean;
  pomodoroCount: number;
}

interface NotionSession {
  sessionName: string;
  categoryId: string;
  duration: number;
  date: string;
  isPomodoro: boolean;
  notes?: string;
}

export class NotionAPI {
  private apiKey: string;
  private categoriesDbId: string;
  private sessionsDbId: string;

  constructor() {
    this.apiKey = process.env.NOTION_API_KEY || '';
    this.categoriesDbId = process.env.NOTION_CATEGORIES_DATABASE_ID || '';
    this.sessionsDbId = process.env.NOTION_SESSIONS_DATABASE_ID || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    return response.json();
  }

  async syncCategoryToNotion(category: NotionCategory): Promise<string> {
    const properties = {
      'Name': {
        title: [{ text: { content: category.name } }]
      },
      'Hourly Rate': {
        number: category.hourlyRate
      },
      'Total Target': {
        number: category.totalTarget
      },
      'Monthly Target': {
        number: category.monthlyTarget
      },
      'Daily Target': {
        number: category.dailyTarget
      },
      'Total Studied': {
        number: parseFloat(category.totalStudied.toFixed(2))
      },
      'Month Studied': {
        number: parseFloat(category.monthStudied.toFixed(2))
      },
      'Today Studied': {
        number: parseFloat(category.todayStudied.toFixed(2))
      },
      'Earned': {
        number: category.earned
      },
      'Can Withdraw': {
        checkbox: category.canWithdraw
      },
      'Pomodoro Count': {
        number: category.pomodoroCount
      }
    };

    if (category.id && category.id !== 'new') {
      // Update existing page
      await this.makeRequest(`/pages/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties })
      });
      return category.id;
    } else {
      // Create new page
      const response = await this.makeRequest('/pages', {
        method: 'POST',
        body: JSON.stringify({
          parent: { database_id: this.categoriesDbId },
          properties
        })
      });
      return response.id;
    }
  }

  async logSessionToNotion(session: NotionSession): Promise<string> {
    const properties = {
      'Session Name': {
        title: [{ text: { content: session.sessionName } }]
      },
      'Category': {
        relation: [{ id: session.categoryId }]
      },
      'Duration': {
        number: parseFloat(session.duration.toFixed(2))
      },
      'Date': {
        date: { start: session.date }
      },
      'Is Pomodoro': {
        checkbox: session.isPomodoro
      }
    };

    if (session.notes) {
      (properties as any)['Notes'] = {
        rich_text: [{ text: { content: session.notes } }]
      };
    }

    const response = await this.makeRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: this.sessionsDbId },
        properties
      })
    });

    return response.id;
  }

  async getCategoriesFromNotion(): Promise<NotionCategory[]> {
    const response = await this.makeRequest(`/databases/${this.categoriesDbId}/query`, {
      method: 'POST'
    });

    return response.results.map((page: any) => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.text?.content || '',
      hourlyRate: page.properties['Hourly Rate']?.number || 0,
      totalTarget: page.properties['Total Target']?.number || 0,
      monthlyTarget: page.properties['Monthly Target']?.number || 0,
      dailyTarget: page.properties['Daily Target']?.number || 0,
      totalStudied: page.properties['Total Studied']?.number || 0,
      monthStudied: page.properties['Month Studied']?.number || 0,
      todayStudied: page.properties['Today Studied']?.number || 0,
      earned: page.properties.Earned?.number || 0,
      canWithdraw: page.properties['Can Withdraw']?.checkbox || false,
      pomodoroCount: page.properties['Pomodoro Count']?.number || 0
    }));
  }
}

export const notion = new NotionAPI();