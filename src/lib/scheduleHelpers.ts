import { ScheduleBlock, DailySchedule, ScheduleProgress } from '../types/schedule';

// Date utilities
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]; // "2025-10-20"
};

export const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export const getDayName = (date: string): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

// Time utilities
export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const isTimeBetween = (current: string, start: string, end: string): boolean => {
  const currentMinutes = timeToMinutes(current);
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);

  // Handle overnight ranges (e.g., 23:00 - 02:00)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
    // If current time is before midnight, we might need to adjust it too
    if (currentMinutes < startMinutes) {
      return currentMinutes <= endMinutes - (24 * 60);
    }
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // Handle overnight schedules (e.g., 23:00 - 02:00)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }

  return (endMinutes - startMinutes) / 60; // Return hours
};

// Block utilities
export const getCurrentBlock = (blocks: ScheduleBlock[]): ScheduleBlock | null => {
  const currentTime = getCurrentTime();
  
  return blocks.find(block => 
    isTimeBetween(currentTime, block.startTime, block.endTime)
  ) || null;
};

export const getNextBlock = (blocks: ScheduleBlock[]): ScheduleBlock | null => {
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);
  
  const futureBlocks = blocks
    .filter(block => timeToMinutes(block.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  return futureBlocks[0] || null;
};

export const getPreviousBlock = (blocks: ScheduleBlock[]): ScheduleBlock | null => {
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);
  
  const pastBlocks = blocks
    .filter(block => timeToMinutes(block.endTime) < currentMinutes)
    .sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime));
  
  return pastBlocks[0] || null;
};

export const getBlockById = (blocks: ScheduleBlock[], blockId: string): ScheduleBlock | null => {
  return blocks.find(block => block.id === blockId) || null;
};

// Progress calculations
export const calculateProgress = (blocks: ScheduleBlock[]): ScheduleProgress => {
  const total = blocks.length;
  const completed = blocks.filter(block => block.status === 'completed').length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return { completed, total, percentage };
};

export const calculateTimeProgress = (blocks: ScheduleBlock[]): ScheduleProgress => {
  const totalMinutes = blocks.reduce((sum, block) => {
    const duration = calculateDuration(block.startTime, block.endTime);
    return sum + (duration * 60); // Convert hours back to minutes
  }, 0);

  const completedMinutes = blocks
    .filter(block => block.status === 'completed')
    .reduce((sum, block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      return sum + (duration * 60); // Convert hours back to minutes
    }, 0);

  const percentage = totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0;

  return {
    completed: completedMinutes / 60, // Convert to hours
    total: totalMinutes / 60, // Convert to hours
    percentage
  };
};

// Block status management
export const updateBlockStatus = (
  blocks: ScheduleBlock[], 
  blockId: string, 
  status: ScheduleBlock['status']
): ScheduleBlock[] => {
  return blocks.map(block => 
    block.id === blockId ? { ...block, status } : block
  );
};

export const markBlockComplete = (blocks: ScheduleBlock[], blockId: string): ScheduleBlock[] => {
  return updateBlockStatus(blocks, blockId, 'completed');
};

export const markBlockInProgress = (blocks: ScheduleBlock[], blockId: string): ScheduleBlock[] => {
  // First, clear any other in-progress blocks
  const clearedBlocks = blocks.map(block => 
    block.status === 'in-progress' ? { ...block, status: 'upcoming' as const } : block
  );
  
  // Then mark the target block as in-progress
  return updateBlockStatus(clearedBlocks, blockId, 'in-progress');
};

export const markBlockSkipped = (blocks: ScheduleBlock[], blockId: string): ScheduleBlock[] => {
  return updateBlockStatus(blocks, blockId, 'skipped');
};

// Block creation and editing
export const createScheduleBlock = (
  startTime: string,
  endTime: string,
  categoryName: string,
  type: ScheduleBlock['type'] = 'study',
  priority: ScheduleBlock['priority'] = 'medium',
  description?: string
): ScheduleBlock => {
  // Generate a more unique ID with timestamp + random + category hash
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const categoryHash = categoryName.replace(/\s+/g, '').toLowerCase();
  
  return {
    id: `block-${timestamp}-${categoryHash}-${random}`,
    startTime,
    endTime,
    categoryName,
    duration: calculateDuration(startTime, endTime),
    type,
    priority,
    description,
    status: 'upcoming'
  };
};

