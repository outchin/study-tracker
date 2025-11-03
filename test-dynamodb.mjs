import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

const CATEGORIES_TABLE = process.env.DYNAMODB_CATEGORIES_TABLE || 'study-tracker-categories';
const SESSIONS_TABLE = process.env.DYNAMODB_SESSIONS_TABLE || 'study-tracker-sessions';

async function testDynamoDB() {
  console.log('🔍 Testing DynamoDB connection...');
  console.log(`Region: ${process.env.AWS_REGION}`);
  console.log(`Categories Table: ${CATEGORIES_TABLE}`);
  console.log(`Sessions Table: ${SESSIONS_TABLE}\n`);

  try {
    // Test scanning categories
    console.log('📋 Scanning categories table...');
    const categoriesResult = await docClient.send(new ScanCommand({
      TableName: CATEGORIES_TABLE
    }));
    
    console.log(`Found ${categoriesResult.Items?.length || 0} categories:`);
    if (categoriesResult.Items && categoriesResult.Items.length > 0) {
      categoriesResult.Items.forEach(item => {
        console.log(`- ${item.name} (${item.categoryId})`);
      });
    } else {
      console.log('No categories found. Creating sample data...\n');
      
      // Create sample categories
      const sampleCategories = [
        {
          categoryId: uuidv4(),
          name: 'Japanese',
          hourlyRateUSD: 60,
          hourlyRateMMK: 252000,
          totalTarget: 1200,
          monthlyTarget: 112,
          dailyTarget: 5.5,
          totalStudied: 0,
          monthStudied: 0,
          todayStudied: 0,
          earnedUSD: 0,
          earnedMMK: 0,
          canWithdraw: false,
          pomodoroCount: 0,
          emoji: '🇯🇵',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          categoryId: uuidv4(),
          name: 'Cloud DevOps',
          hourlyRateUSD: 45,
          hourlyRateMMK: 189000,
          totalTarget: 700,
          monthlyTarget: 84,
          dailyTarget: 3,
          totalStudied: 0,
          monthStudied: 0,
          todayStudied: 0,
          earnedUSD: 0,
          earnedMMK: 0,
          canWithdraw: false,
          pomodoroCount: 0,
          emoji: '☁️',
          priority: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          categoryId: uuidv4(),
          name: 'English',
          hourlyRateUSD: 25,
          hourlyRateMMK: 105000,
          totalTarget: 400,
          monthlyTarget: 70,
          dailyTarget: 2,
          totalStudied: 0,
          monthStudied: 0,
          todayStudied: 0,
          earnedUSD: 0,
          earnedMMK: 0,
          canWithdraw: false,
          pomodoroCount: 0,
          emoji: '🇬🇧',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      console.log('📝 Creating sample categories...');
      for (const category of sampleCategories) {
        await docClient.send(new PutCommand({
          TableName: CATEGORIES_TABLE,
          Item: category
        }));
        console.log(`✅ Created: ${category.name}`);
      }
    }

    // Test scanning sessions
    console.log('\n📊 Scanning sessions table...');
    const sessionsResult = await docClient.send(new ScanCommand({
      TableName: SESSIONS_TABLE
    }));
    
    console.log(`Found ${sessionsResult.Items?.length || 0} sessions.`);

    console.log('\n🎉 DynamoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ DynamoDB test failed:', error.message);
    
    if (error.message.includes('ResourceNotFoundException')) {
      console.log('\n💡 Tables not found. Please run: npm run setup-dynamodb');
    } else if (error.message.includes('UnrecognizedClientException')) {
      console.log('\n💡 Invalid AWS credentials. Please check your .env.local file.');
    } else if (error.message.includes('security token')) {
      console.log('\n💡 AWS credentials expired or invalid. Please update your .env.local file.');
    }
  }
}

testDynamoDB().catch(console.error);