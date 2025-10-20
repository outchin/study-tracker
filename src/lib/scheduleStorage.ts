import { DailySchedule, ScheduleBlock, DefaultScheduleConfig } from '../types/schedule';
import { getDayName } from './scheduleHelpers';

// localStorage keys
const SCHEDULE_KEY_PREFIX = 'schedule-';
const COMPLETION_KEY_PREFIX = 'schedule-completion-';
const DEFAULT_CONFIG_KEY = 'schedule-default-config';

// Default schedule configuration
const DEFAULT_SCHEDULE_CONFIG: DefaultScheduleConfig = {
  version: "1.0",
  defaultSchedule: {
    monday: [
      {
        id: "default-mon-1",
        startTime: "06:30",
        endTime: "09:30",
        categoryName: "Japanese",
        duration: 3,
        type: "study",
        priority: "high",
        description: "Grammar, vocabulary, reading",
        status: "upcoming"
      },
      {
        id: "default-mon-2",
        startTime: "09:45",
        endTime: "11:45",
        categoryName: "Japanese",
        duration: 2,
        type: "study",
        priority: "high",
        description: "Listening, speaking",
        status: "upcoming"
      },
      {
        id: "default-mon-3",
        startTime: "13:00",
        endTime: "16:00",
        categoryName: "Cloud DevOps",
        duration: 3,
        type: "study",
        priority: "high",
        description: "Tutorial, hands-on practice",
        status: "upcoming"
      },
      {
        id: "default-mon-4",
        startTime: "16:15",
        endTime: "17:15",
        categoryName: "Master Thesis",
        duration: 1,
        type: "study",
        priority: "medium",
        description: "Research/writing",
        status: "upcoming"
      }
    ],
    tuesday: [
      {
        id: "default-tue-1",
        startTime: "07:00",
        endTime: "08:00",
        categoryName: "Japanese",
        duration: 1,
        type: "study",
        priority: "medium",
        description: "Review previous day",
        status: "upcoming"
      },
      {
        id: "default-tue-2",
        startTime: "09:00",
        endTime: "14:00",
        categoryName: "Cloud DevOps",
        duration: 5,
        type: "study",
        priority: "high",
        description: "Deep dive, projects",
        status: "upcoming"
      },
      {
        id: "default-tue-3",
        startTime: "15:00",
        endTime: "18:00",
        categoryName: "English",
        duration: 3,
        type: "study",
        priority: "medium",
        description: "Speaking, writing practice",
        status: "upcoming"
      }
    ],
    wednesday: [
      {
        id: "default-wed-1",
        startTime: "06:30",
        endTime: "11:30",
        categoryName: "Japanese",
        duration: 5,
        type: "study",
        priority: "high",
        description: "Intensive study session",
        status: "upcoming"
      },
      {
        id: "default-wed-2",
        startTime: "13:00",
        endTime: "14:30",
        categoryName: "Cloud DevOps",
        duration: 1.5,
        type: "study",
        priority: "low",
        description: "Light review",
        status: "upcoming"
      },
      {
        id: "default-wed-3",
        startTime: "15:00",
        endTime: "18:00",
        categoryName: "Master Thesis",
        duration: 3,
        type: "study",
        priority: "high",
        description: "Writing, research",
        status: "upcoming"
      }
    ],
    thursday: [
      {
        id: "default-thu-1",
        startTime: "07:00",
        endTime: "08:30",
        categoryName: "Japanese",
        duration: 1.5,
        type: "study",
        priority: "medium",
        description: "Morning review",
        status: "upcoming"
      },
      {
        id: "default-thu-2",
        startTime: "09:00",
        endTime: "13:00",
        categoryName: "Cloud DevOps",
        duration: 4,
        type: "study",
        priority: "high",
        description: "Practical work",
        status: "upcoming"
      },
      {
        id: "default-thu-3",
        startTime: "14:00",
        endTime: "18:00",
        categoryName: "English",
        duration: 4,
        type: "study",
        priority: "high",
        description: "Comprehensive practice",
        status: "upcoming"
      }
    ],
    friday: [
      {
        id: "default-fri-1",
        startTime: "06:30",
        endTime: "12:30",
        categoryName: "Japanese",
        duration: 6,
        type: "study",
        priority: "high",
        description: "Extended study session",
        status: "upcoming"
      },
      {
        id: "default-fri-2",
        startTime: "14:00",
        endTime: "15:00",
        categoryName: "English",
        duration: 1,
        type: "study",
        priority: "low",
        description: "Quick review",
        status: "upcoming"
      },
      {
        id: "default-fri-3",
        startTime: "15:30",
        endTime: "17:30",
        categoryName: "Master Thesis",
        duration: 2,
        type: "study",
        priority: "medium",
        description: "Weekly progress",
        status: "upcoming"
      }
    ],
    saturday: [
      {
        id: "default-sat-1",
        startTime: "08:00",
        endTime: "10:00",
        categoryName: "Japanese",
        duration: 2,
        type: "study",
        priority: "medium",
        description: "Weekend practice",
        status: "upcoming"
      },
      {
        id: "default-sat-2",
        startTime: "10:30",
        endTime: "15:30",
        categoryName: "Cloud DevOps",
        duration: 5,
        type: "study",
        priority: "high",
        description: "Weekend deep dive",
        status: "upcoming"
      },
      {
        id: "default-sat-3",
        startTime: "16:00",
        endTime: "17:00",
        categoryName: "English",
        duration: 1,
        type: "study",
        priority: "low",
        description: "Light practice",
        status: "upcoming"
      }
    ],
    sunday: [
      {
        id: "default-sun-1",
        startTime: "08:00",
        endTime: "09:30",
        categoryName: "Japanese",
        duration: 1.5,
        type: "study",
        priority: "low",
        description: "Relaxed study",
        status: "upcoming"
      },
      {
        id: "default-sun-2", 
        startTime: "10:00",
        endTime: "11:30",
        categoryName: "Cloud DevOps",
        duration: 1.5,
        type: "study",
        priority: "low",
        description: "Light review",
        status: "upcoming"
      },
      {
        id: "default-sun-3",
        startTime: "14:00",
        endTime: "15:00",
        categoryName: "English",
        duration: 1,
        type: "study",
        priority: "low",
        description: "Casual practice",
        status: "upcoming"
      },
      {
        id: "default-sun-4",
        startTime: "15:30",
        endTime: "18:30",
        categoryName: "Master Thesis",
        duration: 3,
        type: "study",
        priority: "medium",
        description: "Weekend planning",
        status: "upcoming"
      }
    ]
  }
};

