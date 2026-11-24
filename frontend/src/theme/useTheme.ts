import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './theme';

/**
 * Ger färgerna för mobilens aktuella läge (ljust/mörkt).
 * Uppdateras direkt om användaren byter läge medan appen är öppen.
 */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
