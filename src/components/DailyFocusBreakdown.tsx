'use client';

import React from 'react';
import { Clock, Target, TrendingUp, Award } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  todayStudied: number;
  dailyTarget: number;
  emoji: string;
  priority: 'high' | 'medium' | 'low';
  hourlyRateUSD: number;
  hourlyRateMMK: number;
}

interface DailyFocusBreakdownProps {
  categories: Category[];
  showCurrency: 'USD' | 'MMK';
}

export default function DailyFocusBreakdown({ categories, showCurrency }: DailyFocusBreakdownProps) {
  // Filter categories that have been studied today
  const studiedToday = categories.filter(cat => cat.todayStudied > 0);
  
  // Calculate total time studied today
  const totalTimeToday = categories.reduce((sum, cat) => sum + cat.todayStudied, 0);
  
  // Calculate today's earnings
  const todayEarnings = categories.reduce((sum, cat) => {
    const earnings = showCurrency === 'USD' 
      ? cat.todayStudied * cat.hourlyRateUSD
      : cat.todayStudied * cat.hourlyRateMMK;
    return sum + earnings;
  }, 0);

  const formatTime = (hours: number): string => {
    if (hours >= 1) {
      const wholeHours = Math.floor(hours);
      const remainingMinutes = Math.round((hours - wholeHours) * 60);
      if (remainingMinutes === 0) {
        return `${wholeHours}h`;
      }
      return `${wholeHours}h ${remainingMinutes}m`;
    } else {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
  };

  const formatCurrency = (amount: number): string => {
    if (showCurrency === 'USD') {
      return `$${amount.toFixed(0)}`;
    } else {
      return `${(amount / 1000000).toFixed(1)}M MMK`;
    }
  };

  const getProgressColor = (studied: number, target: number): string => {
    const percentage = (studied / target) * 100;
    if (percentage >= 100) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (studiedToday.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Today's Focus</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No study sessions completed today</p>
          <p className="text-sm">Start a timer to track your focus time!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Today's Focus</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatTime(totalTimeToday)}</p>
          <p className="text-sm text-gray-500">Total focused time</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(todayEarnings)}
            </span>
          </div>
          <p className="text-xs text-gray-600">Earned Today</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-semibold text-blue-600">
              {studiedToday.length}
            </span>
          </div>
          <p className="text-xs text-gray-600">Subjects Studied</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Breakdown by Subject</h4>
        
        {studiedToday
          .sort((a, b) => b.todayStudied - a.todayStudied) // Sort by time studied (highest first)
          .map(category => {
            const percentage = category.dailyTarget > 0 
              ? Math.min((category.todayStudied / category.dailyTarget) * 100, 100)
              : 100;
            
            const earnings = showCurrency === 'USD' 
              ? category.todayStudied * category.hourlyRateUSD
              : category.todayStudied * category.hourlyRateMMK;

            return (
              <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{category.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatTime(category.todayStudied)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {category.dailyTarget > 0 
                          ? `${formatTime(category.todayStudied)} / ${formatTime(category.dailyTarget)}`
                          : 'No target set'
                        }
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getProgressColor(category.todayStudied, category.dailyTarget)}`}>
                        {category.dailyTarget > 0 ? `${percentage.toFixed(0)}%` : 'Complete'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(earnings)}
                  </p>
                  <p className="text-xs text-gray-500">earned</p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Show categories with targets but no study time */}
      {categories.filter(cat => cat.dailyTarget > 0 && cat.todayStudied === 0).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Still to focus on:</h4>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter(cat => cat.dailyTarget > 0 && cat.todayStudied === 0)
              .map(category => (
                <span 
                  key={category.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                  <span className="text-xs">({formatTime(category.dailyTarget)})</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}