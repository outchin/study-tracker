import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Sessions POST endpoint called');
    
    const session = await request.json();
    console.log('Session data:', session);

    const sessionData = {
      categoryId: session.categoryId || session.categoryPageId || '',
      sessionName: session.sessionName || 'Study Session',
      duration: parseFloat((session.duration || 0).toFixed(2)),
      date: session.date || new Date().toISOString().split('T')[0],
      isPomodoro: session.isPomodoro || false,
      notes: session.notes
    };

    console.log('Creating session in database...');
    const sessionId = await database.createSession(sessionData);
    console.log('Session created successfully:', sessionId);
    
    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json({ 
      error: 'Failed to log session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const date = searchParams.get('date');

    let sessions;
    if (categoryId) {
      sessions = await database.getSessionsByCategory(categoryId);
    } else if (date) {
      sessions = await database.getSessionsByDate(date);
    } else {
      sessions = await database.getAllSessions();
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}