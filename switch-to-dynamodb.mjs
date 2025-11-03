// Simple script to switch database provider to DynamoDB
console.log('🔄 Switching database provider to DynamoDB...');

const response = await fetch('http://localhost:3000/api/debug', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'set_provider',
    provider: 'dynamodb'
  })
});

if (response.ok) {
  console.log('✅ Successfully switched to DynamoDB');
  
  // Test the categories endpoint
  const categoriesResponse = await fetch('http://localhost:3000/api/categories');
  const categories = await categoriesResponse.json();
  
  console.log(`📊 Now showing ${categories.length} categories from DynamoDB:`);
  categories.forEach((cat, index) => {
    console.log(`  ${index + 1}. ${cat.name} (Today: ${cat.todayStudied}h)`);
  });
} else {
  console.error('❌ Failed to switch provider');
}