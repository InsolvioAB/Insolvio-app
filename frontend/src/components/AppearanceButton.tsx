import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Text as RNText,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeMode, THEME_MODE_LABEL } from '../contexts/ThemeContext';
import { typography, borderRadius, spacing, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

// Egen knapp för utseende (Auto / Ljust / Mörkt), bredvid Aa-knappen.
// Knappen visar en ikon för det aktuella valet och öppnar en liten ruta
// under sig. Rutan ligger i en Modal så den fungerar i alla toppfält.
// Använder RNText så att texten inte ändrar storlek med textstorleken.

const MODES: ThemeMode[] = ['auto', 'light', 'dark'];
const MODE_ICON: Record<ThemeMode, React.ComponentProps<typeof Ionicons>['name']> = {
  auto: 'contrast-outline',
  light: 'sunny-outline',
  dark: 'moon-outline',
};
const POPOVER_WIDTH = 252;

export default function AppearanceButton() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width: windowWidth } = useWindowDimensions();
  const buttonRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 80, right: 12 });

  const openPopover = () => {
    buttonRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({
        top: y + h + 10,
        right: Math.max(12, windowWidth - (x + w) - 4),
      });
      setOpen(true);
    });
  };

  return (
    <>
      <View ref={buttonRef} collapsable={false} style={styles.buttonWrap}>
        <TouchableOpacity
          onPress={() => (open ? setOpen(false) : openPopover())}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Utseende, ${THEME_MODE_LABEL[mode]}`}
          accessibilityState={{ expanded: open }}
        >
          <Ionicons name={MODE_ICON[mode]} size={22} color={colors.greenPrimary} />
        </TouchableOpacity>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Stäng utseende"
        />
        <View style={[styles.popover, { top: anchor.top, right: anchor.right }]}>
          <RNText style={styles.label}>UTSEENDE</RNText>
          <View style={styles.row}>
            {MODES.map((m) => {
              const selected = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.choice, selected && styles.choiceSelected]}
                  onPress={() => {
                    setMode(m);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Utseende ${THEME_MODE_LABEL[m]}`}
                >
                  <Ionicons
                    name={MODE_ICON[m]}
                    size={18}
                    color={selected ? colors.greenPrimaryForeground : colors.greenText}
                  />
                  <RNText style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                    {THEME_MODE_LABEL[m]}
                  </RNText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  buttonWrap: {
    marginRight: 4,
  },
  popover: {
    position: 'absolute',
    width: POPOVER_WIDTH,
    padding: 14,
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.greenTintBorder,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.mutedText,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.greenTintBorder,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  choice: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.greenTint,
  },
  choiceSelected: {
    backgroundColor: colors.greenPrimary,
  },
  choiceText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.greenText,
  },
  choiceTextSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenPrimaryForeground,
  },
});
