import { config } from 'dotenv';
config({ path: '.env.local' });

// This script sets up the browser localStorage to use DynamoDB provider
const configData = {
  databaseProvider: 'dynamodb',
  notion: {
    apiKey: '',
    categoriesDbId: '',
    sessionsDbId: ''
  },
  dynamodb: {
    region: process.env.AWS_REGION || 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    categoriesTable: process.env.DYNAMODB_CATEGORIES_TABLE || 'study-tracker-categories',
    sessionsTable: process.env.DYNAMODB_SESSIONS_TABLE || 'study-tracker-sessions'
  }
};

console.log('📋 DynamoDB Configuration:');
console.log(`Region: ${configData.dynamodb.region}`);
console.log(`Categories Table: ${configData.dynamodb.categoriesTable}`);
console.log(`Sessions Table: ${configData.dynamodb.sessionsTable}`);
console.log(`Access Key ID: ${configData.dynamodb.accessKeyId ? '✅ Set' : '❌ Missing'}`);
console.log(`Secret Access Key: ${configData.dynamodb.secretAccessKey ? '✅ Set' : '❌ Missing'}`);

console.log('\n📝 Configuration JSON for browser localStorage:');
console.log('Key: study-tracker-config');
console.log('Value:', JSON.stringify(configData, null, 2));

console.log('\n💡 To configure the app:');
console.log('1. Open http://localhost:3002 in your browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Run this command:');
console.log(`localStorage.setItem('study-tracker-config', '${JSON.stringify(configData).replace(/'/g, "\\'")}');`);
console.log('5. Refresh the page');