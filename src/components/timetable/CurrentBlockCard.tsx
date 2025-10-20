'use client';

import React from 'react';
import { Play, Pause, CheckCircle, ArrowRight, Clock, Target } from 'lucide-react';
import { ScheduleBlock } from '../../types/schedule';
import { 
  formatTimeRange, 
  getRemainingTimeInBlock, 
  getTimeUntilBlock 
} from '../../lib/scheduleHelpers';

interface CurrentBlockCardProps {
  currentBlock: ScheduleBlock | null;
  nextBlock: ScheduleBlock | null;
  timerSeconds: number;
  activeTimer: number | null;
  isPaused: boolean;
  onStartTimer: (block: ScheduleBlock) => void;
  onStartPomodoroTimer: (block: ScheduleBlock) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onComplete: (blockId: string) => void;
}

export default function CurrentBlockCard({
  currentBlock,
  nextBlock,
  timerSeconds,
  activeTimer,
  isPaused,
  onStartTimer,
  onStartPomodoroTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onComplete
}: CurrentBlockCardProps) {
  
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

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // If no current or next block, show empty state
  if (!currentBlock && !nextBlock) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center">
        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-light text-gray-600 mb-2">No Active Schedule</h3>
        <p className="text-sm text-gray-500">Your schedule is clear for now. Take a break or start a custom session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Block */}
      {currentBlock && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 uppercase tracking-wide">
                NOW ACTIVE
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(currentBlock.priority)}`}>
                {currentBlock.priority}
              </span>
            </div>
            <div className="text-sm text-green-600">
              {formatTimeRange(currentBlock.startTime, currentBlock.endTime)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getCategoryEmoji(currentBlock.categoryName)}</span>
                <div>
                  <h3 className="text-xl font-light text-gray-800">{currentBlock.categoryName}</h3>
                  <p className="text-sm text-gray-600">{currentBlock.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{currentBlock.duration}h session</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{getRemainingTimeInBlock(currentBlock)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              {/* Timer Display */}
              {activeTimer && (
                <div className="text-right">
                  <div className="text-3xl font-mono tracking-tight text-gray-800">
                    {formatTime(timerSeconds)}
                  </div>
                  <div className="text-xs text-gray-500">Timer Running</div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {currentBlock.status !== 'completed' ? (
                  <>
                    <button
                      onClick={() => onStartTimer(currentBlock)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      disabled={activeTimer !== null}
                    >
                      <Play className="w-4 h-4" />
                      Continue
                    </button>
                    <button
                      onClick={() => onStartPomodoroTimer(currentBlock)}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-xs font-medium"
                      disabled={activeTimer !== null}
                    >
                      🍅 Pomodoro
                    </button>
                    <button
                      onClick={() => onComplete(currentBlock.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 bg-green-100 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Next Block */}
      {nextBlock && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    UP NEXT
                  </span>
                  <span className="text-xs text-gray-500">
                    starts {getTimeUntilBlock(nextBlock)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryEmoji(nextBlock.categoryName)}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{nextBlock.categoryName}</h4>
                    <p className="text-sm text-gray-600">{nextBlock.description}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                {formatTimeRange(nextBlock.startTime, nextBlock.endTime)}
              </div>
              <div className="text-xs text-gray-500">
                {nextBlock.duration}h session
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Only Next Block (no current) */}
      {!currentBlock && nextBlock && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">
                  NEXT SCHEDULED
                </span>
                <span className="text-xs text-blue-600">
                  in {getTimeUntilBlock(nextBlock)}
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{getCategoryEmoji(nextBlock.categoryName)}</span>
                <div>
                  <h3 className="text-xl font-light text-gray-800">{nextBlock.categoryName}</h3>
                  <p className="text-sm text-gray-600">{nextBlock.description}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {formatTimeRange(nextBlock.startTime, nextBlock.endTime)} • {nextBlock.duration}h session
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onStartTimer(nextBlock)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                disabled={activeTimer !== null}
              >
                <Play className="w-4 h-4" />
                Start Early
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}