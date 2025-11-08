import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;
    
    console.log('Hard deleting category:', categoryId);
    await database.deleteCategory(categoryId);
    console.log('Category hard deleted successfully:', categoryId);
    
    return NextResponse.json({ success: true, deleted: true, categoryId });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ 
      error: 'Failed to delete category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleDelete(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleDelete(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleDelete(request, { params });
}