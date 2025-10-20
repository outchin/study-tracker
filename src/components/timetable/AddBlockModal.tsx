'use client';

import React, { useState } from 'react';
import { X, Clock, Target, AlertTriangle } from 'lucide-react';
import { ScheduleBlock } from '../../types/schedule';
import { createScheduleBlock, detectTimeConflicts } from '../../lib/scheduleHelpers';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (block: ScheduleBlock) => void;
  existingBlocks: ScheduleBlock[];
  categories: any[];
}

export default function AddBlockModal({
  isOpen,
  onClose,
  onAdd,
  existingBlocks,
  categories
}: AddBlockModalProps) {
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    categoryName: categories[0]?.name || 'Japanese',
    type: 'study' as ScheduleBlock['type'],
    priority: 'medium' as ScheduleBlock['priority'],
    description: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // Time validation
    if (formData.startTime >= formData.endTime) {
      newErrors.push('End time must be after start time');
    }
    
    // Category validation
    if (!formData.categoryName) {
      newErrors.push('Please select a category');
    }
    
    // Check for time conflicts
    const tempBlock = createScheduleBlock(
      formData.startTime,
      formData.endTime,
      formData.categoryName,
      formData.type,
      formData.priority,
      formData.description
    );
    
    const conflicts = detectTimeConflicts(existingBlocks, tempBlock);
    if (conflicts.length > 0) {
      newErrors.push(`Time conflict with: ${conflicts.map(b => b.categoryName).join(', ')}`);
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const newBlock = createScheduleBlock(
      formData.startTime,
      formData.endTime,
      formData.categoryName,
      formData.type,
      formData.priority,
      formData.description
    );
    
    onAdd(newBlock);
    onClose();
    
    // Reset form
    setFormData({
      startTime: '09:00',
      endTime: '10:00',
      categoryName: categories[0]?.name || 'Japanese',
      type: 'study',
      priority: 'medium',
      description: ''
    });
    setErrors([]);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-adjust end time if start time changes
      if (field === 'startTime') {
        const startHour = parseInt(value.split(':')[0]);
        const startMin = parseInt(value.split(':')[1]);
        const endHour = startHour + 1; // Default to 1 hour duration
        updated.endTime = `${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      }
      
      return updated;
    });
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

  const calculateDuration = (): number => {
    const start = new Date(`2024-01-01T${formData.startTime}:00`);
    const end = new Date(`2024-01-01T${formData.endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-light text-gray-800">Add Study Block</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              Duration: {calculateDuration().toFixed(1)} hours
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
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {getCategoryEmoji(category.name)} {category.name}
                </option>
              ))}
            </select>
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
                  className={`px-3 py-2 rounded-lg text-sm capitalize transition ${
                    formData.type === type
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
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
            <h3 className="font-medium text-gray-800">Description (Optional)</h3>
            
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

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Preview</h4>
            <div className="flex items-center gap-3">
              <span className="text-lg">{getCategoryEmoji(formData.categoryName)}</span>
              <div>
                <p className="font-medium text-gray-800">{formData.categoryName}</p>
                <p className="text-sm text-gray-600">
                  {formData.startTime} - {formData.endTime} • {calculateDuration().toFixed(1)}h
                </p>
                {formData.description && (
                  <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                )}
              </div>
            </div>
          </div>

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
              Add Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}