// Storage utilities
export const saveSchedule = (date: string, blocks: ScheduleBlock[], dayTheme?: string): void => {
  try {
    const key = `${SCHEDULE_KEY_PREFIX}${date}`;
    const scheduleData = {
      blocks,
      dayTheme: dayTheme || undefined
    };
    localStorage.setItem(key, JSON.stringify(scheduleData));
  } catch (error) {
    console.error('Failed to save schedule:', error);
  }
};

// Backward compatibility function for saving just blocks
export const saveScheduleBlocks = (date: string, blocks: ScheduleBlock[]): void => {
  saveSchedule(date, blocks);
};

export const loadSchedule = (date: string): DailySchedule => {
  try {
    // First, try to load custom schedule from localStorage
    const key = `${SCHEDULE_KEY_PREFIX}${date}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const scheduleData = JSON.parse(saved);
      // Handle both old format (just blocks array) and new format (full schedule object)
      if (Array.isArray(scheduleData)) {
        return {
          day: getDayName(date),
          date,
          blocks: scheduleData,
          isCustomized: true
        };
      } else {
        return {
          day: getDayName(date),
          date,
          dayTheme: scheduleData.dayTheme,
          blocks: scheduleData.blocks || scheduleData,
          isCustomized: true
        };
      }
    }
    
    // If no custom schedule, load from default config
    const dayName = getDayName(date) as keyof typeof DEFAULT_SCHEDULE_CONFIG.defaultSchedule;
    const defaultBlocks = getDefaultScheduleConfig().defaultSchedule[dayName] || [];
    
    // Generate new IDs for default blocks to avoid conflicts
    const blocksWithNewIds = defaultBlocks.map((block, index) => ({
      ...block,
      id: `${date}-${block.id}-${index}-${Date.now()}`,
      status: 'upcoming' as const
    }));
    
    return {
      day: dayName,
      date,
      blocks: blocksWithNewIds,
      isCustomized: false
    };
  } catch (error) {
    console.error('Failed to load schedule:', error);
    return {
      day: getDayName(date),
      date,
      blocks: [],
      isCustomized: false
    };
  }
};

export const getTodaySchedule = (): DailySchedule => {
  const today = new Date().toISOString().split('T')[0];
  return loadSchedule(today);
};

export const getYesterdaySchedule = (): DailySchedule => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().split('T')[0];
  return loadSchedule(date);
};

export const getTomorrowSchedule = (): DailySchedule => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];
  return loadSchedule(date);
};

// Completion tracking
export const saveCompletion = (date: string, completionData: Record<string, boolean>): void => {
  try {
    const key = `${COMPLETION_KEY_PREFIX}${date}`;
    localStorage.setItem(key, JSON.stringify(completionData));
  } catch (error) {
    console.error('Failed to save completion data:', error);
  }
};

export const loadCompletion = (date: string): Record<string, boolean> => {
  try {
    const key = `${COMPLETION_KEY_PREFIX}${date}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load completion data:', error);
    return {};
  }
};

