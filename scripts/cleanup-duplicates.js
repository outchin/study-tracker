#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

// Configure AWS DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const dynamodb = DynamoDBDocumentClient.from(client);

async function cleanupDuplicateCategories() {
  try {
    console.log('🔍 Scanning for duplicate categories...');
    
    // Get all categories
    const result = await dynamodb.send(new ScanCommand({
      TableName: process.env.DYNAMODB_CATEGORIES_TABLE
    }));
    
    const categories = result.Items;
    console.log(`📊 Found ${categories.length} total categories`);
    
    // Group by name to find duplicates
    const categoryGroups = {};
    categories.forEach(cat => {
      if (!categoryGroups[cat.name]) {
        categoryGroups[cat.name] = [];
      }
      categoryGroups[cat.name].push(cat);
    });
    
    // Find duplicates
    const duplicates = Object.entries(categoryGroups).filter(([name, cats]) => cats.length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    console.log(`🚨 Found ${duplicates.length} duplicate category names:`);
    
    for (const [categoryName, duplicateCats] of duplicates) {
      console.log(`\n📂 Category: "${categoryName}" (${duplicateCats.length} duplicates)`);
      
      // Show all duplicates with their data
      duplicateCats.forEach((cat, index) => {
        console.log(`  ${index + 1}. ID: ${cat.categoryId}`);
        console.log(`     Today: ${cat.todayStudied}h, Total: ${cat.totalStudied}h`);
        console.log(`     Earned: $${cat.earnedUSD}`);
        console.log(`     Created: ${cat.createdAt || 'Unknown'}`);
      });
      
      // Keep the one with the most study time or most recent data
      const keepCategory = duplicateCats.reduce((best, current) => {
        // Prefer the one with more study time
        if (current.totalStudied > best.totalStudied) return current;
        if (current.totalStudied < best.totalStudied) return best;
        
        // If same study time, prefer the one with today's study time
        if (current.todayStudied > best.todayStudied) return current;
        if (current.todayStudied < best.todayStudied) return best;
        
        // If still same, prefer the more recent one
        if (current.createdAt && best.createdAt) {
          return new Date(current.createdAt) > new Date(best.createdAt) ? current : best;
        }
        
        return best;
      });
      
      console.log(`\n✅ Keeping: ${keepCategory.categoryId} (${keepCategory.todayStudied}h today, $${keepCategory.earnedUSD} earned)`);
      
      // Delete the others
      const toDelete = duplicateCats.filter(cat => cat.categoryId !== keepCategory.categoryId);
      
      for (const categoryToDelete of toDelete) {
        console.log(`🗑️  Deleting: ${categoryToDelete.categoryId}`);
        
        await dynamodb.send(new DeleteCommand({
          TableName: process.env.DYNAMODB_CATEGORIES_TABLE,
          Key: {
            categoryId: categoryToDelete.categoryId
          }
        }));
        
        console.log(`   ✅ Deleted successfully`);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicateCategories().then(() => {
  console.log('✨ Script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});