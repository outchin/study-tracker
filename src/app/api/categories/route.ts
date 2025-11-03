import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const categories = await database.getAllCategories();
    
    const formattedCategories = categories.map(category => ({
      categoryId: category.id,
      name: category.name,
      hourlyRateUSD: category.hourlyRateUSD,
      hourlyRateMMK: category.hourlyRateMMK,
      totalTarget: category.totalTarget,
      monthlyTarget: category.monthlyTarget,
      dailyTarget: category.dailyTarget,
      totalStudied: category.totalStudied,
      monthStudied: category.monthStudied,
      todayStudied: category.todayStudied,
      earnedUSD: category.earnedUSD,
      earnedMMK: category.earnedMMK,
      canWithdraw: category.canWithdraw,
      pomodoroCount: category.pomodoroCount,
      emoji: category.emoji,
      priority: category.priority
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const category = await request.json();
    console.log('Received category:', category);

    const categoryData = {
      name: category.name,
      hourlyRateUSD: category.hourlyRateUSD || category.hourlyRate || 0,
      hourlyRateMMK: category.hourlyRateMMK || 0,
      totalTarget: category.totalTarget || 0,
      monthlyTarget: category.monthlyTarget || 0,
      dailyTarget: category.dailyTarget || 0,
      totalStudied: category.totalStudied || 0,
      monthStudied: category.monthStudied || 0,
      todayStudied: category.todayStudied || 0,
      earnedUSD: category.earnedUSD || category.earned || 0,
      earnedMMK: category.earnedMMK || 0,
      canWithdraw: category.canWithdraw || false,
      pomodoroCount: category.pomodoroCount || 0,
      emoji: category.emoji || '📚',
      priority: category.priority || 'medium'
    };

    const categoryId = await database.createCategory(categoryData);
    console.log('Category created successfully:', categoryId);
    
    return NextResponse.json({ categoryId });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ 
      error: 'Failed to create category', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}