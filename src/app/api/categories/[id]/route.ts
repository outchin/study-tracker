import { NextRequest, NextResponse } from 'next/server';
import { getConfigFromRequest, getNotionHeaders } from '@/lib/serverConfig';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('PATCH request received for page ID:', resolvedParams.id);
    
    const config = getConfigFromRequest(request);
    if (!config) {
      return NextResponse.json({ error: 'Notion credentials not configured' }, { status: 500 });
    }

    const category = await request.json();
    const pageId = resolvedParams.id;
    
    console.log('Category data received:', category);

    // Only include properties that exist in the database
    const properties: any = {
      'Name': {
        title: [{ text: { content: category.name } }]
      },
      'Total Target': {
        number: category.totalTarget
      },
      'Monthly Target': {
        number: category.monthlyTarget
      },
      'Daily Target': {
        number: category.dailyTarget
      },
      'Total Studied': {
        number: parseFloat(category.totalStudied?.toFixed(2) || '0')
      },
      'Month Studied': {
        number: parseFloat(category.monthStudied?.toFixed(2) || '0')
      },
      'Today Studied': {
        number: parseFloat(category.todayStudied?.toFixed(2) || '0')
      },
      'Can Withdraw': {
        checkbox: category.canWithdraw || false
      },
      'Pomodoro Count': {
        number: category.pomodoroCount || 0
      }
    };

    // Only add optional properties if they might exist
    if (category.hourlyRateUSD || category.hourlyRate) {
      properties['Hourly Rate'] = {
        number: category.hourlyRateUSD || category.hourlyRate || 25
      };
    }

    if (category.earnedUSD || category.earned) {
      properties['Earned'] = {
        number: category.earnedUSD || category.earned || 0
      };
    }

    console.log('Properties to update:', properties);

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: getNotionHeaders(config.apiKey),
      body: JSON.stringify({ properties })
    });

    console.log('Notion response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error response:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Update successful:', data.id);
    return NextResponse.json({ success: true, pageId: data.id });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ 
      error: 'Failed to update category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}