import { ConfigManager } from './config';
import { DynamoDBAPI } from './dynamodb';
import { notion } from '../../lib/notion';

export interface Category {
  id: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  categoryId: string;
  sessionName: string;
  duration: number;
  date: string;
  isPomodoro: boolean;
  notes?: string;
  createdAt?: string;
}

export interface DatabaseProvider {
  // Category operations
  createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateCategory(categoryId: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void>;
  getCategory(categoryId: string): Promise<Category | null>;
  getAllCategories(): Promise<Category[]>;
  deleteCategory(categoryId: string): Promise<void>;

  // Session operations
  createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<string>;
  getSession(sessionId: string): Promise<Session | null>;
  getSessionsByCategory(categoryId: string): Promise<Session[]>;
  getSessionsByDate(date: string): Promise<Session[]>;
  getAllSessions(): Promise<Session[]>;
  deleteSession(sessionId: string): Promise<void>;
}

class NotionProvider implements DatabaseProvider {
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const notionCategory = {
      id: 'new',
      name: categoryData.name,
      hourlyRate: categoryData.hourlyRateUSD,
      totalTarget: categoryData.totalTarget,
      monthlyTarget: categoryData.monthlyTarget,
      dailyTarget: categoryData.dailyTarget,
      totalStudied: categoryData.totalStudied,
      monthStudied: categoryData.monthStudied,
      todayStudied: categoryData.todayStudied,
      earned: categoryData.earnedUSD,
      canWithdraw: categoryData.canWithdraw,
      pomodoroCount: categoryData.pomodoroCount
    };
    
    return await notion.syncCategoryToNotion(notionCategory);
  }

  async updateCategory(categoryId: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    const updateData = {
      id: categoryId,
      name: updates.name || '',
      hourlyRate: updates.hourlyRateUSD || 0,
      totalTarget: updates.totalTarget || 0,
      monthlyTarget: updates.monthlyTarget || 0,
      dailyTarget: updates.dailyTarget || 0,
      totalStudied: updates.totalStudied || 0,
      monthStudied: updates.monthStudied || 0,
      todayStudied: updates.todayStudied || 0,
      earned: updates.earnedUSD || 0,
      canWithdraw: updates.canWithdraw || false,
      pomodoroCount: updates.pomodoroCount || 0
    };
    
    await notion.syncCategoryToNotion(updateData);
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    // Notion doesn't have direct get by ID, would need to implement
    throw new Error('Not implemented for Notion provider');
  }

  async getAllCategories(): Promise<Category[]> {
    const notionCategories = await notion.getCategoriesFromNotion();
    return notionCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      hourlyRateUSD: cat.hourlyRate,
      hourlyRateMMK: cat.hourlyRate * 4200, // Convert from USD
      totalTarget: cat.totalTarget,
      monthlyTarget: cat.monthlyTarget,
      dailyTarget: cat.dailyTarget,
      totalStudied: cat.totalStudied,
      monthStudied: cat.monthStudied,
      todayStudied: cat.todayStudied,
      earnedUSD: cat.earned,
      earnedMMK: cat.earned * 4200, // Convert from USD
      canWithdraw: cat.canWithdraw,
      pomodoroCount: cat.pomodoroCount,
      emoji: '📚', // Default emoji for Notion
      priority: 'medium' // Default priority for Notion
    }));
  }

  async deleteCategory(categoryId: string): Promise<void> {
    // Notion archiving would need to be implemented here
    throw new Error('Not implemented for Notion provider');
  }

  async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<string> {
    const notionSession = {
      sessionName: sessionData.sessionName,
      categoryId: sessionData.categoryId,
      duration: sessionData.duration,
      date: sessionData.date,
      isPomodoro: sessionData.isPomodoro,
      notes: sessionData.notes
    };
    
    return await notion.logSessionToNotion(notionSession);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    throw new Error('Not implemented for Notion provider');
  }

  async getSessionsByCategory(categoryId: string): Promise<Session[]> {
    throw new Error('Not implemented for Notion provider');
  }

  async getSessionsByDate(date: string): Promise<Session[]> {
    throw new Error('Not implemented for Notion provider');
  }

  async getAllSessions(): Promise<Session[]> {
    throw new Error('Not implemented for Notion provider');
  }

  async deleteSession(sessionId: string): Promise<void> {
    throw new Error('Not implemented for Notion provider');
  }
}

class DynamoDBProvider implements DatabaseProvider {
  private getDynamoClient(): DynamoDBAPI {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getDynamoDBConfig();
    
    if (config) {
      return new DynamoDBAPI({
        region: config.region,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        categoriesTable: config.categoriesTable,
        sessionsTable: config.sessionsTable
      });
    } else {
      // Fallback to environment variables
      return new DynamoDBAPI();
    }
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const dynamodb = this.getDynamoClient();
    return await dynamodb.createCategory(categoryData);
  }

