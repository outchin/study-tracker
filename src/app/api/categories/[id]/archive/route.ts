import { NextRequest, NextResponse } from 'next/server';
import { getConfigFromRequest, getNotionHeaders } from '@/lib/serverConfig';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const pageId = resolvedParams.id;
    
    const config = getConfigFromRequest(request);
    if (!config) {
      return NextResponse.json({ error: 'Notion credentials not configured' }, { status: 500 });
    }

    // Archive the page by setting archived property
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: getNotionHeaders(config.apiKey),
      body: JSON.stringify({ 
        archived: true 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion archive error:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, archived: true, pageId: data.id });
  } catch (error) {
    console.error('Error archiving category:', error);
    return NextResponse.json({ 
      error: 'Failed to archive category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}