export const updateScheduleBlock = (
  blocks: ScheduleBlock[],
  blockId: string,
  updates: Partial<ScheduleBlock>
): ScheduleBlock[] => {
  return blocks.map(block => {
    if (block.id === blockId) {
      const updatedBlock = { ...block, ...updates };
      // Recalculate duration if times changed
      if (updates.startTime || updates.endTime) {
        updatedBlock.duration = calculateDuration(updatedBlock.startTime, updatedBlock.endTime);
      }
      return updatedBlock;
    }
    return block;
  });
};

export const deleteScheduleBlock = (blocks: ScheduleBlock[], blockId: string): ScheduleBlock[] => {
  return blocks.filter(block => block.id !== blockId);
};

// Time conflict detection
export const detectTimeConflicts = (blocks: ScheduleBlock[], newBlock: ScheduleBlock): ScheduleBlock[] => {
  const newStartMinutes = timeToMinutes(newBlock.startTime);
  let newEndMinutes = timeToMinutes(newBlock.endTime);

  // Handle overnight for new block
  const newIsOvernight = newEndMinutes < newStartMinutes;
  if (newIsOvernight) {
    newEndMinutes += 24 * 60;
  }

  return blocks.filter(block => {
    if (block.id === newBlock.id) return false; // Skip self when editing

    const blockStartMinutes = timeToMinutes(block.startTime);
    let blockEndMinutes = timeToMinutes(block.endTime);

    // Handle overnight for existing block
    const blockIsOvernight = blockEndMinutes < blockStartMinutes;
    if (blockIsOvernight) {
      blockEndMinutes += 24 * 60;
    }

    // For overnight blocks, we need to check both before and after midnight
    if (newIsOvernight || blockIsOvernight) {
      // Check if there's any overlap considering the day boundary
      // This is more complex, but we can simplify by checking multiple scenarios

      // Normalize times to handle wraparound
      const hasOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
        return !(end1 <= start2 || start1 >= end2);
      };

      // Check primary overlap
      if (hasOverlap(newStartMinutes, newEndMinutes, blockStartMinutes, blockEndMinutes)) {
        return true;
      }

      // If new block is overnight, also check its after-midnight portion against before-midnight blocks
      if (newIsOvernight && !blockIsOvernight) {
        // Check if block overlaps with new block's after-midnight portion (0 to end)
        if (hasOverlap(0, newEndMinutes - 24 * 60, blockStartMinutes, blockEndMinutes)) {
          return true;
        }
      }

      // If existing block is overnight, check if new block overlaps with its after-midnight portion
      if (!newIsOvernight && blockIsOvernight) {
        // Check if new block overlaps with existing block's after-midnight portion
        if (hasOverlap(newStartMinutes, newEndMinutes, 0, blockEndMinutes - 24 * 60)) {
          return true;
        }
      }

      return false;
    }

    // Standard non-overnight overlap check
    return !(newEndMinutes <= blockStartMinutes || newStartMinutes >= blockEndMinutes);
  });
};

// Auto-update block statuses based on current time
export const updateBlockStatusesByTime = (blocks: ScheduleBlock[]): ScheduleBlock[] => {
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);
  
  return blocks.map(block => {
    const blockStartMinutes = timeToMinutes(block.startTime);
    const blockEndMinutes = timeToMinutes(block.endTime);
    
    // Don't change manually set statuses (completed, skipped)
    if (block.status === 'completed' || block.status === 'skipped') {
      return block;
    }
    
    // If currently in this time slot and not manually set
    if (currentMinutes >= blockStartMinutes && currentMinutes <= blockEndMinutes) {
      // Only auto-set to in-progress if it's currently upcoming
      if (block.status === 'upcoming') {
        return { ...block, status: 'in-progress' as const };
      }
      return block;
    }
    
    // If time has passed and not completed/skipped, keep as upcoming
    // This allows users to still start/complete past blocks
    return { ...block, status: 'upcoming' as const };
  });
};

// Format time for display
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`;
  }
  return `${hours}h`;
};

// Get time until next block
export const getTimeUntilBlock = (block: ScheduleBlock): string => {
  const currentMinutes = timeToMinutes(getCurrentTime());
  const blockStartMinutes = timeToMinutes(block.startTime);
  const diffMinutes = blockStartMinutes - currentMinutes;
  
  if (diffMinutes <= 0) return "Now";
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Get remaining time in current block
export const getRemainingTimeInBlock = (block: ScheduleBlock): string => {
  const currentMinutes = timeToMinutes(getCurrentTime());
  const blockEndMinutes = timeToMinutes(block.endTime);
  const diffMinutes = blockEndMinutes - currentMinutes;
  
  if (diffMinutes <= 0) return "Finished";
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};