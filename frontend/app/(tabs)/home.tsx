import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { homeContent } from '../../src/content/homeContent';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../../src/theme/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hem</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.mainTitle}>{homeContent.title}</Text>
        </View>

        {homeContent.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{homeContent.footer}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 <Text style={styles.infoBold}>För tillhandahållare:</Text> Redigera innehållet på denna sida genom att ändra filen{' '}
            <Text style={styles.infoCode}>frontend/src/content/homeContent.ts</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  title: {
    ...createHeadingStyle(24),
    color: colors.ink,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  welcomeCard: {
    backgroundColor: colors.deepGreen,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  mainTitle: {
    ...createHeadingStyle(28),
    color: colors.cream,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 20,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  sectionHeading: {
    ...createHeadingStyle(18),
    color: colors.ink,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
  },
  footer: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  footerText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: colors.greenPrimary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: '#78350f',
  },
  infoBold: {
    fontFamily: typography.fontFamily.bold,
  },
  infoCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#fde68a',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
