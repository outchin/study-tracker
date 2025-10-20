import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug endpoint called');
    
    const headers = {
      authorization: request.headers.get('authorization'),
      categoriesDbId: request.headers.get('x-categories-db-id'),
      sessionsDbId: request.headers.get('x-sessions-db-id'),
    };
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      headers,
      url: request.url,
      method: request.method
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      status: 'ok',
      receivedBody: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug POST error:', error);
    return NextResponse.json({
      error: 'Debug POST failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}