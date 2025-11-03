import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test DynamoDB
console.log('🔍 Testing DynamoDB...');
try {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const dynamodb = DynamoDBDocumentClient.from(client);
  
  const result = await dynamodb.send(new ScanCommand({
    TableName: process.env.DYNAMODB_CATEGORIES_TABLE
  }));
  
  console.log(`📊 DynamoDB Categories: ${result.Items.length}`);
  result.Items.forEach((cat, index) => {
    console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.categoryId.substring(0, 8)}...)`);
  });
  
} catch (error) {
  console.error('❌ DynamoDB Error:', error.message);
}

console.log('\n🔍 Testing Notion...');
try {
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  const response = await notion.databases.query({
    database_id: process.env.NOTION_CATEGORIES_DATABASE_ID,
  });

  console.log(`📊 Notion Categories: ${response.results.length}`);
  response.results.forEach((page, index) => {
    const nameProperty = page.properties.Name || page.properties.name || page.properties['カテゴリ名'];
    const name = nameProperty?.title?.[0]?.plain_text || 'Unknown';
    console.log(`  ${index + 1}. ${name} (ID: ${page.id.substring(0, 8)}...)`);
  });

} catch (error) {
  console.error('❌ Notion Error:', error.message);
}

// Test what the actual API returns
console.log('\n🔍 Testing API endpoint...');
try {
  const response = await fetch('http://localhost:3000/api/categories');
  const apiData = await response.json();
  console.log(`📊 API Categories: ${apiData.length}`);
  apiData.forEach((cat, index) => {
    console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.categoryId.substring(0, 8)}...)`);
  });
} catch (error) {
  console.error('❌ API Error:', error.message);
}