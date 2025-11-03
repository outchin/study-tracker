import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

interface Category {
  categoryId: string;
  name: string;
  hourlyRateUSD: number;
  hourlyRateMMK: number;
  totalTarget: number;
  monthlyTarget: number;
  dailyTarget: number;
  totalStudied: number;
  monthStudied: number;
  todayStudied: number;
  earnedUSD: number;
  earnedMMK: number;
  canWithdraw: boolean;
  pomodoroCount: number;
  emoji: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  sessionId: string;
  categoryId: string;
  sessionName: string;
  duration: number;
  date: string;
  isPomodoro: boolean;
  notes?: string;
  createdAt: string;
}

export class DynamoDBAPI {
  private client: DynamoDBDocumentClient;
  private categoriesTable: string;
  private sessionsTable: string;

  constructor(config?: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    categoriesTable?: string;
    sessionsTable?: string;
  }) {
    const dynamoClient = new DynamoDBClient({
      region: config?.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      }
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.categoriesTable = config?.categoriesTable || process.env.DYNAMODB_CATEGORIES_TABLE || 'study-tracker-categories';
    this.sessionsTable = config?.sessionsTable || process.env.DYNAMODB_SESSIONS_TABLE || 'study-tracker-sessions';
  }

  // Category methods
  async createCategory(categoryData: Omit<Category, 'categoryId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const categoryId = uuidv4();
    const now = new Date().toISOString();
    
    const category: Category = {
      categoryId,
      ...categoryData,
      createdAt: now,
      updatedAt: now
    };

    await this.client.send(new PutCommand({
      TableName: this.categoriesTable,
      Item: category
    }));

    return categoryId;
  }

  async updateCategory(categoryId: string, updates: Partial<Omit<Category, 'categoryId' | 'createdAt'>>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    updates.updatedAt = new Date().toISOString();

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) return;

    await this.client.send(new UpdateCommand({
      TableName: this.categoriesTable,
      Key: { categoryId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.categoriesTable,
      Key: { categoryId }
    }));

    return result.Item as Category || null;
  }

  async getAllCategories(): Promise<Category[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.categoriesTable
    }));

    return result.Items as Category[] || [];
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.categoriesTable,
      Key: { categoryId }
    }));
  }

  // Session methods
  async createSession(sessionData: Omit<Session, 'sessionId' | 'createdAt'>): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    
    const session: Session = {
      sessionId,
      ...sessionData,
      createdAt: now
    };

    await this.client.send(new PutCommand({
      TableName: this.sessionsTable,
      Item: session
    }));

    return sessionId;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.sessionsTable,
      Key: { sessionId }
    }));

    return result.Item as Session || null;
  }

  async getSessionsByCategory(categoryId: string): Promise<Session[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: this.sessionsTable,
      IndexName: 'categoryId-date-index',
      KeyConditionExpression: 'categoryId = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId
      }
    }));

    return result.Items as Session[] || [];
  }

  async getSessionsByDate(date: string): Promise<Session[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.sessionsTable,
      FilterExpression: '#date = :date',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':date': date
      }
    }));

    return result.Items as Session[] || [];
  }

  async getAllSessions(): Promise<Session[]> {
    const result = await this.client.send(new ScanCommand({
      TableName: this.sessionsTable
    }));

    return result.Items as Session[] || [];
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.sessionsTable,
      Key: { sessionId }
    }));
  }

  // Helper methods for migration from Notion
  async syncCategoryFromNotion(notionData: any): Promise<string> {
    const categoryData = {
      name: notionData.name || '',
      hourlyRateUSD: notionData.hourlyRateUSD || notionData.hourlyRate || 0,
      hourlyRateMMK: notionData.hourlyRateMMK || 0,
      totalTarget: notionData.totalTarget || 0,
      monthlyTarget: notionData.monthlyTarget || 0,
      dailyTarget: notionData.dailyTarget || 0,
      totalStudied: notionData.totalStudied || 0,
      monthStudied: notionData.monthStudied || 0,
      todayStudied: notionData.todayStudied || 0,
      earnedUSD: notionData.earnedUSD || notionData.earned || 0,
      earnedMMK: notionData.earnedMMK || 0,
      canWithdraw: notionData.canWithdraw || false,
      pomodoroCount: notionData.pomodoroCount || 0,
      emoji: notionData.emoji || '📚',
      priority: notionData.priority || 'medium'
    };

    return await this.createCategory(categoryData);
  }

  async logSessionFromNotion(notionData: any, categoryId: string): Promise<string> {
    const sessionData = {
      categoryId,
      sessionName: notionData.sessionName || 'Study Session',
      duration: notionData.duration || 0,
      date: notionData.date || new Date().toISOString().split('T')[0],
      isPomodoro: notionData.isPomodoro || false,
      notes: notionData.notes
    };

    return await this.createSession(sessionData);
  }
}

export const dynamodb = new DynamoDBAPI();