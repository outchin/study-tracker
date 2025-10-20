'use client';

import React, { useState } from 'react';
import { Plus, RefreshCw, Copy, Download, Upload, Lightbulb } from 'lucide-react';
import { DailySchedule, ScheduleBlock } from '../../types/schedule';
import { 
  getCurrentTime, 
  isTimeBetween, 
  calculateProgress, 
  calculateTimeProgress 
} from '../../lib/scheduleHelpers';
import { resetToDefault, copyFromDate } from '../../lib/scheduleStorage';
import ScheduleBlockCard from './ScheduleBlockCard';
import AddBlockModal from './AddBlockModal';
import EditBlockModal from './EditBlockModal';

interface ScheduleBlocksListProps {
  schedule: DailySchedule;
  selectedDay: 'yesterday' | 'today' | 'tomorrow';
  activeTimer: number | null;
  timerSeconds: number;
  categories: any[];
  onStartTimer: (block: ScheduleBlock) => void;
  onStartPomodoroTimer: (block: ScheduleBlock) => void;
  onComplete: (blockId: string) => void;
  onEdit: (blockId: string, updates: Partial<ScheduleBlock>) => void;
  onDelete: (blockId: string) => void;
  onAdd: (block: ScheduleBlock) => void;
  onBulkAdd?: (blocks: ScheduleBlock[]) => void;
  onReplaceAll?: (blocks: ScheduleBlock[]) => void;
  onUpdateDayTheme?: (dayTheme: string) => void;
}

