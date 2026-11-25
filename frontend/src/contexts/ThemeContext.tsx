import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utseende: följ mobilens inställning (auto) eller välj ljust/mörkt själv.
export type ThemeMode = 'auto' | 'light' | 'dark';

export const THEME_MODE_LABEL: Record<ThemeMode, string> = {
  auto: 'Auto',
  light: 'Ljust',
  dark: 'Mörkt',
};

const THEME_MODE_KEY = '@insolvio_theme_mode';

type ThemeModeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
};

// Standardvärde så att skärmar aldrig kraschar om providern saknas
const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'auto',
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (stored === 'auto' || stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    })();
  }, []);

  // Låt även delar som ritas av iOS (tangentbord, dialoger, statusfält)
  // följa valet. Finns inte funktionen (t.ex. på webben) görs inget.
  useEffect(() => {
    try {
      if (typeof Appearance.setColorScheme === 'function') {
        Appearance.setColorScheme(mode === 'auto' ? 'unspecified' : mode);
      }
    } catch (error) {
      console.error('Error applying color scheme:', error);
    }
  }, [mode]);

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, next);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  return <ThemeModeContext.Provider value={{ mode, setMode }}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
