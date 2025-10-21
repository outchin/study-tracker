'use client';

import React, { useState, useEffect } from 'react';
import { DailySchedule, ScheduleBlock } from '../../types/schedule';
import { 
  getTodaySchedule, 
  getYesterdaySchedule, 
  getTomorrowSchedule,
  saveSchedule 
} from '../../lib/scheduleStorage';
import { 
  getCurrentBlock, 
  getNextBlock, 
  updateBlockStatusesByTime,
  markBlockComplete,
  markBlockInProgress 
} from '../../lib/scheduleHelpers';
import DayNavigator from './DayNavigator';
import CurrentBlockCard from './CurrentBlockCard';
import ScheduleBlocksList from './ScheduleBlocksList';

interface TimetableViewProps {
  onStartTimer: (categoryId: number, pomodoro: boolean) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onStopTimer?: (categoryId: number) => void;
  activeTimer: number | null;
  timerSeconds: number;
  isPaused?: boolean;
  categories: any[]; // Using any for now, will integrate with existing Category type
}

export default function TimetableView({ 
  onStartTimer, 
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  activeTimer, 
  timerSeconds,
  isPaused = false,
  categories 
}: TimetableViewProps) {
  const [selectedDay, setSelectedDay] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [yesterdaySchedule, setYesterdaySchedule] = useState<DailySchedule | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<DailySchedule | null>(null);
  const [tomorrowSchedule, setTomorrowSchedule] = useState<DailySchedule | null>(null);
  const [currentBlock, setCurrentBlock] = useState<ScheduleBlock | null>(null);
  const [nextBlock, setNextBlock] = useState<ScheduleBlock | null>(null);

  // Load schedules on mount
  useEffect(() => {
    loadAllSchedules();
  }, []);

  // Update current/next blocks every minute
  useEffect(() => {
    updateCurrentBlocks();
    const interval = setInterval(updateCurrentBlocks, 30000); // Update every 30 seconds for more responsive UI
    return () => clearInterval(interval);
  }, [todaySchedule]);

  const loadAllSchedules = () => {
    setYesterdaySchedule(getYesterdaySchedule());
    setTodaySchedule(getTodaySchedule());
    setTomorrowSchedule(getTomorrowSchedule());
  };

  const updateCurrentBlocks = () => {
    if (!todaySchedule) return;
    
    const updatedBlocks = updateBlockStatusesByTime(todaySchedule.blocks);
    const current = getCurrentBlock(updatedBlocks);
    const next = getNextBlock(updatedBlocks);
    
    setCurrentBlock(current);
    setNextBlock(next);
    
    // Update today's schedule with auto-updated statuses
    if (JSON.stringify(updatedBlocks) !== JSON.stringify(todaySchedule.blocks)) {
      const updatedSchedule = { ...todaySchedule, blocks: updatedBlocks };
      setTodaySchedule(updatedSchedule);
      saveSchedule(updatedSchedule.date, updatedBlocks, updatedSchedule.dayTheme);
    }
  };

  const getCurrentSchedule = (): DailySchedule | null => {
    switch (selectedDay) {
      case 'yesterday': return yesterdaySchedule;
      case 'today': return todaySchedule;
      case 'tomorrow': return tomorrowSchedule;
      default: return todaySchedule;
    }
  };

  const updateCurrentSchedule = (schedule: DailySchedule) => {
    console.log('updateCurrentSchedule called:', {
      selectedDay,
      scheduleDate: schedule.date,
      blocksCount: schedule.blocks.length,
      dayTheme: schedule.dayTheme
    });
    
    switch (selectedDay) {
      case 'yesterday':
        setYesterdaySchedule(schedule);
        break;
      case 'today':
        setTodaySchedule(schedule);
        break;
      case 'tomorrow':
        setTomorrowSchedule(schedule);
        break;
    }
    
    console.log('About to call saveSchedule with blocks:', schedule.blocks.length);
    saveSchedule(schedule.date, schedule.blocks, schedule.dayTheme);
  };

  const handleBlockComplete = (blockId: string) => {
    const currentSchedule = getCurrentSchedule();
    if (!currentSchedule) return;
    
    const updatedBlocks = markBlockComplete(currentSchedule.blocks, blockId);
    const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
    updateCurrentSchedule(updatedSchedule);
    
    // Update current/next blocks if this was today's schedule
    if (selectedDay === 'today') {
      updateCurrentBlocks();
    }
  };

  const handleStartTimer = (block: ScheduleBlock) => {
    // Find matching category by name
    const category = categories.find(cat => cat.name === block.categoryName);
    if (!category) {
      console.error(`Category not found: ${block.categoryName}`);
      return;
    }
    
    // Mark block as in-progress
    const currentSchedule = getCurrentSchedule();
    if (currentSchedule) {
      const updatedBlocks = markBlockInProgress(currentSchedule.blocks, block.id);
      const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
      updateCurrentSchedule(updatedSchedule);
    }
    
    // Start the timer with existing function
    onStartTimer(category.id, false);
  };

  const handleStartPomodoroTimer = (block: ScheduleBlock) => {
    // Find matching category by name
    const category = categories.find(cat => cat.name === block.categoryName);
    if (!category) {
      console.error(`Category not found: ${block.categoryName}`);
      return;
    }
    
    // Mark block as in-progress
    const currentSchedule = getCurrentSchedule();
    if (currentSchedule) {
      const updatedBlocks = markBlockInProgress(currentSchedule.blocks, block.id);
      const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
      updateCurrentSchedule(updatedSchedule);
    }
    
    // Start the pomodoro timer with existing function
    onStartTimer(category.id, true);
  };

  const handleEditBlock = (blockId: string, updates: Partial<ScheduleBlock>) => {
    const currentSchedule = getCurrentSchedule();
    if (!currentSchedule) return;
    
    const updatedBlocks = currentSchedule.blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    
    const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
    updateCurrentSchedule(updatedSchedule);
  };

  const handleDeleteBlock = (blockId: string) => {
    const currentSchedule = getCurrentSchedule();
    if (!currentSchedule) return;
    
    const updatedBlocks = currentSchedule.blocks.filter(block => block.id !== blockId);
    const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
    updateCurrentSchedule(updatedSchedule);
  };

  const handleAddBlock = (newBlock: ScheduleBlock) => {
    const currentSchedule = getCurrentSchedule();
    if (!currentSchedule) return;
    
    const updatedBlocks = [...currentSchedule.blocks, newBlock];
    const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
    updateCurrentSchedule(updatedSchedule);
  };

  const handleBulkAddBlocks = (newBlocks: ScheduleBlock[]) => {
    const currentSchedule = getCurrentSchedule();
    if (!currentSchedule) return;
    
    const updatedBlocks = [...currentSchedule.blocks, ...newBlocks];
    const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks, isCustomized: true };
    updateCurrentSchedule(updatedSchedule);
  };

  const handleReplaceAllBlocks = (newBlocks: ScheduleBlock[], newTheme?: string) => {
    const currentSchedule = getCurrentSchedule();
    if (!currentSchedule) return;
    
    const updatedSchedule = { 
      ...currentSchedule, 
      blocks: newBlocks, 
      dayTheme: newTheme || currentSchedule.dayTheme,
      isCustomized: true 
    };
    updateCurrentSchedule(updatedSchedule);
  };

  const handleUpdateDayTheme = (dayTheme: string) => {
    // Get the latest schedule state after blocks have been updated
    const currentSchedule = selectedDay === 'today' ? todaySchedule : 
                           selectedDay === 'tomorrow' ? tomorrowSchedule : 
                           selectedDay === 'yesterday' ? yesterdaySchedule : null;
    
    if (!currentSchedule) return;
    
    const updatedSchedule = { ...currentSchedule, dayTheme: dayTheme || undefined, isCustomized: true };
    updateCurrentSchedule(updatedSchedule);
  };

  const currentSchedule = getCurrentSchedule();

  if (!currentSchedule) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Day Navigator */}
        <DayNavigator
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          yesterdaySchedule={yesterdaySchedule}
          todaySchedule={todaySchedule}
          tomorrowSchedule={tomorrowSchedule}
        />

        {/* Current Block Card (only show for today) */}
        {selectedDay === 'today' && (currentBlock || nextBlock) && (
          <div className="mb-8">
            <CurrentBlockCard
              currentBlock={currentBlock}
              nextBlock={nextBlock}
              timerSeconds={timerSeconds}
              activeTimer={activeTimer}
              isPaused={isPaused}
              onStartTimer={handleStartTimer}
              onStartPomodoroTimer={handleStartPomodoroTimer}
              onPauseTimer={onPauseTimer || (() => {})}
              onResumeTimer={onResumeTimer || (() => {})}
              onStopTimer={onStopTimer ? () => onStopTimer(activeTimer || 0) : (() => {})}
              onComplete={handleBlockComplete}
            />
          </div>
        )}

        {/* Schedule Blocks List */}
        <ScheduleBlocksList
          schedule={currentSchedule}
          selectedDay={selectedDay}
          activeTimer={activeTimer}
          timerSeconds={timerSeconds}
          categories={categories}
          onStartTimer={handleStartTimer}
          onStartPomodoroTimer={handleStartPomodoroTimer}
          onComplete={handleBlockComplete}
          onEdit={handleEditBlock}
          onDelete={handleDeleteBlock}
          onAdd={handleAddBlock}
          onBulkAdd={handleBulkAddBlocks}
          onReplaceAll={handleReplaceAllBlocks}
          onUpdateDayTheme={handleUpdateDayTheme}
        />
    </div>
  );
}