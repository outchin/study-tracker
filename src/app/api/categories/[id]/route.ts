import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('PATCH request received for category ID:', resolvedParams.id);
    
    const category = await request.json();
    const categoryId = resolvedParams.id;
    
    console.log('Category data received:', category);

    const updates: any = {};
    
    if (category.name !== undefined) updates.name = category.name;
    if (category.hourlyRateUSD !== undefined || category.hourlyRate !== undefined) {
      updates.hourlyRateUSD = category.hourlyRateUSD || category.hourlyRate || 0;
    }
    if (category.hourlyRateMMK !== undefined) updates.hourlyRateMMK = category.hourlyRateMMK;
    if (category.totalTarget !== undefined) updates.totalTarget = category.totalTarget;
    if (category.monthlyTarget !== undefined) updates.monthlyTarget = category.monthlyTarget;
    if (category.dailyTarget !== undefined) updates.dailyTarget = category.dailyTarget;
    if (category.totalStudied !== undefined) updates.totalStudied = category.totalStudied;
    if (category.monthStudied !== undefined) updates.monthStudied = category.monthStudied;
    if (category.todayStudied !== undefined) updates.todayStudied = category.todayStudied;
    if (category.earnedUSD !== undefined || category.earned !== undefined) {
      updates.earnedUSD = category.earnedUSD || category.earned || 0;
    }
    if (category.earnedMMK !== undefined) updates.earnedMMK = category.earnedMMK;
    if (category.canWithdraw !== undefined) updates.canWithdraw = category.canWithdraw;
    if (category.pomodoroCount !== undefined) updates.pomodoroCount = category.pomodoroCount;
    if (category.emoji !== undefined) updates.emoji = category.emoji;
    if (category.priority !== undefined) updates.priority = category.priority;

    console.log('Updates to apply:', updates);

    await database.updateCategory(categoryId, updates);
    console.log('Update successful:', categoryId);
    
    return NextResponse.json({ success: true, categoryId });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ 
      error: 'Failed to update category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;
    
    console.log('DELETE request received for category ID:', categoryId);
    
    await database.deleteCategory(categoryId);
    console.log('Category deleted successfully:', categoryId);
    
    return NextResponse.json({ success: true, categoryId });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ 
      error: 'Failed to delete category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}