export const markBlockComplete = (date: string, blockId: string): void => {
  const completion = loadCompletion(date);
  completion[blockId] = true;
  saveCompletion(date, completion);
};

export const markBlockIncomplete = (date: string, blockId: string): void => {
  const completion = loadCompletion(date);
  delete completion[blockId];
  saveCompletion(date, completion);
};

export const isBlockCompleted = (date: string, blockId: string): boolean => {
  const completion = loadCompletion(date);
  return completion[blockId] || false;
};

// Default schedule configuration
export const getDefaultScheduleConfig = (): DefaultScheduleConfig => {
  try {
    const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load default config:', error);
  }
  
  // Return and save default config
  saveDefaultScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
  return DEFAULT_SCHEDULE_CONFIG;
};

export const saveDefaultScheduleConfig = (config: DefaultScheduleConfig): void => {
  try {
    localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save default config:', error);
  }
};

// Reset and bulk operations
export const resetToDefault = (date: string): DailySchedule => {
  try {
    // Remove custom schedule
    const key = `${SCHEDULE_KEY_PREFIX}${date}`;
    localStorage.removeItem(key);
    
    // Remove completion data
    const completionKey = `${COMPLETION_KEY_PREFIX}${date}`;
    localStorage.removeItem(completionKey);
    
    // Return default schedule
    return loadSchedule(date);
  } catch (error) {
    console.error('Failed to reset schedule:', error);
    return loadSchedule(date);
  }
};

export const copyFromDate = (fromDate: string, toDate: string): DailySchedule => {
  try {
    const sourceSchedule = loadSchedule(fromDate);
    
    // Generate new IDs for copied blocks
    const newBlocks = sourceSchedule.blocks.map((block, index) => ({
      ...block,
      id: `${toDate}-copy-${index}-${Date.now()}`,
      status: 'upcoming' as const
    }));
    
    // Save as custom schedule
    saveSchedule(toDate, newBlocks);
    
    return {
      day: getDayName(toDate),
      date: toDate,
      blocks: newBlocks,
      isCustomized: true
    };
  } catch (error) {
    console.error('Failed to copy schedule:', error);
    return loadSchedule(toDate);
  }
};

// Data management
export const exportScheduleData = (): string => {
  try {
    const data = {
      config: getDefaultScheduleConfig(),
      schedules: {},
      completions: {}
    };
    
    // Export all custom schedules
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SCHEDULE_KEY_PREFIX)) {
        const date = key.replace(SCHEDULE_KEY_PREFIX, '');
        (data.schedules as any)[date] = JSON.parse(localStorage.getItem(key) || '[]');
      }
      if (key?.startsWith(COMPLETION_KEY_PREFIX)) {
        const date = key.replace(COMPLETION_KEY_PREFIX, '');
        (data.completions as any)[date] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to export schedule data:', error);
    return '{}';
  }
};

export const importScheduleData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    // Import default config if provided
    if (data.config) {
      saveDefaultScheduleConfig(data.config);
    }
    
    // Import custom schedules
    if (data.schedules) {
      Object.entries(data.schedules).forEach(([date, blocks]) => {
        saveSchedule(date, blocks as ScheduleBlock[]);
      });
    }
    
    // Import completion data
    if (data.completions) {
      Object.entries(data.completions).forEach(([date, completion]) => {
        saveCompletion(date, completion as Record<string, boolean>);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import schedule data:', error);
    return false;
  }
};

// Cleanup old data (keep last 30 days)
export const cleanupOldData = (): void => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SCHEDULE_KEY_PREFIX) || key?.startsWith(COMPLETION_KEY_PREFIX)) {
        const date = key.replace(SCHEDULE_KEY_PREFIX, '').replace(COMPLETION_KEY_PREFIX, '');
        if (date < cutoffDate) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleaned up ${keysToRemove.length} old schedule entries`);
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
  }
};

// Clear all schedule data (for debugging)
export const clearAllScheduleData = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SCHEDULE_KEY_PREFIX) || 
          key?.startsWith(COMPLETION_KEY_PREFIX) || 
          key === DEFAULT_CONFIG_KEY) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared all schedule data: ${keysToRemove.length} entries`);
  } catch (error) {
    console.error('Failed to clear schedule data:', error);
  }
};