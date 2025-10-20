'use client';

import React, { useState } from 'react';
import { X, Clock, Calendar, Plus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface AddPastSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (session: {
    categoryId: number;
    startTime: string;
    endTime: string;
    date: string;
    description?: string;
    type: 'study' | 'exercise' | 'break' | 'other';
  }) => void;
  categories: Category[];
}

export default function AddPastSessionModal({
  isOpen,
  onClose,
  onAdd,
  categories
}: AddPastSessionModalProps) {
  const [formData, setFormData] = useState<{
    categoryId: number;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    type: 'study' | 'exercise' | 'break' | 'other';
  }>({
    categoryId: categories[0]?.id || 1,
    date: new Date().toISOString().split('T')[0], // Today
    startTime: '18:00', // Default 6 PM
    endTime: '19:00',   // Default 7 PM
    description: '',
    type: 'study'
  });
  
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // Time validation
    if (formData.startTime >= formData.endTime) {
      newErrors.push('End time must be after start time');
    }
    
    // Date validation - can't be in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
      newErrors.push('Cannot add sessions for future dates');
    }
    
    // Can't be too far in the past (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (selectedDate < thirtyDaysAgo) {
      newErrors.push('Cannot add sessions older than 30 days');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateDuration = (): number => {
    const start = new Date(`${formData.date}T${formData.startTime}:00`);
    const end = new Date(`${formData.date}T${formData.endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onAdd({
      categoryId: formData.categoryId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      date: formData.date,
      description: formData.description,
      type: formData.type
    });
    
    onClose();
    
    // Reset form
    setFormData({
      categoryId: categories[0]?.id || 1,
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:00',
      description: '',
      type: 'study'
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
        
        if (endHour < 24) {
          updated.endTime = `${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        }
      }
      
      return updated;
    });
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.categoryId) || categories[0];
  };

  const getTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-light text-gray-800">Add Past Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </h3>
            
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Range
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Start Time</label>
                <select
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {getTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">End Time</label>
                <select
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {getTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              Duration: {calculateDuration().toFixed(1)} hours
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Category</h3>
            
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Activity Type</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {(['study', 'exercise', 'break', 'other'] as const).map(type => (
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
                  {type === 'study' && '📚'} 
                  {type === 'exercise' && '💪'} 
                  {type === 'break' && '☕'} 
                  {type === 'other' && '📝'} {type}
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
              placeholder="What did you work on?"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">{error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Session Preview</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {formData.startTime} - {formData.endTime}</p>
              <p><strong>Duration:</strong> {calculateDuration().toFixed(1)} hours</p>
              <p><strong>Category:</strong> {getSelectedCategory()?.emoji} {getSelectedCategory()?.name}</p>
              <p><strong>Type:</strong> {formData.type}</p>
              {formData.description && <p><strong>Description:</strong> {formData.description}</p>}
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
              Add Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}