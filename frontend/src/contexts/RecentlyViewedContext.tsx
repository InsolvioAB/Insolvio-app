import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecentlyViewed = {
  lawId: string;
  lawTitle: string;
  chapterNumber?: number;
  sectionNumber?: number;
  sectionId?: string;
  timestamp: number;
};

type RecentlyViewedContextType = {
  recentlyViewed: RecentlyViewed[];
  addRecentlyViewed: (lawId: string, lawTitle: string, chapterNumber?: number, sectionNumber?: number, sectionId?: string) => Promise<void>;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const RECENTLY_VIEWED_KEY = '@konkurs_recently_viewed';
const MAX_RECENT_ITEMS = 5;

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewed[]>([]);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const saveRecentlyViewed = async (newList: RecentlyViewed[]) => {
    try {
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(newList));
      setRecentlyViewed(newList);
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  };

  const addRecentlyViewed = async (
    lawId: string,
    lawTitle: string,
    chapterNumber?: number,
    sectionNumber?: number,
    sectionId?: string
  ) => {
    const newEntry: RecentlyViewed = {
      lawId,
      lawTitle,
      chapterNumber,
      sectionNumber,
      sectionId,
      timestamp: Date.now(),
    };

    // Remove any existing entry for the same law, so re-viewing it
    // just moves it to the top instead of creating a duplicate row
    const withoutDuplicate = recentlyViewed.filter((item) => item.lawId !== lawId);

    // Put the new entry first (most recent), then trim to the max count
    const updated = [newEntry, ...withoutDuplicate].slice(0, MAX_RECENT_ITEMS);

    await saveRecentlyViewed(updated);
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  }
  return context;
}