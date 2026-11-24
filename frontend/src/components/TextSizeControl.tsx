import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Text as RNText } from 'react-native';
import {
  useTextSize,
  TEXT_SIZE_LABEL,
  TEXT_SIZE_SCALE,
  TextSize,
} from '../contexts/TextSizeContext';
import { typography, borderRadius, spacing, ThemeColors } from '../theme/theme';
import { useTheme } from '../theme/useTheme';
import { ThemeMode, THEME_MODE_LABEL } from '../contexts/ThemeContext';

// Aa-knappen och dess val av textstorlek (Liten / Normal / Stor).
// Används på Hem och på lagskärmen. Båda delar samma sparade inställning.
// Använder RNText så att själva knappen och rutan inte ändrar storlek.

type ButtonProps = {
  onPress: () => void;
  expanded: boolean;
};

export function TextSizeButton({ onPress, expanded }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Textstorlek"
      accessibilityState={{ expanded }}
    >
      <View style={styles.aaGlyph}>
        <RNText style={styles.aaSmall}>A</RNText>
        <RNText style={styles.aaLarge}>a</RNText>
      </View>
    </TouchableOpacity>
  );
}

/** Liten rad med Aa-knappen längst till höger, för skärmar utan egen knapp i toppfältet. */
export function TextSizeRow({ onPress, expanded }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.aaRow}>
      <TextSizeButton onPress={onPress} expanded={expanded} />
    </View>
  );
}

type ChoicesProps = {
  /** Anropas efter att en storlek har valts */
  onChosen?: () => void;
};

export function TextSizeChoices({ onChosen }: ChoicesProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { textSize, setTextSize } = useTextSize();
  return (
    <View style={styles.row}>
      {(['small', 'normal', 'large'] as TextSize[]).map((size) => {
        const selected = textSize === size;
        return (
          <TouchableOpacity
            key={size}
            style={[styles.button, selected && styles.buttonSelected]}
            onPress={() => {
              setTextSize(size);
              onChosen?.();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Textstorlek ${TEXT_SIZE_LABEL[size]}`}
          >
            <RNText
              style={[
                styles.buttonText,
                selected && styles.buttonTextSelected,
                { fontSize: 15 * TEXT_SIZE_SCALE[size] },
              ]}
            >
              {TEXT_SIZE_LABEL[size]}
            </RNText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type PopoverProps = {
  onClose: () => void;
  /** Avstånd från överkanten av skärmen/behållaren */
  top?: number;
};

function ThemeModeChoices({ onChosen }: ChoicesProps) {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      {(['auto', 'light', 'dark'] as ThemeMode[]).map((m) => {
        const selected = mode === m;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.button, selected && styles.buttonSelected]}
            onPress={() => {
              setMode(m);
              onChosen?.();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Utseende ${THEME_MODE_LABEL[m]}`}
          >
            <RNText style={[styles.buttonText, selected && styles.buttonTextSelected, { fontSize: 15 }]}>
              {THEME_MODE_LABEL[m]}
            </RNText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function TextSizePopover({ onClose, top = 8 }: PopoverProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Stäng textstorlek"
      />
      <View style={[styles.popover, { top }]}>
        <RNText style={styles.label}>TEXTSTORLEK</RNText>
        <TextSizeChoices onChosen={onClose} />
        <RNText style={[styles.label, styles.labelSpaced]}>UTSEENDE</RNText>
        <ThemeModeChoices onChosen={onClose} />
      </View>
    </>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  aaRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream,
  },
  aaGlyph: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  aaSmall: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  aaLarge: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  popover: {
    position: 'absolute',
    right: 12,
    width: 252,
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
    zIndex: 10,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.mutedText,
  },
  labelSpaced: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.greenTintBorder,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenTint,
  },
  buttonSelected: {
    backgroundColor: colors.greenPrimary,
  },
  buttonText: {
    fontFamily: typography.fontFamily.regular,
    color: colors.greenText,
  },
  buttonTextSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenPrimaryForeground,
  },
});
