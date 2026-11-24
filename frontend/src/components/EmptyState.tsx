import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { colors, typography, spacing, createHeadingStyle } from '../theme/theme';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
  buttonLabel: string;
  onPress: () => void;
};

/** Tomt läge: ikon, rubrik, kort förklaring och en knapp vidare. */
export default function EmptyState({ icon, title, text, buttonLabel, onPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.greenText} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenTint,
    borderWidth: 1,
    borderColor: colors.greenTintBorder,
  },
  title: {
    ...createHeadingStyle(20),
    color: colors.ink,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenPrimary,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenPrimaryForeground,
  },
});
