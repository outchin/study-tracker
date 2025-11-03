const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand, 
  waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const CATEGORIES_TABLE = process.env.DYNAMODB_CATEGORIES_TABLE || 'study-tracker-categories';
const SESSIONS_TABLE = process.env.DYNAMODB_SESSIONS_TABLE || 'study-tracker-sessions';

async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createCategoriesTable() {
  console.log(`Creating categories table: ${CATEGORIES_TABLE}...`);
  
  const params = {
    TableName: CATEGORIES_TABLE,
    KeySchema: [
      {
        AttributeName: 'categoryId',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'categoryId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST' // On-demand billing
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('Categories table creation initiated...');
    
    // Wait for table to be created
    await waitUntilTableExists(
      { client, maxWaitTime: 300 }, // 5 minutes max wait
      { TableName: CATEGORIES_TABLE }
    );
    
    console.log(`✅ Categories table ${CATEGORIES_TABLE} created successfully!`);
  } catch (error) {
    console.error('❌ Error creating categories table:', error);
    throw error;
  }
}

async function createSessionsTable() {
  console.log(`Creating sessions table: ${SESSIONS_TABLE}...`);
  
  const params = {
    TableName: SESSIONS_TABLE,
    KeySchema: [
      {
        AttributeName: 'sessionId',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'sessionId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'categoryId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'date',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'categoryId-date-index',
        KeySchema: [
          {
            AttributeName: 'categoryId',
            KeyType: 'HASH' // Partition key for GSI
          },
          {
            AttributeName: 'date',
            KeyType: 'RANGE' // Sort key for GSI
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST' // On-demand billing
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('Sessions table creation initiated...');
    
    // Wait for table to be created
    await waitUntilTableExists(
      { client, maxWaitTime: 300 }, // 5 minutes max wait
      { TableName: SESSIONS_TABLE }
    );
    
    console.log(`✅ Sessions table ${SESSIONS_TABLE} created successfully!`);
  } catch (error) {
    console.error('❌ Error creating sessions table:', error);
    throw error;
  }
}

async function setupDynamoDB() {
  console.log('🚀 Setting up DynamoDB tables...\n');
  
  // Check credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not found in .env.local file');
    console.log('Please ensure the following environment variables are set:');
    console.log('- AWS_ACCESS_KEY_ID');
    console.log('- AWS_SECRET_ACCESS_KEY');
    console.log('- AWS_REGION (optional, defaults to us-east-1)');
    process.exit(1);
  }

  console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`Categories Table: ${CATEGORIES_TABLE}`);
  console.log(`Sessions Table: ${SESSIONS_TABLE}\n`);

  try {
    // Check and create categories table
    if (await tableExists(CATEGORIES_TABLE)) {
      console.log(`⚠️  Categories table ${CATEGORIES_TABLE} already exists, skipping...`);
    } else {
      await createCategoriesTable();
    }

    // Check and create sessions table
    if (await tableExists(SESSIONS_TABLE)) {
      console.log(`⚠️  Sessions table ${SESSIONS_TABLE} already exists, skipping...`);
    } else {
      await createSessionsTable();
    }

    console.log('\n🎉 DynamoDB setup completed successfully!');
    console.log('\nTables created:');
    console.log(`✅ ${CATEGORIES_TABLE} - for storing study categories`);
    console.log(`✅ ${SESSIONS_TABLE} - for storing study sessions`);
    console.log('\nYour application is now ready to use DynamoDB!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDynamoDB().catch(console.error);