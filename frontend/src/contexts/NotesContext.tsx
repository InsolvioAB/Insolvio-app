import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Note = {
  sectionId: string;
  text: string;
  timestamp: number;
};

type NotesContextType = {
  notes: Note[];
  addNote: (sectionId: string, text: string) => Promise<void>;
  updateNote: (sectionId: string, text: string) => Promise<void>;
  deleteNote: (sectionId: string) => Promise<void>;
  getNote: (sectionId: string) => Note | undefined;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_KEY = '@konkurs_notes';

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTES_KEY);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async (newNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
      setNotes(newNotes);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const addNote = async (sectionId: string, text: string) => {
    const newNote: Note = {
      sectionId,
      text,
      timestamp: Date.now(),
    };
    const updated = [...notes.filter((n) => n.sectionId !== sectionId), newNote];
    await saveNotes(updated);
  };

  const updateNote = async (sectionId: string, text: string) => {
    const updated = notes.map((note) =>
      note.sectionId === sectionId
        ? { ...note, text, timestamp: Date.now() }
        : note
    );
    await saveNotes(updated);
  };

  const deleteNote = async (sectionId: string) => {
    const updated = notes.filter((n) => n.sectionId !== sectionId);
    await saveNotes(updated);
  };

  const getNote = (sectionId: string) => {
    return notes.find((n) => n.sectionId === sectionId);
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, getNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}
