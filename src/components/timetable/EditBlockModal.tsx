'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Target, AlertTriangle, Trash2 } from 'lucide-react';
import { ScheduleBlock } from '../../types/schedule';
import { detectTimeConflicts, calculateDuration } from '../../lib/scheduleHelpers';

interface EditBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockId: string, updates: Partial<ScheduleBlock>) => void;
  onDelete: (blockId: string) => void;
  block: ScheduleBlock | null;
  existingBlocks: ScheduleBlock[];
  categories: any[];
}

export default function EditBlockModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  block,
  existingBlocks,
  categories
}: EditBlockModalProps) {
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    categoryName: 'Japanese',
    type: 'study' as ScheduleBlock['type'],
    priority: 'medium' as ScheduleBlock['priority'],
    description: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data when block changes
  useEffect(() => {
    if (block) {
      setFormData({
        startTime: block.startTime,
        endTime: block.endTime,
        categoryName: block.categoryName,
        type: block.type,
        priority: block.priority,
        description: block.description || ''
      });
    }
  }, [block]);

  if (!isOpen || !block) return null;

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Category validation
    if (!formData.categoryName) {
      newErrors.push('Please select a category');
    }

    // Note: We now support overnight schedules (e.g., 23:00 - 02:00)
    // Duration validation is handled by calculateDuration() which adds 24h for overnight blocks

    // Check for time conflicts (exclude current block)
    const otherBlocks = existingBlocks.filter(b => b.id !== block.id);
    const tempBlock = {
      ...block,
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: calculateDuration(formData.startTime, formData.endTime)
    };

    const conflicts = detectTimeConflicts(otherBlocks, tempBlock);
    if (conflicts.length > 0) {
      newErrors.push(`Time conflict with: ${conflicts.map(b => b.categoryName).join(', ')}`);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const updates: Partial<ScheduleBlock> = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      categoryName: formData.categoryName,
      type: formData.type,
      priority: formData.priority,
      description: formData.description,
      duration: calculateDuration(formData.startTime, formData.endTime)
    };
    
    onSave(block.id, updates);
    onClose();
    setErrors([]);
  };

  const handleDelete = () => {
    onDelete(block.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const getCurrentDuration = (): number => {
    return calculateDuration(formData.startTime, formData.endTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-light text-gray-800">Edit Study Block</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
              title="Delete block"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">Delete Study Block?</h3>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently remove "{block.categoryName}" from your schedule.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Current Status</h4>
            <div className="flex items-center justify-between">
              <span className={`text-sm px-2 py-1 rounded ${
                block.status === 'completed' ? 'bg-green-100 text-green-700' :
                block.status === 'in-progress' ? 'bg-red-100 text-red-700' :
                block.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {block.status ? block.status.charAt(0).toUpperCase() + block.status.slice(1) : 'Unknown'}
              </span>
              {block.status === 'completed' && (
                <span className="text-sm text-gray-600">Session completed ✓</span>
              )}
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={block.status === 'completed'}
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={block.status === 'completed'}
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              Duration: {getCurrentDuration().toFixed(1)} hours
              {block.duration !== getCurrentDuration() && (
                <span className="text-blue-600 ml-2">
                  (was {block.duration.toFixed(1)}h)
                </span>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Category
            </h3>
            
            <select
              value={formData.categoryName}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={block.status === 'in-progress'}
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {getCategoryEmoji(category.name)} {category.name}
                </option>
              ))}
            </select>
            
            {block.status === 'in-progress' && (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
                Category cannot be changed while timer is active
              </p>
            )}
          </div>

          {/* Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Type</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {(['study', 'break', 'activity'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  disabled={block.status === 'completed'}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition ${
                    formData.type === type
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  } ${block.status === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Priority</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority }))}
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition ${
                    formData.priority === priority
                      ? priority === 'high' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                      : 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Description</h3>
            
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what you'll study..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Changes Summary */}
          {(formData.startTime !== block.startTime || 
            formData.endTime !== block.endTime ||
            formData.categoryName !== block.categoryName ||
            formData.type !== block.type ||
            formData.priority !== block.priority ||
            formData.description !== (block.description || '')) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Changes</h4>
              <div className="space-y-1 text-sm text-blue-700">
                {formData.startTime !== block.startTime && (
                  <p>• Start time: {block.startTime} → {formData.startTime}</p>
                )}
                {formData.endTime !== block.endTime && (
                  <p>• End time: {block.endTime} → {formData.endTime}</p>
                )}
                {formData.categoryName !== block.categoryName && (
                  <p>• Category: {block.categoryName} → {formData.categoryName}</p>
                )}
                {formData.type !== block.type && (
                  <p>• Type: {block.type} → {formData.type}</p>
                )}
                {formData.priority !== block.priority && (
                  <p>• Priority: {block.priority} → {formData.priority}</p>
                )}
                {formData.description !== (block.description || '') && (
                  <p>• Description updated</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}