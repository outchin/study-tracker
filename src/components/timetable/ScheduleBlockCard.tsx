'use client';

import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Target,
  AlertCircle,
  Coffee
} from 'lucide-react';
import { ScheduleBlock } from '../../types/schedule';
import { formatTimeRange, isTimeBetween, getCurrentTime } from '../../lib/scheduleHelpers';

interface ScheduleBlockCardProps {
  block: ScheduleBlock;
  isActive?: boolean;
  isCurrentTime?: boolean;
  timerSeconds?: number;
  scheduleDate?: string; // The date this schedule belongs to
  onStartTimer: (block: ScheduleBlock) => void;
  onStartPomodoroTimer: (block: ScheduleBlock) => void;
  onComplete: (blockId: string) => void;
  onEdit: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  canEdit?: boolean;
}

export default function ScheduleBlockCard({
  block,
  isActive = false,
  isCurrentTime = false,
  timerSeconds = 0,
  scheduleDate,
  onStartTimer,
  onStartPomodoroTimer,
  onComplete,
  onEdit,
  onDelete,
  canEdit = true
}: ScheduleBlockCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryEmoji = (categoryName: string): string => {
    const emojiMap: Record<string, string> = {
      'Japanese': '🇯🇵',
      'Cloud DevOps': '☁️',
      'English': '🇬🇧',
      'Master Thesis': '📝',
      'DevOps': '☁️',
      'Thesis': '📝'
    };
    
    return emojiMap[categoryName] || '📚';
  };

  const getStatusIcon = () => {
    const isPast = isPastTime();
    
    switch (block.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        if (isCurrentTime) return <div className="w-5 h-5 bg-blue-500 rounded-full animate-pulse" />;
        if (isPast && block.status === 'upcoming') return <AlertCircle className="w-5 h-5 text-orange-600" />;
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    const isPast = isPastTime();
    
    switch (block.status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'skipped': return 'Skipped';
      case 'upcoming': 
        if (isCurrentTime) return '📍 Current Time';
        if (isPast) return '⏰ Time Passed';
        return 'Upcoming';
      default: 
        if (isPast) return '⏰ Time Passed';
        return 'Upcoming';
    }
  };

  const getStatusColor = () => {
    const isPast = isPastTime();
    
    switch (block.status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress': return 'text-red-600 bg-red-50 border-red-200';
      case 'skipped': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: 
        if (isCurrentTime) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (isPast && block.status === 'upcoming') return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'study': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const isPastTime = () => {
    const currentTime = getCurrentTime();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // If we have a schedule date, use it for comparison
    if (scheduleDate) {
      // If viewing yesterday's schedule, all blocks are in the past
      if (scheduleDate < today) {
        return true;
      }
      
      // If viewing tomorrow's schedule, no blocks are in the past yet
      if (scheduleDate > today) {
        return false;
      }
    }
    
    // For today's schedule, compare times normally
    return currentTime > block.endTime;
  };

  const isPast = isPastTime();
  
  const cardClasses = `
    relative border-l-4 ${getPriorityColor(block.priority)} 
    ${isCurrentTime ? 'bg-blue-50 border-blue-300' : 
      isPast && block.status === 'upcoming' ? 'bg-orange-50 border-orange-200' : 
      'bg-white border-gray-200'} 
    border rounded-lg p-4 transition-all duration-200
    ${isCurrentTime ? 'ring-2 ring-blue-300 shadow-lg' : 'hover:shadow-md'}
    ${isActive ? 'ring-2 ring-green-300 shadow-lg bg-green-50' : ''}
    ${block.status === 'completed' ? 'opacity-75' : ''}
    ${isPast && block.status === 'upcoming' ? 'opacity-80' : ''}
  `;

  return (
    <div className={cardClasses}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCategoryEmoji(block.categoryName)}</span>
          <div>
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              {block.categoryName}
              {getTypeIcon(block.type)}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{formatTimeRange(block.startTime, block.endTime)}</span>
              <span>•</span>
              <span>{block.duration}h</span>
              {block.pomodoros && (
                <>
                  <span>•</span>
                  <span>🍅 {block.pomodoros}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
          
          {/* Menu Button */}
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      onEdit(block.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(block.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {block.description && (
        <p className="text-sm text-gray-600 mb-3">{block.description}</p>
      )}

      {/* Timer Display (if active) */}
      {isActive && timerSeconds > 0 && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Active Timer</span>
            <span className="font-mono text-lg text-green-800">{formatTime(timerSeconds)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {block.status !== 'completed' && (
            <>
              <button
                onClick={() => onStartTimer(block)}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition ${
                  isCurrentTime 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white font-medium' 
                    : isPast 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                disabled={isActive}
              >
                <Play className="w-3 h-3" />
                {isCurrentTime ? 'Start Now' : isPast ? 'Start Late' : 'Start'}
              </button>
              
              <button
                onClick={() => onStartPomodoroTimer(block)}
                className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs transition"
                disabled={isActive}
              >
                🍅
              </button>
              
              <button
                onClick={() => onComplete(block.id)}
                className="flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm transition"
              >
                <CheckCircle className="w-3 h-3" />
                Complete
              </button>
            </>
          )}
          
          {block.status === 'completed' && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Session completed</span>
            </div>
          )}
        </div>
        
        {/* Priority Badge */}
        <div className={`text-xs px-2 py-1 rounded-full ${
          block.priority === 'high' ? 'bg-red-100 text-red-700' :
          block.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {block.priority}
        </div>
      </div>

      {/* Time Warning (if past due) */}
      {isPast && block.status === 'upcoming' && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-700">This time slot has passed - You can still complete it</span>
        </div>
      )}
      
      {/* Current Time Indicator */}
      {isCurrentTime && (
        <>
          <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-500 rounded-full"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse">
            <div className="absolute inset-1 w-2 h-2 bg-white rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
}