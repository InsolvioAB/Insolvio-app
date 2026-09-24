import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { homeContent } from '../src/content/homeContent';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../src/theme/theme';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.mainTitle}>{homeContent.title}</Text>
        </View>

        {homeContent.sections.map((section, index) => (
          <View key={index} style={styles.infoSection}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {!!homeContent.footer && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{homeContent.footer}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
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
    ...createHeadingStyle(24),
    color: colors.cream,
    textAlign: 'center',
  },
  infoSection: {
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
});
