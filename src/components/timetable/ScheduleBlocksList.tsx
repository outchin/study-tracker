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
  onReplaceAll?: (blocks: ScheduleBlock[], theme?: string) => void;
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
                  console.log('Clipboard text:', text);
                  const importedData = JSON.parse(text);
                  console.log('Parsed data:', importedData);

                  // Check if it's a full schedule object or just blocks array
                  let blocksToImport: ScheduleBlock[] = [];
                  let dayThemeToImport: string | undefined = undefined;

                  if (importedData.blocks && Array.isArray(importedData.blocks)) {
                    blocksToImport = importedData.blocks;
                    dayThemeToImport = importedData.dayTheme;
                  } else if (Array.isArray(importedData)) {
                    blocksToImport = importedData;
                  } else {
                    alert('Invalid schedule format in clipboard. Expected array of blocks or object with blocks property.');
                    return;
                  }

                  // Check if importing for a different date
                  const currentDate = schedule.date;
                  const importDate = importedData.date;
                  const today = new Date().toISOString().split('T')[0];
                  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                  console.log('Date check:', { importDate, currentDate, today, tomorrow, yesterday, selectedDay });

                  if (importDate && importDate !== currentDate) {
                    let targetDay = selectedDay;
                    if (importDate === today) targetDay = 'today';
                    else if (importDate === tomorrow) targetDay = 'tomorrow';
                    else if (importDate === yesterday) targetDay = 'yesterday';

                    if (targetDay !== selectedDay) {
                      alert(`Import data is for ${importDate}. Please switch to the "${targetDay}" tab first, then try importing again.`);
                      return;
                    }
                  }

                  if (blocksToImport.length === 0) {
                    alert('No blocks found to import');
                    return;
                  }

                  // Category name mapping for common variations
                  const categoryMapping: Record<string, string> = {
                    'Cloud DevOps (Job-Ready)': 'Cloud DevOps',
                    'English (IELTS 7.0+)': 'English',
                    'Japanese (N5→N4→N3)': 'Japanese',
                    'House Chores': 'Master Thesis', // Map to closest available or create new
                    'Japanese': 'Japanese',
                    'Cloud DevOps': 'Cloud DevOps',
                    'English': 'English',
                    'Master Thesis': 'Master Thesis'
                  };

                  // Validate and fix each block
                  const validatedBlocks: ScheduleBlock[] = [];
                  const errors: string[] = [];

                  blocksToImport.forEach((block: any, index: number) => {
                    const blockErrors: string[] = [];

                    // Check required fields
                    if (!block.startTime) blockErrors.push('startTime');
                    if (!block.endTime) blockErrors.push('endTime');
                    if (!block.categoryName) blockErrors.push('categoryName');

                    // Validate time format (HH:MM)
                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (block.startTime && !timeRegex.test(block.startTime)) {
                      blockErrors.push('startTime format (expected HH:MM)');
                    }
                    if (block.endTime && !timeRegex.test(block.endTime)) {
                      blockErrors.push('endTime format (expected HH:MM)');
                    }

                    if (blockErrors.length > 0) {
                      errors.push(`Block ${index + 1}: Missing/invalid ${blockErrors.join(', ')}`);
                      return;
                    }

                    // Calculate duration if not provided
                    let duration = block.duration;
                    if (!duration && block.startTime && block.endTime) {
                      const [startH, startM] = block.startTime.split(':').map(Number);
                      const [endH, endM] = block.endTime.split(':').map(Number);
                      const startMinutes = startH * 60 + startM;
                      let endMinutes = endH * 60 + endM;

                      // Handle overnight schedules (e.g., 23:00 - 02:00)
                      if (endMinutes < startMinutes) {
                        endMinutes += 24 * 60; // Add 24 hours
                      }

                      duration = (endMinutes - startMinutes) / 60;
                    }

                    // Map category name to system category
                    const mappedCategoryName = categoryMapping[block.categoryName] || block.categoryName;

                    // Create validated block with defaults
                    const validatedBlock: ScheduleBlock = {
                      id: block.id || `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
                      startTime: block.startTime,
                      endTime: block.endTime,
                      categoryName: mappedCategoryName,
                      duration: duration || 1,
                      type: block.type || 'study',
                      priority: block.priority || 'medium',
                      description: block.description || `${mappedCategoryName} session`,
                      pomodoros: block.pomodoros,
                      status: 'upcoming'
                    };

                    validatedBlocks.push(validatedBlock);
                  });

                  if (errors.length > 0) {
                    alert(`Import failed:\n${errors.join('\n')}\n\nRequired fields: startTime (HH:MM), endTime (HH:MM), categoryName`);
                    return;
                  }

                  // Clear existing blocks first if user confirms
                  const themeText = dayThemeToImport ? ` with theme "${dayThemeToImport}"` : '';
                  const shouldReplace = window.confirm(
                    `Import ${validatedBlocks.length} blocks${themeText}? This will replace the current schedule.`
                  );

                  if (shouldReplace) {
                    // Use the already validated blocks
                    const blocksWithNewIds = validatedBlocks;
                    console.log('Replacing with blocks:', blocksWithNewIds);

                    // Use bulk replace function if available, otherwise fall back to individual operations
                    if (onReplaceAll) {
                      console.log('Using onReplaceAll function');

                      try {
                        // Pass both blocks and theme in a single call to prevent racing
                        console.log('Calling onReplaceAll with blocks and theme:', {
                          blocksCount: blocksWithNewIds.length,
                          theme: dayThemeToImport
                        });
                        onReplaceAll(blocksWithNewIds, dayThemeToImport);
                        console.log('onReplaceAll completed with theme:', dayThemeToImport);

                        // Wait a bit for state to update, then check localStorage
                        setTimeout(() => {
                          console.log('Checking import results...');
                          
                          const currentDate = schedule.date;
                          const savedData = localStorage.getItem(`schedule-${currentDate}`);
                          console.log(`Final check - localStorage for date: ${currentDate}`);
                          console.log('Final saved data in localStorage:', savedData);

                          // Check all localStorage keys for debugging
                          console.log('All schedule keys in localStorage:');
                          Object.keys(localStorage).filter(key => key.startsWith('schedule-')).forEach(key => {
                            console.log(`${key}:`, localStorage.getItem(key));
                          });

                          if (savedData) {
                            const parsedData = JSON.parse(savedData);
                            console.log('Final parsed saved data:', parsedData);
                            console.log('Final number of blocks saved:', parsedData.blocks ? parsedData.blocks.length : 'No blocks found');

                            if (parsedData.blocks && parsedData.blocks.length === blocksWithNewIds.length) {
                              console.log('Import completed successfully');
                              alert('Schedule imported successfully! Blocks and theme saved.');

                              // Re-enable auto refresh after fix
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            } else {
                              console.error('Import failed: Block count mismatch', {
                                expected: blocksWithNewIds.length,
                                actual: parsedData.blocks?.length || 0
                              });
                              alert('Import failed: Data not saved correctly. Check console for details.');
                            }
                          } else {
                            console.error('Import failed: No data found in localStorage');
                            alert('Import failed: No data saved to localStorage. Check console for details.');
                          }
                        }, 800);

                      } catch (error) {
                        console.error('Error in onReplaceAll:', error);
                        alert('Import failed during block replacement. Check console for details.');
                      }
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

                          console.log('Import completed successfully (fallback method)');
                          alert(successMessage);

                          // Enable auto refresh after successful import
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        }, blocksWithNewIds.length * 50 + 300);
                      }, 200);
                    }
                  }
                } catch (error) {
                  console.error('Import error:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  alert('Failed to import: ' + errorMessage + '\n\nCheck console for details.');
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