'use client';

import { useState, useEffect } from 'react';
import { ConfigManager } from '@/lib/config';
import { NotionConfig, DynamoDBConfig, DatabaseProvider } from '@/types/config';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ConfigurationModal({ isOpen, onClose, onSave }: ConfigurationModalProps) {
  const [databaseProvider, setDatabaseProvider] = useState<DatabaseProvider>('notion');
  const [notionConfig, setNotionConfig] = useState<NotionConfig>({
    apiKey: '',
    categoriesDbId: '',
    sessionsDbId: ''
  });
  const [dynamodbConfig, setDynamodbConfig] = useState<DynamoDBConfig>({
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',
    categoriesTable: 'study-tracker-categories',
    sessionsTable: 'study-tracker-sessions'
  });

  const configManager = ConfigManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      const provider = configManager.getDatabaseProvider();
      setDatabaseProvider(provider);
      
      const existingNotionConfig = configManager.getNotionConfig();
      if (existingNotionConfig) {
        setNotionConfig(existingNotionConfig);
      }
      
      const existingDynamoConfig = configManager.getDynamoDBConfig();
      if (existingDynamoConfig) {
        setDynamodbConfig(existingDynamoConfig);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    configManager.setDatabaseProvider(databaseProvider);
    
    if (databaseProvider === 'notion') {
      configManager.updateNotionConfig(notionConfig);
    } else {
      configManager.updateDynamoDBConfig(dynamodbConfig);
    }
    
    onSave();
    onClose();
  };

  const handleNotionInputChange = (field: keyof NotionConfig, value: string) => {
    setNotionConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDynamoInputChange = (field: keyof DynamoDBConfig, value: string) => {
    setDynamodbConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-bold mb-4">Database Configuration</h2>
        
        <div className="space-y-6">
          {/* Database Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Database Provider
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="notion"
                  checked={databaseProvider === 'notion'}
                  onChange={(e) => setDatabaseProvider(e.target.value as DatabaseProvider)}
                  className="mr-2"
                />
                Notion
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="dynamodb"
                  checked={databaseProvider === 'dynamodb'}
                  onChange={(e) => setDatabaseProvider(e.target.value as DatabaseProvider)}
                  className="mr-2"
                />
                DynamoDB
              </label>
            </div>
          </div>

          {/* Notion Configuration */}
          {databaseProvider === 'notion' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800">Notion Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notion API Key
                </label>
                <input
                  type="password"
                  value={notionConfig.apiKey}
                  onChange={(e) => handleNotionInputChange('apiKey', e.target.value)}
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
                  value={notionConfig.categoriesDbId}
                  onChange={(e) => handleNotionInputChange('categoriesDbId', e.target.value)}
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
                  value={notionConfig.sessionsDbId}
                  onChange={(e) => handleNotionInputChange('sessionsDbId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="a37dc1e1-cd7b-41b8-9d3b-07740fb5f1db"
                />
              </div>
            </div>
          )}

          {/* DynamoDB Configuration */}
          {databaseProvider === 'dynamodb' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800">DynamoDB Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AWS Region
                  </label>
                  <input
                    type="text"
                    value={dynamodbConfig.region}
                    onChange={(e) => handleDynamoInputChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="us-east-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories Table
                  </label>
                  <input
                    type="text"
                    value={dynamodbConfig.categoriesTable}
                    onChange={(e) => handleDynamoInputChange('categoriesTable', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="study-tracker-categories"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sessions Table
                </label>
                <input
                  type="text"
                  value={dynamodbConfig.sessionsTable}
                  onChange={(e) => handleDynamoInputChange('sessionsTable', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="study-tracker-sessions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Access Key ID
                </label>
                <input
                  type="password"
                  value={dynamodbConfig.accessKeyId}
                  onChange={(e) => handleDynamoInputChange('accessKeyId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AKIA..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  value={dynamodbConfig.secretAccessKey}
                  onChange={(e) => handleDynamoInputChange('secretAccessKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="***"
                />
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <p className="font-medium mb-1">💡 Environment Variables Option:</p>
                <p>You can also set these in your .env.local file instead of entering them here.</p>
              </div>
            </div>
          )}
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
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}