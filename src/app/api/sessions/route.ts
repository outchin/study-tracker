import { NextRequest, NextResponse } from 'next/server';
import { getConfigFromRequest, getNotionHeaders } from '@/lib/serverConfig';

export async function POST(request: NextRequest) {
  try {
    const config = getConfigFromRequest(request);
    if (!config) {
      return NextResponse.json({ error: 'Notion credentials not configured' }, { status: 500 });
    }

    const session = await request.json();

    const properties = {
      'Session Name': {
        title: [{ text: { content: session.sessionName } }]
      },
      'Duration': {
        number: parseFloat(session.duration.toFixed(2))
      },
      'Date': {
        date: { start: session.date }
      },
      'Is Pomodoro': {
        checkbox: session.isPomodoro
      }
    };

    // Add category relation if categoryPageId is provided
    if (session.categoryPageId) {
      (properties as any)['Category'] = {
        relation: [{ id: session.categoryPageId }]
      };
    }

    // Add notes if provided
    if (session.notes) {
      (properties as any)['Notes'] = {
        rich_text: [{ text: { content: session.notes } }]
      };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: getNotionHeaders(config.apiKey),
      body: JSON.stringify({
        parent: { database_id: config.sessionsDbId },
        properties
      })
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ sessionId: data.id });
  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json({ error: 'Failed to log session' }, { status: 500 });
  }
}