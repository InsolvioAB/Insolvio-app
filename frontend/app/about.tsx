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
        {homeContent.sections.map((section, index) => (
          <View key={index} style={styles.infoSection}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
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
});
