import { NextRequest, NextResponse } from 'next/server';
import { getConfigFromRequest, getNotionHeaders } from '@/lib/serverConfig';

export async function POST(request: NextRequest) {
  try {
    console.log('Sessions POST endpoint called');
    
    // Check if config exists
    const config = getConfigFromRequest(request);
    if (!config) {
      console.log('No config found in request headers');
      return NextResponse.json({ error: 'Notion credentials not configured' }, { status: 400 });
    }

    console.log('Config found, parsing request body...');
    const session = await request.json();
    console.log('Session data:', session);

    // Build basic properties
    const properties: any = {
      'Session Name': {
        title: [{ text: { content: session.sessionName || 'Study Session' } }]
      },
      'Duration': {
        number: parseFloat((session.duration || 0).toFixed(2))
      },
      'Date': {
        date: { start: session.date || new Date().toISOString().split('T')[0] }
      },
      'Is Pomodoro': {
        checkbox: session.isPomodoro || false
      }
    };

    // Conditionally add category relation
    if (session.categoryPageId) {
      properties['Category'] = {
        relation: [{ id: session.categoryPageId }]
      };
    }

    // Conditionally add notes
    if (session.notes) {
      properties['Notes'] = {
        rich_text: [{ text: { content: session.notes } }]
      };
    }

    console.log('Making request to Notion API...');
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: getNotionHeaders(config.apiKey),
      body: JSON.stringify({
        parent: { database_id: config.sessionsDbId },
        properties
      })
    });

    console.log('Notion API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Session created successfully:', data.id);
    
    return NextResponse.json({ sessionId: data.id });
  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json({ 
      error: 'Failed to log session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}