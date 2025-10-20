'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Plus, X, Edit2, Trash2, Award, Coffee, CheckCircle, Loader2, Clock, Settings, Grid3X3, List } from 'lucide-react';
import TimetableView from '../components/timetable/TimetableView';
import AddPastSessionModal from '../components/AddPastSessionModal';
import ConfigurationModal from '../components/ConfigurationModal';
import DailyFocusBreakdown from '../components/DailyFocusBreakdown';
import { ConfigManager } from '../lib/config';
import { apiClient } from '../lib/apiClient';

interface Category {
  id: number;
  name: string;
  hourlyRateUSD: number;
  hourlyRateMMK: number;
  totalTarget: number;
  monthlyTarget: number;
  dailyTarget: number;
  totalStudied: number;
  monthStudied: number;
  todayStudied: number;
  isActive: boolean;
  currentSession: number;
  earnedUSD: number;
  earnedMMK: number;
  canWithdraw: boolean;
  pomodoroCount: number;
  notionPageId?: string;
  emoji: string;
  priority: 'high' | 'medium' | 'low';
}

interface StudySession {
  id: string;
  categoryId: number;
  duration: number;
  date: string;
  isPomodoro: boolean;
  notes?: string;
}

interface Achievement {
  title: string;
  desc: string;
}

