import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

// Gemensam sidrubrik för alla flikar (Hem, Lagar, Sök, Bokmärken) -- EJU-193.
// Stor vänsterställd rubrik, ingen extra luft ovanför.
export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...typography.pageTitle,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
});
