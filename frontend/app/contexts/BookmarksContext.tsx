import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Bookmark = {
  lawId: string;
  chapterId: string;
  sectionId: string;
  timestamp: number;
};

type BookmarksContextType = {
  bookmarks: Bookmark[];
  addBookmark: (lawId: string, chapterId: string, sectionId: string) => Promise<void>;
  removeBookmark: (sectionId: string) => Promise<void>;
  isBookmarked: (sectionId: string) => boolean;
};

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

const BOOKMARKS_KEY = '@konkurs_bookmarks';

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const saveBookmarks = async (newBookmarks: Bookmark[]) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const addBookmark = async (lawId: string, chapterId: string, sectionId: string) => {
    const newBookmark: Bookmark = {
      lawId,
      chapterId,
      sectionId,
      timestamp: Date.now(),
    };
    const updated = [...bookmarks, newBookmark];
    await saveBookmarks(updated);
  };

  const removeBookmark = async (sectionId: string) => {
    const updated = bookmarks.filter((b) => b.sectionId !== sectionId);
    await saveBookmarks(updated);
  };

  const isBookmarked = (sectionId: string) => {
    return bookmarks.some((b) => b.sectionId === sectionId);
  };

  return (
    <BookmarksContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within BookmarksProvider');
  }
  return context;
}