export default function StudyTracker() {
  const [view, setView] = useState<string>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPomodoroMode, setIsPomodoroMode] = useState<boolean>(false);
  const [isBreakTime, setIsBreakTime] = useState<boolean>(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isNotionConfigured, setIsNotionConfigured] = useState<boolean>(false);
  const [currentDay, setCurrentDay] = useState<string>('');
  const [showCurrency, setShowCurrency] = useState<'USD' | 'MMK'>('USD');
  const [newCategory, setNewCategory] = useState({
    name: '',
    hourlyRateUSD: 25,
    hourlyRateMMK: 105000,
    totalTarget: 100,
    monthlyTarget: 10,
    dailyTarget: 1,
    emoji: '📚',
    priority: 'medium' as const
  });
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedSeconds, setPausedSeconds] = useState<number>(0);
  const [totalPausedTime, setTotalPausedTime] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPastSessionModal, setShowPastSessionModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const configManager = ConfigManager.getInstance();

  const POMODORO_WORK = 25 * 60;
  const POMODORO_BREAK = 5 * 60;

  const loadLocalData = () => {
    // Fallback to localStorage or default
    const savedCategories = localStorage.getItem('studyCategories');
    if (savedCategories) {
      const parsed = JSON.parse(savedCategories);
      // Fix old format by ensuring new fields exist
      const fixedCategories = parsed.map((cat: any) => ({
        ...cat,
        hourlyRateUSD: cat.hourlyRateUSD || cat.hourlyRate || 25,
        hourlyRateMMK: cat.hourlyRateMMK || (cat.hourlyRate || 25) * 4200,
        earnedUSD: cat.earnedUSD || (cat.totalStudied || 0) * (cat.hourlyRateUSD || cat.hourlyRate || 25),
        earnedMMK: cat.earnedMMK || (cat.totalStudied || 0) * (cat.hourlyRateMMK || (cat.hourlyRate || 25) * 4200),
        emoji: cat.emoji || '📚',
        priority: cat.priority || 'medium'
      }));
      setCategories(fixedCategories);
    } else {
      setCategories(getDefaultCategories());
    }
  };

  const loadDataFromNotion = async () => {
    try {
      if (!apiClient.isConfigured()) {
        console.log('API client not configured, using local data');
        loadLocalData();
        return;
      }
      
      const response = await apiClient.get('/api/categories');
      if (response.ok) {
        const notionCategories = await response.json();
        if (notionCategories.length > 0) {
          // Convert Notion data to local format
          const convertedCategories = notionCategories.map((cat: any, index: number) => ({
            id: index + 1, // Local ID for UI
            name: cat.name,
            hourlyRateUSD: cat.hourlyRateUSD || 25,
            hourlyRateMMK: cat.hourlyRateMMK || 105000,
            totalTarget: cat.totalTarget,
            monthlyTarget: cat.monthlyTarget,
            dailyTarget: cat.dailyTarget,
            totalStudied: cat.totalStudied,
            monthStudied: cat.monthStudied,
            todayStudied: cat.todayStudied,
            isActive: false,
            currentSession: 0,
            earnedUSD: cat.earnedUSD || 0,
            earnedMMK: cat.earnedMMK || 0,
            canWithdraw: cat.canWithdraw,
            pomodoroCount: cat.pomodoroCount,
            notionPageId: cat.notionPageId,
            emoji: cat.emoji || '📚',
            priority: cat.priority || 'medium' as const
          }));
          setCategories(convertedCategories);
          return;
        }
      }
    } catch (error) {
      console.log('Failed to load from Notion, using local data');
      loadLocalData();
    }
  };

  // Load data from Notion and localStorage on mount
  useEffect(() => {

    const savedAchievements = localStorage.getItem('studyAchievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }

    loadDataFromNotion();
  }, []);

  // Set current day and update daily targets
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setCurrentDay(today);
    
    // Update daily targets based on current day
    setCategories(prev => prev.map(cat => ({
      ...cat,
      dailyTarget: getDailyTarget(cat.name)
    })));
  }, []);

  const getDefaultCategories = (): Category[] => {
    return [
      {
        id: 1,
        name: 'Japanese',
        emoji: '🇯🇵',
        hourlyRateUSD: 60,
        hourlyRateMMK: 252000,
        totalTarget: 1200,
        monthlyTarget: 112,
        dailyTarget: 5.5, // Will be updated by getDailyTarget
        totalStudied: 0,
        monthStudied: 0,
        todayStudied: 0,
        isActive: false,
        currentSession: 0,
        earnedUSD: 0,
        earnedMMK: 0,
        canWithdraw: false,
        pomodoroCount: 0,
        priority: 'high'
      },
      {
        id: 2,
        name: 'Cloud DevOps',
        emoji: '☁️',
        hourlyRateUSD: 45,
        hourlyRateMMK: 189000,
        totalTarget: 700,
        monthlyTarget: 84,
        dailyTarget: 3, // Will be updated by getDailyTarget
        totalStudied: 0,
        monthStudied: 0,
        todayStudied: 0,
        isActive: false,
        currentSession: 0,
        earnedUSD: 0,
        earnedMMK: 0,
        canWithdraw: false,
        pomodoroCount: 0,
        priority: 'high'
      },
      {
        id: 3,
        name: 'English',
        emoji: '🇬🇧',
        hourlyRateUSD: 25,
        hourlyRateMMK: 105000,
        totalTarget: 400,
        monthlyTarget: 70,
        dailyTarget: 0, // Will be updated by getDailyTarget
        totalStudied: 0,
        monthStudied: 0,
        todayStudied: 0,
        isActive: false,
        currentSession: 0,
        earnedUSD: 0,
        earnedMMK: 0,
        canWithdraw: false,
        pomodoroCount: 0,
        priority: 'medium'
      },
      {
        id: 4,
        name: 'Master Thesis',
        emoji: '📝',
        hourlyRateUSD: 30,
        hourlyRateMMK: 126000,
        totalTarget: 450,
        monthlyTarget: 48,
        dailyTarget: 1, // Will be updated by getDailyTarget
        totalStudied: 0,
        monthStudied: 0,
        todayStudied: 0,
        isActive: false,
        currentSession: 0,
        earnedUSD: 0,
        earnedMMK: 0,
        canWithdraw: false,
        pomodoroCount: 0,
        priority: 'medium'
      }
    ];
  };

  const getDailyTarget = (subject: string): number => {
    const daySchedule: Record<string, Record<string, number>> = {
      'Monday': { 'Japanese': 5.5, 'DevOps': 3, 'English': 0, 'Thesis': 1 },
      'Tuesday': { 'Japanese': 1, 'DevOps': 5, 'English': 3, 'Thesis': 0 },
      'Wednesday': { 'Japanese': 5, 'DevOps': 1.5, 'English': 0, 'Thesis': 3 },
      'Thursday': { 'Japanese': 1.5, 'DevOps': 4, 'English': 4, 'Thesis': 0 },
      'Friday': { 'Japanese': 6, 'DevOps': 0, 'English': 1, 'Thesis': 2 },
      'Saturday': { 'Japanese': 2, 'DevOps': 5, 'English': 1, 'Thesis': 0 },
      'Sunday': { 'Japanese': 1.5, 'DevOps': 1.5, 'English': 1, 'Thesis': 3 }
    };
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = daySchedule[today] || daySchedule['Monday'];
    
    if (subject === 'Japanese') return schedule['Japanese'] || 0;
    if (subject.includes('DevOps')) return schedule['DevOps'] || 0;
    if (subject === 'English') return schedule['English'] || 0;
    if (subject.includes('Thesis')) return schedule['Thesis'] || 0;
    
    return 1;
  };

  // Save to localStorage whenever categories change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('studyCategories', JSON.stringify(categories));
    }
  }, [categories]);

  // Save achievements
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem('studyAchievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  // Check Notion configuration
  useEffect(() => {
    setIsNotionConfigured(configManager.isConfigured());
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('studySessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('studySessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Page Visibility API to handle background tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTimer && timerStartTime) {
        console.log('Tab became visible, syncing timer...');
        const currentTime = performance.now();
        const actualElapsed = Math.floor((currentTime - timerStartTime) / 1000);
        console.log(`Syncing timer: should be ${actualElapsed}s, was ${timerSeconds}s`);
        setTimerSeconds(actualElapsed);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTimer, timerStartTime, timerSeconds]);

  // Timer logic with accurate timing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let startTime: number;
    let lastUpdateTime: number;
    
    if (activeTimer) {
      console.log(`Timer effect started for category ${activeTimer}`);
      // Use stored start time if available (for page visibility sync)
      startTime = timerStartTime || performance.now();
      if (!timerStartTime) {
        setTimerStartTime(startTime);
      }
      lastUpdateTime = performance.now();
      
      // Use a more frequent interval to ensure accuracy
      interval = setInterval(() => {
        if (isPaused) {
          return; // Don't update anything when paused
        }
        
        const currentTime = performance.now();
        const elapsedMs = currentTime - startTime - totalPausedTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Update timer display
        setTimerSeconds(elapsedSeconds);

        // Calculate actual seconds passed since last update
        const timeSinceLastUpdate = (currentTime - lastUpdateTime) / 1000;
        lastUpdateTime = currentTime;

        if (isPomodoroMode) {
          setPomodoroSeconds(prev => {
            const newSeconds = Math.floor(elapsedMs / 1000) % (POMODORO_WORK + POMODORO_BREAK);
            const currentCycleSeconds = newSeconds <= POMODORO_WORK ? newSeconds : newSeconds - POMODORO_WORK;
            
            if (!isBreakTime && newSeconds >= POMODORO_WORK && newSeconds < POMODORO_WORK + POMODORO_BREAK) {
              if (!isBreakTime) { // Prevent multiple notifications
                setIsBreakTime(true);
                showNotification('Break Time!', 'Take a 5 minute break');
              }
              return currentCycleSeconds;
            } else if (isBreakTime && newSeconds >= POMODORO_WORK + POMODORO_BREAK) {
              if (isBreakTime) { // Prevent multiple notifications
                setIsBreakTime(false);
                showNotification('Break Over!', 'Ready for next session?');
                setCategories(prev => prev.map(cat =>
                    cat.id === activeTimer ? { ...cat, pomodoroCount: cat.pomodoroCount + 1 } : cat
                ));
              }
              return 0;
            }
            return currentCycleSeconds;
          });
        }

        // Update study time with actual elapsed time (only when not paused)
        if (!isBreakTime && timeSinceLastUpdate > 0 && !isPaused) {
          setCategories(prev => prev.map(cat => {
            if (cat.id === activeTimer) {
              const timeToAdd = timeSinceLastUpdate / 3600; // Convert to hours
              const newCurrentSession = cat.currentSession + timeToAdd;
              const newTodayStudied = cat.todayStudied + timeToAdd;
              
              // Log every 10 seconds for debugging
              if (Math.floor(newCurrentSession * 3600) % 10 === 0) {
                console.log(`Accurate timer update: ${newCurrentSession.toFixed(4)}h, today: ${newTodayStudied.toFixed(4)}h, elapsed: ${elapsedSeconds}s`);
              }
              
              return {
                ...cat,
                currentSession: newCurrentSession,
                todayStudied: newTodayStudied
              };
            }
            return cat;
          }));
        }
      }, 250); // Update every 250ms for better accuracy
    } else {
      console.log('Timer effect: no active timer');
    }
    
    return () => {
      if (interval) {
        console.log('Clearing accurate timer interval');
        clearInterval(interval);
      }
    };
  }, [activeTimer, isPomodoroMode, isBreakTime, isPaused, totalPausedTime]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHoursToMinutes = (hours: number): string => {
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

  const showNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const startTimer = (categoryId: number, pomodoro: boolean = false) => {
    console.log(`Starting timer for category ${categoryId}, pomodoro: ${pomodoro}`);
    
    // Stop any existing timer first
    if (activeTimer !== null) {
      console.log(`Stopping existing timer for category ${activeTimer}`);
      setActiveTimer(null);
    }
    
    requestNotificationPermission();
    setActiveTimer(categoryId);
    setIsPomodoroMode(pomodoro);
    setIsBreakTime(false);
    setPomodoroSeconds(0);
    setTimerSeconds(0);
    setTimerStartTime(performance.now()); // Set accurate start time
    setIsPaused(false);
    setPausedSeconds(0);
    setTotalPausedTime(0);
    
    setCategories(prev => prev.map(cat =>
        cat.id === categoryId ? { ...cat, isActive: true } : { ...cat, isActive: false }
    ));
    
    console.log(`Timer started for category ${categoryId}`);
  };

  const pauseTimer = () => {
    console.log('Pausing timer');
    if (!isPaused) {
      setIsPaused(true);
      setPausedSeconds(timerSeconds); // Store current timer value
      console.log(`Timer paused at ${timerSeconds} seconds`);
    }
  };

  const resumeTimer = () => {
    console.log('Resuming timer');
    if (isPaused && timerStartTime) {
      const pauseDuration = performance.now() - (timerStartTime + (pausedSeconds * 1000) + totalPausedTime);
      setTotalPausedTime(prev => prev + pauseDuration);
      setIsPaused(false);
      console.log(`Timer resumed, added ${Math.floor(pauseDuration/1000)}s to paused time`);
    }
  };

  const stopTimer = async (categoryId: number) => {
    console.log(`Stopping timer for category ${categoryId}`);
    
    const currentCategory = categories.find(c => c.id === categoryId);
    if (!currentCategory) {
      console.error(`Category ${categoryId} not found`);
      return;
    }

    const sessionDuration = currentCategory.currentSession;
    console.log(`Session duration: ${sessionDuration} hours`);
    
    if (sessionDuration <= 0) {
      // No session to save, just reset timer
      resetTimerStates();
      return;
    }

    // Start saving process
    setIsSaving(true);
    setSaveError(null);

    try {
      // First, try to save to Notion
      console.log('Saving session to Notion...');
      await logSessionToNotion(categoryId, sessionDuration, isPomodoroMode);
      
      // Update local data after successful session save
      console.log('Session saved successfully, updating local data...');
      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          const totalStudied = cat.totalStudied + cat.currentSession;
          const monthStudied = cat.monthStudied + cat.currentSession;
          const earnedUSD = totalStudied * cat.hourlyRateUSD;
          const earnedMMK = totalStudied * cat.hourlyRateMMK;
          const canWithdraw = monthStudied >= cat.monthlyTarget;

          console.log(`Updated category ${categoryId}: totalStudied=${totalStudied}, earnedUSD=${earnedUSD}`);

          return {
            ...cat,
            isActive: false,
            totalStudied,
            monthStudied,
            earnedUSD,
            earnedMMK,
            canWithdraw,
            currentSession: 0
          };
        }
        return { ...cat, isActive: false };
      }));

      resetTimerStates();
      console.log('Session saved and timer stopped successfully');
      
      // Try to sync category data in background (don't block on this)
      try {
        await syncCategoryToNotion(categoryId);
        console.log('Category synced successfully');
      } catch (syncError) {
        console.warn('Category sync failed, but session was saved:', syncError);
        // Don't throw this error - session save was successful
      }
      
    } catch (error) {
      console.error('Failed to save session:', error);
      setSaveError('Failed to save session to Notion. Your data is preserved.');
      
      // Keep the timer running and data intact
      // Don't reset anything, user can try again
      return;
    } finally {
      setIsSaving(false);
    }
  };

  const resetTimerStates = () => {
    setActiveTimer(null);
    setTimerSeconds(0);
    setPomodoroSeconds(0);
    setIsPomodoroMode(false);
    setIsBreakTime(false);
    setTimerStartTime(null);
    setIsPaused(false);
    setPausedSeconds(0);
    setTotalPausedTime(0);
  };

  const addCategory = async () => {
    if (!newCategory.name) return;
    
    const category: Category = {
      id: Date.now(),
      ...newCategory,
      totalStudied: 0,
      monthStudied: 0,
      todayStudied: 0,
      isActive: false,
      currentSession: 0,
      earnedUSD: 0,
      earnedMMK: 0,
      canWithdraw: false,
      pomodoroCount: 0
    };

    try {
      setIsSaving(true);
      
      // Check if API client is configured
      if (!apiClient.isConfigured()) {
        throw new Error('Please configure your Notion API credentials first');
      }
      
      // First sync to Notion directly
      console.log('Syncing new category to Notion:', category.name);
      const response = await apiClient.post('/api/categories', category);
      
      if (!response.ok) {
        throw new Error(`Failed to sync category: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add to local state with the Notion page ID
      const categoryWithNotionId = {
        ...category,
        notionPageId: data.notionPageId
      };
      
      setCategories(prev => [...prev, categoryWithNotionId]);
      
      console.log('New category successfully synced to Notion');
      setShowAchievement({ 
        title: 'Category Added!', 
        desc: `${category.name} synced to Notion` 
      });
      setTimeout(() => setShowAchievement(null), 3000);
      
    } catch (error) {
      console.error('Failed to sync new category to Notion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Add to local state even if Notion sync fails
      setCategories(prev => [...prev, category]);
      
      setSaveError(`Category added locally but failed to sync to Notion: ${errorMessage}`);
      setTimeout(() => setSaveError(null), 10000); // Clear error after 10 seconds
    } finally {
      setIsSaving(false);
    }

    setShowAddModal(false);
    setNewCategory({ 
      name: '', 
      hourlyRateUSD: 25, 
      hourlyRateMMK: 105000, 
      totalTarget: 100, 
      monthlyTarget: 10, 
      dailyTarget: 1,
      emoji: '📚',
      priority: 'medium' as const
    });
  };

  const deleteCategory = async (id: number) => {
    const category = categories.find(c => c.id === id);
    if (!category) {
      console.error('Category not found');
      return;
    }

    if (typeof window !== 'undefined' && window.confirm(`Delete "${category.name}"? This action cannot be undone.`)) {
      try {
        setIsSaving(true);
        
        // If category has a Notion page ID, archive it in Notion first
        if (category.notionPageId && apiClient.isConfigured()) {
          console.log('Archiving category in Notion:', category.name);
          
          try {
            const archiveResponse = await apiClient.patch(`/api/categories/${category.notionPageId}/archive`, {});
            
            if (!archiveResponse.ok) {
              console.warn('Failed to archive in Notion, but will delete locally');
            } else {
              console.log('Category archived in Notion successfully');
            }
          } catch (archiveError) {
            console.warn('Archive failed:', archiveError);
          }
        }
        
        // Remove from local state
        setCategories(prev => prev.filter(c => c.id !== id));
        
        console.log('Category deleted successfully:', category.name);
        setShowAchievement({ 
          title: 'Category Deleted!', 
          desc: `${category.name} has been removed` 
        });
        setTimeout(() => setShowAchievement(null), 3000);
        
      } catch (error) {
        console.error('Failed to delete category:', error);
        setSaveError('Failed to delete category. Please try again.');
        setTimeout(() => setSaveError(null), 5000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingCategory) return;
    setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
    setShowEditModal(false);
    setEditingCategory(null);
  };

  const withdrawFunds = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.canWithdraw) return;
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return { ...c, earnedUSD: 0, earnedMMK: 0, canWithdraw: false, monthStudied: 0 };
      }
      return c;
    }));
    if (typeof window !== 'undefined') {
      const amount = showCurrency === 'USD' 
        ? `$${category.earnedUSD.toFixed(2)} USD`
        : `${(category.earnedMMK / 1000000).toFixed(2)}M MMK`;
      alert(`Withdrawn ${amount}!`);
    }
  };

  const syncCategoryToNotion = async (categoryId: number): Promise<void> => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    try {
      const response = category.notionPageId 
        ? await apiClient.patch(`/api/categories/${category.notionPageId}`, category)
        : await apiClient.post('/api/categories', category);

      if (!response.ok) {
        throw new Error(`Failed to sync category: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.notionPageId) {
        setCategories(prev => prev.map(cat => 
          cat.id === categoryId ? { ...cat, notionPageId: data.notionPageId } : cat
        ));
      }
      
      console.log('Category successfully synced to Notion');
      
    } catch (error) {
      console.error('Failed to sync category to Notion:', error);
      throw error; // Re-throw so stopTimer can handle it
    }
  };

  const logSessionToNotion = async (categoryId: number, duration: number, isPomodoro: boolean): Promise<void> => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const session: StudySession = {
      id: Date.now().toString(),
      categoryId,
      duration,
      date: new Date().toISOString().split('T')[0],
      isPomodoro,
      notes: `${category.name} study session`
    };

    try {
      const response = await apiClient.post('/api/sessions', {
        sessionName: `${category.name} - ${new Date().toLocaleDateString()}`,
        categoryPageId: category.notionPageId,
        duration,
        date: session.date,
        isPomodoro,
        notes: session.notes
      });

      if (!response.ok) {
        throw new Error(`Failed to save session: ${response.status} ${response.statusText}`);
      }

      // Only add to local sessions if Notion save was successful
      setSessions(prev => [...prev, session]);
      console.log('Session successfully saved to Notion');
      
    } catch (error) {
      console.error('Failed to log session to Notion:', error);
      throw error; // Re-throw so stopTimer can handle it
    }
  };

  const addPastSession = async (sessionData: {
    categoryId: number;
    startTime: string;
    endTime: string;
    date: string;
    description?: string;
    type: 'study' | 'exercise' | 'break' | 'other';
  }) => {
    const category = categories.find(c => c.id === sessionData.categoryId);
    if (!category) {
      console.error(`Category ${sessionData.categoryId} not found`);
      return;
    }

    // Calculate duration in hours
    const startDateTime = new Date(`${sessionData.date}T${sessionData.startTime}:00`);
    const endDateTime = new Date(`${sessionData.date}T${sessionData.endTime}:00`);
    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      console.error('Invalid time range');
      return;
    }

    try {
      setIsSaving(true);

      // Create session object
      const session: StudySession = {
        id: Date.now().toString(),
        categoryId: sessionData.categoryId,
        duration: durationHours,
        date: sessionData.date,
        isPomodoro: false,
        notes: sessionData.description || `${sessionData.type} session`
      };

      // Save to Notion first
      const response = await apiClient.post('/api/sessions', {
        sessionName: `${category.name} - ${sessionData.date} (${sessionData.type})`,
        categoryPageId: category.notionPageId,
        duration: durationHours,
        date: sessionData.date,
        isPomodoro: false,
        notes: session.notes
      });

      if (!response.ok) {
        throw new Error(`Failed to save past session: ${response.status} ${response.statusText}`);
      }

      // Update local data only after successful save
      setCategories(prev => prev.map(cat => {
        if (cat.id === sessionData.categoryId) {
          const newTotalStudied = cat.totalStudied + durationHours;
          const newMonthStudied = cat.monthStudied + durationHours;
          // Also update today's studied if the session is from today
          const isToday = sessionData.date === new Date().toISOString().split('T')[0];
          const newTodayStudied = isToday ? cat.todayStudied + durationHours : cat.todayStudied;
          
          const earnedUSD = newTotalStudied * cat.hourlyRateUSD;
          const earnedMMK = newTotalStudied * cat.hourlyRateMMK;

          console.log(`Past session update: ${category.name}`);
          console.log(`- Duration: ${durationHours}h`);
          console.log(`- Total before: ${cat.totalStudied}h`);
          console.log(`- Total after: ${newTotalStudied}h`);
          console.log(`- Earned USD: ${earnedUSD}`);
          console.log(`- Today studied: ${newTodayStudied}h`);

          return {
            ...cat,
            totalStudied: newTotalStudied,
            monthStudied: newMonthStudied,
            todayStudied: newTodayStudied,
            earnedUSD,
            earnedMMK,
            canWithdraw: newMonthStudied >= cat.monthlyTarget
          };
        }
        return cat;
      }));

      // Add to sessions
      setSessions(prev => [...prev, session]);

      // Sync category to Notion
      await syncCategoryToNotion(sessionData.categoryId);

      // Force localStorage save by triggering the useEffect
      setTimeout(() => {
        setCategories(prev => [...prev]);
      }, 100);

      console.log('Past session added successfully');
      setShowAchievement({ 
        title: 'Past Session Added!', 
        desc: `${durationHours.toFixed(1)}h added to ${category.name}` 
      });
      setTimeout(() => setShowAchievement(null), 3000);

    } catch (error) {
      console.error('Failed to add past session:', error);
      setSaveError('Failed to save past session to Notion.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromNotion = async () => {
    try {
      if (!apiClient.isConfigured()) {
        alert('Please configure your Notion API credentials first');
        return;
      }
      
      const response = await apiClient.get('/api/categories');
      if (response.ok) {
        const notionCategories = await response.json();
        const convertedCategories = notionCategories.map((cat: any, index: number) => ({
          id: index + 1,
          name: cat.name,
          hourlyRateUSD: cat.hourlyRateUSD || 25,
          hourlyRateMMK: cat.hourlyRateMMK || 105000,
          totalTarget: cat.totalTarget,
          monthlyTarget: cat.monthlyTarget,
          dailyTarget: cat.dailyTarget,
          totalStudied: cat.totalStudied,
          monthStudied: cat.monthStudied,
          todayStudied: cat.todayStudied,
          isActive: false,
          currentSession: 0,
          earnedUSD: cat.earnedUSD || 0,
          earnedMMK: cat.earnedMMK || 0,
          canWithdraw: cat.canWithdraw,
          pomodoroCount: cat.pomodoroCount,
          notionPageId: cat.notionPageId,
          emoji: cat.emoji || '📚',
          priority: cat.priority || 'medium' as const
        }));
        setCategories(convertedCategories);
        setShowAchievement({ title: 'Loaded from Notion!', desc: `${notionCategories.length} categories synced` });
        setTimeout(() => setShowAchievement(null), 3000);
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        alert('Failed to load from Notion. Please check your connection.');
      }
    }
  };

  const totalEarnedUSD = categories.reduce((sum, cat) => sum + (cat.earnedUSD || 0), 0);
  const totalEarnedMMK = categories.reduce((sum, cat) => sum + (cat.earnedMMK || 0), 0);
  const totalWithdrawableUSD = categories.filter(c => c.canWithdraw).reduce((sum, cat) => sum + (cat.earnedUSD || 0), 0);
  const totalWithdrawableMMK = categories.filter(c => c.canWithdraw).reduce((sum, cat) => sum + (cat.earnedMMK || 0), 0);
  
  // Calculate today's earnings
  const todayEarnedUSD = categories.reduce((sum, cat) => sum + ((cat.todayStudied || 0) * (cat.hourlyRateUSD || 0)), 0);
  const todayEarnedMMK = categories.reduce((sum, cat) => sum + ((cat.todayStudied || 0) * (cat.hourlyRateMMK || 0)), 0);

  // Debug logging for earnings calculation
  console.log('Categories earnings debug:', categories.map(cat => ({
    name: cat.name,
    totalStudied: cat.totalStudied,
    hourlyRateUSD: cat.hourlyRateUSD,
    earnedUSD: cat.earnedUSD,
    calculation: cat.totalStudied * cat.hourlyRateUSD
  })));
  console.log('Total earned USD:', totalEarnedUSD);

  // Clean minimalist theme classes
  const themeClasses = {
    background: 'bg-white text-black',
    border: 'border-gray-200',
    surface: 'bg-white',
    surfaceLight: 'bg-gray-50',
    text: 'text-black',
    textMuted: 'text-gray-500',
    button: 'bg-white hover:bg-gray-50 text-black border border-gray-200',
    progress: 'bg-green-500'
  };

  // Focus mode: show only active category when timer is running
  const focusMode = activeTimer !== null;
  const activeCategoryForFocus = focusMode ? categories.find(c => c.id === activeTimer) : null;
  const categoriesToShow = focusMode && activeCategoryForFocus 
    ? [activeCategoryForFocus] 
    : categories.filter(cat => cat.dailyTarget > 0);

  return (
      <div className={`min-h-screen ${themeClasses.background}`}>
        {showAchievement && (
            <div className="fixed top-4 right-4 bg-black text-white p-4 rounded shadow-lg flex items-center gap-3 z-50">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-light">{showAchievement.title}</p>
                <p className="text-xs opacity-75">{showAchievement.desc}</p>
              </div>
            </div>
        )}

        {saveError && (
            <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded shadow-lg flex items-center gap-3 z-50">
              <X className="w-6 h-6" />
              <div>
                <p className="font-light">Save Failed</p>
                <p className="text-xs opacity-75">{saveError}</p>
              </div>
              <button 
                onClick={() => setSaveError(null)}
                className="p-1 hover:bg-red-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
        )}

        <div className={`border-b ${themeClasses.border}`}>
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-light tracking-wide ${themeClasses.text}`}>
                  {focusMode ? `Focus: ${activeCategoryForFocus?.name}` : 'Study Tracker'}
                </h1>
                <p className={`text-sm ${themeClasses.textMuted} mt-1`}>{currentDay}'s Schedule</p>
              </div>
              <nav className={`flex gap-6 text-sm ${focusMode ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                    onClick={() => setView('dashboard')}
                    className={`pb-2 border-b-2 transition ${view === 'dashboard' ? `border-green-500 ${themeClasses.text}` : `border-transparent ${themeClasses.textMuted}`}`}
                >
                  Dashboard
                </button>
                <button
                    onClick={() => setView('bank')}
                    className={`pb-2 border-b-2 transition ${view === 'bank' ? `border-green-500 ${themeClasses.text}` : `border-transparent ${themeClasses.textMuted}`}`}
                >
                  Bank
                </button>
                <button
                    onClick={() => setView('achievements')}
                    className={`pb-2 border-b-2 transition ${view === 'achievements' ? `border-green-500 ${themeClasses.text}` : `border-transparent ${themeClasses.textMuted}`}`}
                >
                  Achievements
                </button>
                <button
                    onClick={() => setView('notion')}
                    className={`pb-2 border-b-2 transition ${view === 'notion' ? `border-green-500 ${themeClasses.text}` : `border-transparent ${themeClasses.textMuted}`}`}
                >
                  Notion
                </button>
                <button
                    onClick={() => setView('timetable')}
                    className={`pb-2 border-b-2 transition ${view === 'timetable' ? `border-green-500 ${themeClasses.text}` : `border-transparent ${themeClasses.textMuted}`}`}
                >
                  Timetable
                </button>
                <div className="flex items-center ml-8 gap-6">
                  <div className="flex items-center">
                    <span className={`text-xs ${themeClasses.textMuted} mr-3`}>Currency:</span>
                    <div className="flex rounded-lg bg-gray-100 p-1">
                      <button
                          onClick={() => setShowCurrency('USD')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            showCurrency === 'USD' 
                              ? 'bg-white shadow-sm text-gray-900' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        USD
                      </button>
                      <button
                          onClick={() => setShowCurrency('MMK')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            showCurrency === 'MMK' 
                              ? 'bg-white shadow-sm text-gray-900' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        MMK
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {view === 'dashboard' && (
              <div className="space-y-8">
                {!focusMode && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className={`text-xs uppercase tracking-wider ${themeClasses.textMuted}`}>Today's Earned</p>
                      <p className={`text-2xl font-light flex items-center gap-2 text-green-600`}>
                        {showCurrency === 'USD' ? (
                          <span>${todayEarnedUSD.toFixed(0)} USD</span>
                        ) : (
                          <span>{(todayEarnedMMK / 1000000).toFixed(1)}M MMK</span>
                        )}
                      </p>
                      <p className={`text-xs text-green-600`}>
                        From today's study sessions
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xs uppercase tracking-wider ${themeClasses.textMuted}`}>Today's Progress</p>
                      <p className={`text-2xl font-light ${themeClasses.text}`}>{formatHoursToMinutes(categories.reduce((sum, cat) => sum + cat.todayStudied, 0))}</p>
                      <p className={`text-xs ${themeClasses.textMuted}`}>of {categories.reduce((sum, cat) => sum + cat.dailyTarget, 0).toFixed(1)}h target</p>
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xs uppercase tracking-wider ${themeClasses.textMuted}`}>Study Subjects</p>
                      <p className={`text-2xl font-light ${themeClasses.text}`}>{categories.filter(c => c.dailyTarget > 0).length}</p>
                      <p className={`text-xs ${themeClasses.textMuted}`}>active today</p>
                    </div>
                  </div>
                )}

                {!focusMode && <div className={`h-px ${themeClasses.border}`}></div>}
                {!focusMode && (
                  <DailyFocusBreakdown 
                    categories={categories} 
                    showCurrency={showCurrency}
                  />
                )}
                {!focusMode && <div className={`h-px ${themeClasses.border}`}></div>}

                <div className="space-y-6">
                  {focusMode && (
                    <div className={`text-center py-8 ${themeClasses.textMuted}`}>
                      <h2 className={`text-3xl font-light mb-2 ${themeClasses.text}`}>Focus Mode</h2>
                      <p className="text-lg">Stay focused on your active study session</p>
                    </div>
                  )}
                  
                  {/* Categories View Toggle */}
                  {!focusMode && (
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-medium ${themeClasses.text}`}>Study Categories</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'list' 
                              ? 'bg-blue-500 text-white' 
                              : `${themeClasses.button}`
                          }`}
                          title="List View"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'grid' 
                              ? 'bg-blue-500 text-white' 
                              : `${themeClasses.button}`
                          }`}
                          title="Grid View"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Categories Container */}
                  <div className={viewMode === 'grid' && !focusMode ? 'grid grid-cols-2 gap-6' : 'space-y-6'}>
                    {categoriesToShow
                    .sort((a, b) => b.priority === 'high' ? 1 : -1)
                    .map(category => {
                    const dailyProgress = (category.todayStudied / category.dailyTarget) * 100;
                    const monthlyProgress = (category.monthStudied / category.monthlyTarget) * 100;
                    const totalProgress = (category.totalStudied / category.totalTarget) * 100;
                    
                    return (
                        <div key={category.id} className="space-y-4 border-l-4 border-l-gray-800 pl-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-light tracking-wide">{category.name}</h3>
                                {!focusMode && (
                                  <>
                                    <button onClick={() => startEdit(category)} className="p-1 hover:bg-gray-100 rounded">
                                      <Edit2 className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button 
                                      onClick={() => deleteCategory(category.id)} 
                                      className="p-1 hover:bg-red-100 hover:text-red-600 rounded disabled:opacity-50 transition-colors"
                                      disabled={isSaving}
                                      title="Delete category"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {formatHoursToMinutes(category.totalStudied)} / {category.totalTarget}h
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {category.isActive && (
                                  <div>
                                    <div className={`font-mono text-2xl tracking-tight ${isPaused ? 'text-orange-600' : ''}`}>
                                      {formatTime(timerSeconds)}
                                      {isPaused && <span className="text-sm ml-2 text-orange-600">⏸️ PAUSED</span>}
                                    </div>
                                    {isPomodoroMode && (
                                        <div className="text-xs text-gray-400 text-center mt-1">
                                          {isBreakTime ? (
                                              <span className="flex items-center gap-1 justify-center">
                                    <Coffee className="w-3 h-3" /> {formatTime(pomodoroSeconds)}
                                  </span>
                                          ) : (
                                              <span>POMODORO {formatTime(pomodoroSeconds)} / 25:00</span>
                                          )}
                                        </div>
                                    )}
                                  </div>
                              )}

                              <div className="flex gap-2">
                                {!category.isActive ? (
                                    <>
                                      <button
                                          onClick={() => startTimer(category.id, false)}
                                          className="p-2 hover:bg-gray-100 rounded transition"
                                          disabled={activeTimer !== null && activeTimer !== category.id}
                                      >
                                        <Play className="w-5 h-5" />
                                      </button>
                                      <button
                                          onClick={() => startTimer(category.id, true)}
                                          className="p-2 hover:bg-gray-100 rounded transition text-xs font-medium"
                                          disabled={activeTimer !== null && activeTimer !== category.id}
                                      >
                                        POMODORO
                                      </button>
                                    </>
                                ) : (
                                    <>
                                      {!isPaused ? (
                                        <button onClick={() => pauseTimer()} className="p-2 hover:bg-gray-100 rounded transition">
                                          <Pause className="w-5 h-5" />
                                        </button>
                                      ) : (
                                        <button onClick={() => resumeTimer()} className="p-2 hover:bg-green-100 rounded transition bg-green-50">
                                          <Play className="w-5 h-5 text-green-600" />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => stopTimer(category.id)} 
                                        className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50" 
                                        disabled={isSaving}
                                      >
                                        {isSaving ? (
                                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        ) : (
                                          <Square className="w-5 h-5" />
                                        )}
                                      </button>
                                    </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Daily</span>
                                <span>{formatHoursToMinutes(category.todayStudied)} / {category.dailyTarget}h</span>
                              </div>
                              <div className="h-1 bg-gray-100">
                                <div 
                                  className="h-1 bg-green-500 transition-all"
                                  style={{ width: `${Math.min(dailyProgress, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Monthly</span>
                                <span>{formatHoursToMinutes(category.monthStudied)} / {category.monthlyTarget}h</span>
                              </div>
                              <div className="h-1 bg-gray-100">
                                <div 
                                  className="h-1 bg-green-500 transition-all"
                                  style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Total</span>
                                <span>{totalProgress.toFixed(1)}%</span>
                              </div>
                              <div className="h-1 bg-gray-100">
                                <div 
                                  className="h-1 bg-green-500 transition-all"
                                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm">
                              <span className="text-gray-400">Earned: </span>
                              <span className="font-light">
                                {showCurrency === 'USD' 
                                  ? `$${category.earnedUSD.toFixed(0)} USD`
                                  : `${(category.earnedMMK / 1000000).toFixed(1)}M MMK`
                                }
                              </span>
                            </div>
                            {!focusMode && (
                              category.canWithdraw ? (
                                  <button
                                      onClick={() => withdrawFunds(category.id)}
                                      className="text-xs px-2 py-1 border border-black hover:bg-black hover:text-white rounded transition"
                                  >
                                    WITHDRAW
                                  </button>
                              ) : (
                                  <span className="text-xs px-2 py-1 border border-gray-300 text-gray-400 rounded">LOCKED</span>
                              )
                            )}
                          </div>

                          <div className="h-px bg-gray-200 mt-6"></div>
                        </div>
                    );
                  })}
                  </div>

                {!focusMode && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                          onClick={() => setShowAddModal(true)}
                          className={`py-6 border border-dashed ${themeClasses.border} hover:${themeClasses.border} rounded transition flex items-center justify-center gap-2 ${themeClasses.textMuted} hover:${themeClasses.text}`}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-sm uppercase tracking-wider">New Goal</span>
                      </button>
                      <button
                          onClick={() => setShowPastSessionModal(true)}
                          className={`py-6 border border-dashed ${themeClasses.border} hover:${themeClasses.border} rounded transition flex items-center justify-center gap-2 ${themeClasses.textMuted} hover:${themeClasses.text}`}
                      >
                        <Clock className="w-5 h-5" />
                        <span className="text-sm uppercase tracking-wider">Past Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
          )}

          {view === 'bank' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light">Virtual Bank</h2>
                <div className="h-px bg-gray-200"></div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Total Balance</p>
                    <div>
                      {showCurrency === 'USD' ? (
                        <div>
                          <p className="text-3xl font-light text-gray-900">${totalEarnedUSD.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">United States Dollar</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-3xl font-light text-gray-900">{(totalEarnedMMK / 1000000).toFixed(2)}M</p>
                          <p className="text-sm text-gray-500">Myanmar Kyat</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border border-green-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-white">
                    <p className="text-xs uppercase tracking-wider text-green-600 mb-3">Withdrawable</p>
                    <div>
                      {showCurrency === 'USD' ? (
                        <div>
                          <p className="text-3xl font-light text-green-700">${totalWithdrawableUSD.toFixed(2)}</p>
                          <p className="text-sm text-green-600">Ready to withdraw</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-3xl font-light text-green-700">{(totalWithdrawableMMK / 1000000).toFixed(2)}M</p>
                          <p className="text-sm text-green-600">Ready to withdraw</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-light">By Category</h3>
                  {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span>{formatHoursToMinutes(cat.totalStudied)}</span>
                            <span>×</span>
                            {showCurrency === 'USD' ? (
                              <span>${cat.hourlyRateUSD}/hr</span>
                            ) : (
                              <span>{(cat.hourlyRateMMK / 1000).toFixed(0)}K/hr</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div>
                            {showCurrency === 'USD' ? (
                              <span className="font-semibold text-lg">${cat.earnedUSD.toFixed(0)}</span>
                            ) : (
                              <span className="font-semibold text-lg">{(cat.earnedMMK / 1000000).toFixed(2)}M</span>
                            )}
                          </div>
                          {cat.canWithdraw && (
                              <button 
                                  onClick={() => withdrawFunds(cat.id)} 
                                  className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded mt-2 transition-colors"
                              >
                                Withdraw
                              </button>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {view === 'achievements' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light">Achievements</h2>
                <div className="h-px bg-gray-200"></div>
                {achievements.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p className="font-light">No achievements yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {achievements.map((ach, idx) => (
                          <div key={idx} className="border border-gray-200 rounded p-4 text-center">
                            <Award className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-light text-sm">{ach.title}</p>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}

          {view === 'notion' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light">Notion Integration</h2>
                <div className="h-px bg-gray-200"></div>
                
                {isNotionConfigured ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded">
                        <span className="text-green-800">✓ Connected to Notion</span>
                        <div className="flex gap-2">
                          <button
                              onClick={() => setShowConfigModal(true)}
                              className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                          >
                            Settings
                          </button>
                          <button
                              onClick={loadFromNotion}
                              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >
                            Load from Notion
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-light text-lg">Study Categories</h3>
                        <div className="grid gap-3">
                          {categories.map(cat => (
                              <div key={cat.id} className="flex items-center justify-between p-4 border border-gray-200 rounded">
                                <div>
                                  <p className="font-medium">{cat.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {formatHoursToMinutes(cat.totalStudied)} studied • {cat.pomodoroCount} 🍅
                                    {cat.notionPageId && ' • Synced'}
                                  </p>
                                </div>
                                <button
                                    onClick={() => syncCategoryToNotion(cat.id)}
                                    className="text-sm px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
                                >
                                  {cat.notionPageId ? 'Update' : 'Sync'}
                                </button>
                              </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-light text-lg">Recent Sessions</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {sessions.slice(-10).reverse().map(session => {
                            const category = categories.find(c => c.id === session.categoryId);
                            return (
                                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{category?.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">
                                      {session.duration.toFixed(2)}h • {session.date}
                                      {session.isPomodoro && ' • 🍅'}
                                    </p>
                                  </div>
                                </div>
                            );
                          })}
                          {sessions.length === 0 && (
                              <p className="text-gray-400 text-center py-8">No sessions logged yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">Notion integration not configured</p>
                      <button
                        onClick={() => setShowConfigModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Configure Notion
                      </button>
                    </div>
                )}
              </div>
          )}

          {view === 'timetable' && (
              <TimetableView
                onStartTimer={startTimer}
                onPauseTimer={pauseTimer}
                onResumeTimer={resumeTimer}
                onStopTimer={stopTimer}
                activeTimer={activeTimer}
                timerSeconds={timerSeconds}
                isPaused={isPaused}
                categories={categories}
              />
          )}
        </div>

        {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light">New Goal</h3>
                  <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <input
                      type="text"
                      placeholder="Goal name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                        type="number"
                        placeholder="Hourly rate USD"
                        value={newCategory.hourlyRateUSD}
                        onChange={(e) => setNewCategory({...newCategory, hourlyRateUSD: parseInt(e.target.value)})}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        placeholder="Total hours"
                        value={newCategory.totalTarget}
                        onChange={(e) => setNewCategory({...newCategory, totalTarget: parseInt(e.target.value)})}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <button 
                    onClick={addCategory} 
                    className="w-full bg-black text-white py-2 rounded disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing to Notion...
                      </>
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
              </div>
            </div>
        )}

        {showEditModal && editingCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded p-8 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light">Edit Goal</h3>
                  <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <input
                      type="text"
                      placeholder="Goal name"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                        type="number"
                        placeholder="Hourly rate USD"
                        value={editingCategory.hourlyRateUSD}
                        onChange={(e) => setEditingCategory({...editingCategory, hourlyRateUSD: parseInt(e.target.value)})}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        placeholder="Total hours"
                        value={editingCategory.totalTarget}
                        onChange={(e) => setEditingCategory({...editingCategory, totalTarget: parseInt(e.target.value)})}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                        type="number"
                        placeholder="Monthly target"
                        value={editingCategory.monthlyTarget}
                        onChange={(e) => setEditingCategory({...editingCategory, monthlyTarget: parseInt(e.target.value)})}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                    <input
                        type="number"
                        placeholder="Daily target"
                        value={editingCategory.dailyTarget}
                        onChange={(e) => setEditingCategory({...editingCategory, dailyTarget: parseInt(e.target.value)})}
                        className="border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <button onClick={saveEdit} className="w-full bg-black text-white py-2 rounded">Save</button>
                </div>
              </div>
            </div>
        )}

        <AddPastSessionModal
          isOpen={showPastSessionModal}
          onClose={() => setShowPastSessionModal(false)}
          onAdd={addPastSession}
          categories={categories}
        />
        
        <ConfigurationModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onSave={() => {
            setIsNotionConfigured(configManager.isConfigured());
            if (configManager.isConfigured()) {
              loadFromNotion();
            }
          }}
        />
      </div>
  );
}