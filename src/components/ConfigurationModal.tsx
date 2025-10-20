'use client';

import { useState, useEffect } from 'react';
import { ConfigManager } from '@/lib/config';
import { NotionConfig } from '@/types/config';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ConfigurationModal({ isOpen, onClose, onSave }: ConfigurationModalProps) {
  const [config, setConfig] = useState<NotionConfig>({
    apiKey: '',
    categoriesDbId: '',
    sessionsDbId: ''
  });

  const configManager = ConfigManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      const existingConfig = configManager.getNotionConfig();
      if (existingConfig) {
        setConfig(existingConfig);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    configManager.updateNotionConfig(config);
    onSave();
    onClose();
  };

  const handleInputChange = (field: keyof NotionConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Notion Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notion API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ntn_..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories Database ID
            </label>
            <input
              type="text"
              value={config.categoriesDbId}
              onChange={(e) => handleInputChange('categoriesDbId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="73e2f9a1-670d-4f45-acd8-ba4c35db9901"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sessions Database ID
            </label>
            <input
              type="text"
              value={config.sessionsDbId}
              onChange={(e) => handleInputChange('sessionsDbId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="a37dc1e1-cd7b-41b8-9d3b-07740fb5f1db"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}