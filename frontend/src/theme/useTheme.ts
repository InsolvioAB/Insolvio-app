import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './theme';
import { useThemeMode, ThemeMode } from '../contexts/ThemeContext';

/**
 * Ger färgerna för aktuellt utseende. Valet Auto följer mobilens
 * ljust/mörkt-inställning (och uppdateras direkt om den ändras medan appen
 * är öppen); Ljust och Mörkt är användarens eget val.
 */
export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
} {
  const scheme = useColorScheme();
  const { mode, setMode } = useThemeMode();
  const isDark = mode === 'auto' ? scheme === 'dark' : mode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark, mode, setMode };
}