export default function ScheduleBlocksList({
  schedule,
  selectedDay,
  activeTimer,
  timerSeconds,
  categories,
  onStartTimer,
  onStartPomodoroTimer,
  onComplete,
  onEdit,
  onDelete,
  onAdd,
  onBulkAdd,
  onReplaceAll,
  onUpdateDayTheme
}: ScheduleBlocksListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [editingDayTheme, setEditingDayTheme] = useState(false);
  const [dayThemeInput, setDayThemeInput] = useState(schedule.dayTheme || '');

  // Update dayThemeInput when schedule.dayTheme changes
  React.useEffect(() => {
    setDayThemeInput(schedule.dayTheme || '');
  }, [schedule.dayTheme]);

  const getCurrentTimeBlock = (): string | null => {
    if (selectedDay !== 'today') return null;
    
    const currentTime = getCurrentTime();
    const block = schedule.blocks.find(block => 
      isTimeBetween(currentTime, block.startTime, block.endTime)
    );
    return block?.id || null;
  };

  const getActiveTimerBlock = (): string | null => {
    if (!activeTimer) return null;
    
    const category = categories.find(cat => cat.id === activeTimer);
    if (!category) return null;
    
    const block = schedule.blocks.find(block => 
      block.categoryName === category.name && block.status === 'in-progress'
    );
    return block?.id || null;
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset this day to default schedule? This will remove all customizations.')) {
      const resetSchedule = resetToDefault(schedule.date);
      // Trigger parent update by calling onEdit with the entire new schedule
      resetSchedule.blocks.forEach((block, index) => {
        if (index === 0) {
          // Use first block to trigger a full reload
          window.location.reload();
        }
      });
    }
  };

  const handleCopyFromYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    
    if (window.confirm('Copy schedule from yesterday? This will replace the current schedule.')) {
      const copiedSchedule = copyFromDate(yesterdayDate, schedule.date);
      // Trigger parent update
      window.location.reload();
    }
  };

  const progress = calculateProgress(schedule.blocks);
  const timeProgress = calculateTimeProgress(schedule.blocks);
  const currentTimeBlockId = getCurrentTimeBlock();
  const activeTimerBlockId = getActiveTimerBlock();

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Block Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {progress.completed}/{progress.total}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Time Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${timeProgress.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {timeProgress.completed.toFixed(1)}h/{timeProgress.total.toFixed(1)}h
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Day Theme</p>
            <div className="flex items-center gap-2">
              {editingDayTheme ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={dayThemeInput}
                    onChange={(e) => setDayThemeInput(e.target.value)}
                    placeholder="e.g., Japanese Marathon"
                    className="flex-1 text-sm border border-purple-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onUpdateDayTheme?.(dayThemeInput);
                        setEditingDayTheme(false);
                      } else if (e.key === 'Escape') {
                        setDayThemeInput(schedule.dayTheme || '');
                        setEditingDayTheme(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      onUpdateDayTheme?.(dayThemeInput);
                      setEditingDayTheme(false);
                    }}
                    className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setDayThemeInput(schedule.dayTheme || '');
                      setEditingDayTheme(false);
                    }}
                    className="text-xs bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  {schedule.dayTheme ? (
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                      🎯 {schedule.dayTheme}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 italic">No theme set</span>
                  )}
                  <button
                    onClick={() => setEditingDayTheme(true)}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    {schedule.dayTheme ? 'Edit' : 'Add Theme'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
          
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Bulk Actions
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition text-sm"
            onClick={() => {
              const prompt = `Optimize my ${schedule.day} schedule based on:

Current Schedule:
${schedule.blocks.map(block => 
  `${block.startTime}-${block.endTime}: ${block.categoryName} (${block.duration}h) - ${block.description || 'No description'}`
).join('\n')}

Goals:
- Japanese: 4 hrs (priority HIGH)
- DevOps: 3 hrs  
- English: 2.5 hrs
- Thesis: 1.7 hrs

Constraints:
- Morning person (best focus 6am-12pm)
- Energy drops after 8pm
- Need 1hr lunch break
- Prefer 2hr max per subject session

Considerations:
- Spacing effect (distribute similar subjects)
- Energy management (hard tasks early)
- Break frequency (Pomodoro 25/5)

Please suggest an optimized schedule in JSON format that I can paste directly into my app.`;
              
              navigator.clipboard.writeText(prompt);
              alert('AI prompt copied to clipboard! Paste this to Claude and copy the result back.');
            }}
          >
            <Lightbulb className="w-4 h-4" />
            Get AI Suggestions
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-4">Bulk Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Default
            </button>
            
            <button
              onClick={handleCopyFromYesterday}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy from Yesterday
            </button>
            
            <button
              onClick={() => {
                const jsonData = JSON.stringify(schedule, null, 2);
                navigator.clipboard.writeText(jsonData);
                alert('Schedule exported to clipboard!');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  const importedData = JSON.parse(text);
                  
                  // Check if it's a full schedule object or just blocks array
                  let blocksToImport: ScheduleBlock[] = [];
                  let dayThemeToImport: string | undefined = undefined;
                  
                  if (importedData.blocks && Array.isArray(importedData.blocks)) {
                    blocksToImport = importedData.blocks;
                    dayThemeToImport = importedData.dayTheme;
                  } else if (Array.isArray(importedData)) {
                    blocksToImport = importedData;
                  } else {
                    alert('Invalid schedule format in clipboard');
                    return;
                  }
                  
                  if (blocksToImport.length === 0) {
                    alert('No blocks found to import');
                    return;
                  }
                  
                  // Clear existing blocks first if user confirms
                  const themeText = dayThemeToImport ? ` with theme "${dayThemeToImport}"` : '';
                  const shouldReplace = window.confirm(
                    `Import ${blocksToImport.length} blocks${themeText}? This will replace the current schedule.`
                  );
                  
                  if (shouldReplace) {
                    // Generate new IDs for all blocks to avoid conflicts
                    const blocksWithNewIds = blocksToImport.map((block: ScheduleBlock, index: number) => ({
                      ...block,
                      id: `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
                      status: 'upcoming' as const
                    }));
                    
                    // Use bulk replace function if available, otherwise fall back to individual operations
                    if (onReplaceAll) {
                      onReplaceAll(blocksWithNewIds);
                      
                      // Update day theme after blocks are replaced
                      setTimeout(() => {
                        if (dayThemeToImport && onUpdateDayTheme) {
                          console.log('Importing day theme:', dayThemeToImport);
                          onUpdateDayTheme(dayThemeToImport);
                        } else {
                          console.log('No day theme to import or onUpdateDayTheme not available', {
                            dayThemeToImport,
                            hasOnUpdateDayTheme: !!onUpdateDayTheme
                          });
                        }
                        
                        const successMessage = dayThemeToImport 
                          ? `Schedule imported successfully with theme "${dayThemeToImport}"!`
                          : 'Schedule imported successfully!';
                        alert(successMessage);
                      }, 200);
                    } else {
                      // Fallback: Clear current blocks first then add new ones
                      schedule.blocks.forEach(block => onDelete(block.id));
                      
                      setTimeout(() => {
                        blocksWithNewIds.forEach((block, index) => {
                          setTimeout(() => {
                            onAdd(block);
                          }, index * 50); // Reduced stagger time
                        });
                        
                        setTimeout(() => {
                          if (dayThemeToImport && onUpdateDayTheme) {
                            console.log('Importing day theme (fallback):', dayThemeToImport);
                            onUpdateDayTheme(dayThemeToImport);
                          }
                          
                          const successMessage = dayThemeToImport 
                            ? `Schedule imported successfully with theme "${dayThemeToImport}"!`
                            : 'Schedule imported successfully!';
                          alert(successMessage);
                        }, blocksWithNewIds.length * 50 + 300);
                      }, 200);
                    }
                  }
                } catch (error) {
                  alert('Failed to import: ' + (error as Error).message);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm"
            >
              <Upload className="w-4 h-4" />
              Import JSON
            </button>
          </div>
        </div>
      )}

      {/* Schedule Blocks */}
      <div className="space-y-4">
        {schedule.blocks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Plus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No blocks scheduled</h3>
            <p className="text-gray-500 mb-4">Add your first study block to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Block
            </button>
          </div>
        ) : (
          schedule.blocks
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((block) => (
              <ScheduleBlockCard
                key={block.id}
                block={block}
                isActive={block.id === activeTimerBlockId}
                isCurrentTime={block.id === currentTimeBlockId}
                timerSeconds={block.id === activeTimerBlockId ? timerSeconds : 0}
                scheduleDate={schedule.date}
                onStartTimer={onStartTimer}
                onStartPomodoroTimer={onStartPomodoroTimer}
                onComplete={onComplete}
                onEdit={(blockId) => {
                  const blockToEdit = schedule.blocks.find(b => b.id === blockId);
                  if (blockToEdit) {
                    setEditingBlock(blockToEdit);
                    setShowEditModal(true);
                  }
                }}
                onDelete={onDelete}
                canEdit={selectedDay === 'today' || selectedDay === 'tomorrow'}
              />
            ))
        )}
      </div>

      {/* Quick Add Suggestions */}
      {schedule.blocks.length > 0 && schedule.blocks.length < 8 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Quick Add Suggestions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Japanese', 'Cloud DevOps', 'English', 'Master Thesis'].map((category) => {
              const hasCategory = schedule.blocks.some(block => block.categoryName === category);
              if (hasCategory) return null;
              
              return (
                <button
                  key={category}
                  onClick={() => {
                    // Auto-suggest time slot
                    const lastBlock = schedule.blocks
                      .sort((a, b) => a.endTime.localeCompare(b.endTime))
                      .pop();
                    
                    const startTime = lastBlock ? lastBlock.endTime : '09:00';
                    
                    // Calculate end time based on start time
                    const [startHour, startMin] = startTime.split(':').map(Number);
                    const endHour = startHour + 1;
                    const endTime = `${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
                    
                    onAdd({
                      id: `quick-${Date.now()}-${category.replace(/\s+/g, '').toLowerCase()}-${Math.random().toString(36).substr(2, 6)}`,
                      startTime,
                      endTime,
                      categoryName: category,
                      duration: 1,
                      type: 'study',
                      priority: 'medium',
                      description: `${category} study session`,
                      status: 'upcoming'
                    });
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                >
                  + {category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      <AddBlockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAdd}
        existingBlocks={schedule.blocks}
        categories={categories}
      />

      {/* Edit Block Modal */}
      <EditBlockModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBlock(null);
        }}
        onSave={(blockId, updates) => {
          onEdit(blockId, updates);
          setShowEditModal(false);
          setEditingBlock(null);
        }}
        onDelete={(blockId) => {
          onDelete(blockId);
          setShowEditModal(false);
          setEditingBlock(null);
        }}
        block={editingBlock}
        existingBlocks={schedule.blocks}
        categories={categories}
      />
    </div>
  );
}