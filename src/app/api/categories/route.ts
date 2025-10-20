import { NextRequest, NextResponse } from 'next/server';
import { getConfigFromRequest, getNotionHeaders } from '@/lib/serverConfig';

export async function GET(request: NextRequest) {
  try {
    const config = getConfigFromRequest(request);
    if (!config) {
      return NextResponse.json({ error: 'Notion credentials not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${config.categoriesDbId}/query`, {
      method: 'POST',
      headers: getNotionHeaders(config.apiKey),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    
    const categories = data.results.map((page: any) => ({
      notionPageId: page.id,
      name: page.properties.Name?.title?.[0]?.text?.content || '',
      hourlyRateUSD: page.properties['Hourly Rate USD']?.number || page.properties['Hourly Rate']?.number || 0,
      hourlyRateMMK: page.properties['Hourly Rate MMK']?.number || 0,
      totalTarget: page.properties['Total Target']?.number || 0,
      monthlyTarget: page.properties['Monthly Target']?.number || 0,
      dailyTarget: page.properties['Daily Target']?.number || 0,
      totalStudied: page.properties['Total Studied']?.number || 0,
      monthStudied: page.properties['Month Studied']?.number || 0,
      todayStudied: page.properties['Today Studied']?.number || 0,
      earnedUSD: page.properties['Earned USD']?.number || page.properties.Earned?.number || 0,
      earnedMMK: page.properties['Earned MMK']?.number || 0,
      canWithdraw: page.properties['Can Withdraw']?.checkbox || false,
      pomodoroCount: page.properties['Pomodoro Count']?.number || 0,
      emoji: page.properties.Emoji?.rich_text?.[0]?.text?.content || '📚',
      priority: page.properties.Priority?.select?.name || 'medium'
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = getConfigFromRequest(request);
    if (!config) {
      return NextResponse.json({ error: 'Notion credentials not configured' }, { status: 500 });
    }

    const category = await request.json();
    console.log('Received category:', category);

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
        number: category.hourlyRateUSD || category.hourlyRate || 0
      };
    }

    if (category.earnedUSD || category.earned) {
      properties['Earned'] = {
        number: category.earnedUSD || category.earned || 0
      };
    }

    console.log('Sending to Notion:', {
      url: 'https://api.notion.com/v1/pages',
      parent: { database_id: config.categoriesDbId },
      properties
    });

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: getNotionHeaders(config.apiKey),
      body: JSON.stringify({
        parent: { database_id: config.categoriesDbId },
        properties
      })
    });

    console.log('Notion response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error response:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Notion success response:', data);
    return NextResponse.json({ notionPageId: data.id });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ 
      error: 'Failed to create category', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}