  async updateCategory(categoryId: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    const dynamodb = this.getDynamoClient();
    await dynamodb.updateCategory(categoryId, updates);
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    const dynamodb = this.getDynamoClient();
    const result = await dynamodb.getCategory(categoryId);
    if (!result) return null;
    
    return {
      id: result.categoryId,
      name: result.name,
      hourlyRateUSD: result.hourlyRateUSD,
      hourlyRateMMK: result.hourlyRateMMK,
      totalTarget: result.totalTarget,
      monthlyTarget: result.monthlyTarget,
      dailyTarget: result.dailyTarget,
      totalStudied: result.totalStudied,
      monthStudied: result.monthStudied,
      todayStudied: result.todayStudied,
      earnedUSD: result.earnedUSD,
      earnedMMK: result.earnedMMK,
      canWithdraw: result.canWithdraw,
      pomodoroCount: result.pomodoroCount,
      emoji: result.emoji,
      priority: result.priority,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  async getAllCategories(): Promise<Category[]> {
    const dynamodb = this.getDynamoClient();
    const categories = await dynamodb.getAllCategories();
    return categories.map(cat => ({
      id: cat.categoryId,
      name: cat.name,
      hourlyRateUSD: cat.hourlyRateUSD,
      hourlyRateMMK: cat.hourlyRateMMK,
      totalTarget: cat.totalTarget,
      monthlyTarget: cat.monthlyTarget,
      dailyTarget: cat.dailyTarget,
      totalStudied: cat.totalStudied,
      monthStudied: cat.monthStudied,
      todayStudied: cat.todayStudied,
      earnedUSD: cat.earnedUSD,
      earnedMMK: cat.earnedMMK,
      canWithdraw: cat.canWithdraw,
      pomodoroCount: cat.pomodoroCount,
      emoji: cat.emoji,
      priority: cat.priority,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    }));
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const dynamodb = this.getDynamoClient();
    await dynamodb.deleteCategory(categoryId);
  }

  async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<string> {
    const dynamodb = this.getDynamoClient();
    return await dynamodb.createSession(sessionData);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const dynamodb = this.getDynamoClient();
    const result = await dynamodb.getSession(sessionId);
    if (!result) return null;
    
    return {
      id: result.sessionId,
      categoryId: result.categoryId,
      sessionName: result.sessionName,
      duration: result.duration,
      date: result.date,
      isPomodoro: result.isPomodoro,
      notes: result.notes,
      createdAt: result.createdAt
    };
  }

  async getSessionsByCategory(categoryId: string): Promise<Session[]> {
    const dynamodb = this.getDynamoClient();
    const sessions = await dynamodb.getSessionsByCategory(categoryId);
    return sessions.map(session => ({
      id: session.sessionId,
      categoryId: session.categoryId,
      sessionName: session.sessionName,
      duration: session.duration,
      date: session.date,
      isPomodoro: session.isPomodoro,
      notes: session.notes,
      createdAt: session.createdAt
    }));
  }

  async getSessionsByDate(date: string): Promise<Session[]> {
    const dynamodb = this.getDynamoClient();
    const sessions = await dynamodb.getSessionsByDate(date);
    return sessions.map(session => ({
      id: session.sessionId,
      categoryId: session.categoryId,
      sessionName: session.sessionName,
      duration: session.duration,
      date: session.date,
      isPomodoro: session.isPomodoro,
      notes: session.notes,
      createdAt: session.createdAt
    }));
  }

  async getAllSessions(): Promise<Session[]> {
    const dynamodb = this.getDynamoClient();
    const sessions = await dynamodb.getAllSessions();
    return sessions.map(session => ({
      id: session.sessionId,
      categoryId: session.categoryId,
      sessionName: session.sessionName,
      duration: session.duration,
      date: session.date,
      isPomodoro: session.isPomodoro,
      notes: session.notes,
      createdAt: session.createdAt
    }));
  }

  async deleteSession(sessionId: string): Promise<void> {
    const dynamodb = this.getDynamoClient();
    await dynamodb.deleteSession(sessionId);
  }
}

export class DatabaseService {
  private static instance: DatabaseService;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  getProvider(): DatabaseProvider {
    const databaseProvider = this.configManager.getDatabaseProvider();
    
    if (databaseProvider === 'dynamodb') {
      return new DynamoDBProvider();
    } else {
      return new NotionProvider();
    }
  }

  // Convenience methods that delegate to the current provider
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.getProvider().createCategory(categoryData);
  }

  async updateCategory(categoryId: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    await this.getProvider().updateCategory(categoryId, updates);
  }

  async getCategory(categoryId: string): Promise<Category | null> {
    return await this.getProvider().getCategory(categoryId);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.getProvider().getAllCategories();
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.getProvider().deleteCategory(categoryId);
  }

  async createSession(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<string> {
    return await this.getProvider().createSession(sessionData);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return await this.getProvider().getSession(sessionId);
  }

  async getSessionsByCategory(categoryId: string): Promise<Session[]> {
    return await this.getProvider().getSessionsByCategory(categoryId);
  }

  async getSessionsByDate(date: string): Promise<Session[]> {
    return await this.getProvider().getSessionsByDate(date);
  }

  async getAllSessions(): Promise<Session[]> {
    return await this.getProvider().getAllSessions();
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.getProvider().deleteSession(sessionId);
  }

  getCurrentProvider(): string {
    return this.configManager.getDatabaseProvider();
  }
}

export const database = DatabaseService.getInstance();