import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;
    
    await database.deleteCategory(categoryId);
    
    return NextResponse.json({ success: true, deleted: true, categoryId });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ 
      error: 'Failed to delete category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}