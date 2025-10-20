'use client';

import React, { useState, useEffect } from 'react';
import { DailySchedule } from '../../types/schedule';
import { calculateProgress } from '../../lib/scheduleHelpers';

interface DayNavigatorProps {
  selectedDay: 'yesterday' | 'today' | 'tomorrow';
  onDaySelect: (day: 'yesterday' | 'today' | 'tomorrow') => void;
  yesterdaySchedule: DailySchedule | null;
  todaySchedule: DailySchedule | null;
  tomorrowSchedule: DailySchedule | null;
}

export default function DayNavigator({
  selectedDay,
  onDaySelect,
  yesterdaySchedule,
  todaySchedule,
  tomorrowSchedule
}: DayNavigatorProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const formatDate = (schedule: DailySchedule | null): string => {
    if (!schedule) return '';
    const date = new Date(schedule.date);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getProgressBar = (schedule: DailySchedule | null): React.ReactNode => {
    if (!schedule || schedule.blocks.length === 0) {
      return <div className="w-full h-1 bg-gray-100 rounded"></div>;
    }
    
    const progress = calculateProgress(schedule.blocks);
    
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{progress.completed}/{progress.total}</span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
        <div className="w-full h-1 bg-gray-100 rounded overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const getDayLabel = (day: 'yesterday' | 'today' | 'tomorrow'): string => {
    switch (day) {
      case 'yesterday': return 'Yesterday';
      case 'today': return 'TODAY';
      case 'tomorrow': return 'Tomorrow';
    }
  };

  const getScheduleForDay = (day: 'yesterday' | 'today' | 'tomorrow'): DailySchedule | null => {
    switch (day) {
      case 'yesterday': return yesterdaySchedule;
      case 'today': return todaySchedule;
      case 'tomorrow': return tomorrowSchedule;
    }
  };

  const days: ('yesterday' | 'today' | 'tomorrow')[] = ['yesterday', 'today', 'tomorrow'];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-3 gap-4">
        {days.map((day) => {
          const schedule = getScheduleForDay(day);
          const isSelected = selectedDay === day;
          const isToday = day === 'today';
          
          return (
            <button
              key={day}
              onClick={() => onDaySelect(day)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
                ${isToday ? 'ring-2 ring-green-100' : ''}
              `}
            >
              <div className="space-y-2">
                {/* Day Label */}
                <div className="flex items-center justify-between">
                  <span className={`
                    text-sm font-medium tracking-wide
                    ${isSelected 
                      ? 'text-green-700' 
                      : isToday 
                        ? 'text-black' 
                        : 'text-gray-600'
                    }
                    ${isToday ? 'uppercase' : ''}
                  `}>
                    {getDayLabel(day)}
                  </span>
                  {schedule?.isCustomized && (
                    <span className="text-xs text-blue-600 font-medium">CUSTOM</span>
                  )}
                </div>
                
                {/* Date and Theme */}
                <div className={`
                  text-lg font-light
                  ${isSelected ? 'text-green-800' : 'text-gray-800'}
                `}>
                  {formatDate(schedule)}
                  {schedule?.dayTheme && (
                    <div className="text-xs text-purple-600 mt-1 font-medium">
                      {schedule.dayTheme}
                    </div>
                  )}
                  {isToday && (
                    <div className="text-sm font-normal text-blue-600 mt-1 flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      {currentTime}
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  {getProgressBar(schedule)}
                </div>
                
                {/* Block Count */}
                <div className={`
                  text-xs
                  ${isSelected ? 'text-green-600' : 'text-gray-500'}
                `}>
                  {schedule?.blocks.length || 0} blocks scheduled
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Additional Info Bar */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Viewing: <span className="font-medium text-gray-800">{getDayLabel(selectedDay)}</span>
            </span>
            {getScheduleForDay(selectedDay)?.dayTheme && (
              <span className="text-purple-700 text-sm font-medium bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                🎯 {getScheduleForDay(selectedDay)?.dayTheme}
              </span>
            )}
            {getScheduleForDay(selectedDay)?.isCustomized && (
              <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded">
                Customized Schedule
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              <span className="text-xs">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}