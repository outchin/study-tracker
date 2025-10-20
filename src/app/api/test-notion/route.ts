import { NextRequest, NextResponse } from 'next/server';
import { getConfigFromRequest, getNotionHeaders } from '@/lib/serverConfig';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Notion connection...');
    
    const config = getConfigFromRequest(request);
    if (!config) {
      return NextResponse.json({ 
        error: 'Notion credentials not configured',
        details: 'Please configure your Notion API key and database IDs'
      }, { status: 500 });
    }

    console.log('Configuration status:', {
      hasApiKey: !!config.apiKey,
      apiKeyPrefix: config.apiKey?.substring(0, 10),
      categoriesDbId: config.categoriesDbId,
      sessionsDbId: config.sessionsDbId
    });

    // Test API key by fetching database info
    const response = await fetch(`https://api.notion.com/v1/databases/${config.categoriesDbId}`, {
      method: 'GET',
      headers: getNotionHeaders(config.apiKey),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API test failed:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Notion API test failed',
        status: response.status,
        details: errorText
      }, { status: 500 });
    }

    const dbInfo = await response.json();
    
    return NextResponse.json({ 
      success: true,
      message: 'Notion connection successful',
      database: {
        title: dbInfo.title?.[0]?.plain_text || 'Unknown',
        id: dbInfo.id,
        propertiesCount: Object.keys(dbInfo.properties || {}).length
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}