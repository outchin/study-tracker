interface ScheduleBlock {
  id: string;
  startTime: string; // "06:30"
  endTime: string; // "09:30"
  categoryName: string; // Must match existing category
  duration: number; // hours
  type: "study" | "break" | "hobby" | "activity" | "life";
  priority: "high" | "medium" | "low";
  description?: string;
  pomodoros?: number;
  status?: "completed" | "in-progress" | "upcoming" | "skipped";
}

interface DailySchedule {
  day: string; // "monday"
  date: string; // "2025-10-20"
  dayTheme?: string; // "Japanese Marathon", "DevOps Deep Dive", etc.
  blocks: ScheduleBlock[];
  isCustomized: boolean; // true if user edited
}

interface DefaultScheduleConfig {
  version: string;
  defaultSchedule: {
    monday: ScheduleBlock[];
    tuesday: ScheduleBlock[];
    wednesday: ScheduleBlock[];
    thursday: ScheduleBlock[];
    friday: ScheduleBlock[];
    saturday: ScheduleBlock[];
    sunday: ScheduleBlock[];
  };
}

interface ScheduleProgress {
  completed: number;
  total: number;
  percentage: number;
}

export type {
  ScheduleBlock,
  DailySchedule,
  DefaultScheduleConfig,
  ScheduleProgress
};