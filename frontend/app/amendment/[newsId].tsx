import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getAmendmentByNewsId, AmendmentChangeType } from '../../src/content/lawAmendments';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

const CHANGE_TYPE_LABEL: Record<AmendmentChangeType, string> = {
  ändrad: 'Ändrad',
  ny: 'Ny paragraf',
  upphävd: 'Upphävd',
};

export default function AmendmentScreen() {
  const { newsId } = useLocalSearchParams<{ newsId: string }>();
  const amendment = getAmendmentByNewsId(newsId);

  if (!amendment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ändringen kunde inte hittas</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Jämför ändring' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{amendment.title}</Text>
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>SFS {amendment.sfsNumber}</Text>
            <Text style={styles.metadataText}>•</Text>
            <Text style={styles.metadataText}>
              I kraft {formatDate(amendment.effectiveDate)}
            </Text>
          </View>
          <Text style={styles.summary}>{amendment.summary}</Text>
          <Text style={styles.source}>Källa: {amendment.source}</Text>
        </View>

        {amendment.paragraphs.map((paragraph) => (
          <View key={paragraph.id} style={styles.paragraphCard}>
            <View style={styles.paragraphHeader}>
              <Text style={styles.paragraphReference}>{paragraph.reference}</Text>
              <View
                style={[
                  styles.changeBadge,
                  paragraph.changeType === 'ny' && styles.changeBadgeNy,
                  paragraph.changeType === 'upphävd' && styles.changeBadgeUpphavd,
                ]}
              >
                <Text
                  style={[
                    styles.changeBadgeText,
                    paragraph.changeType === 'upphävd' && styles.changeBadgeTextUpphavd,
                  ]}
                >
                  {CHANGE_TYPE_LABEL[paragraph.changeType]}
                </Text>
              </View>
            </View>

            {paragraph.oldText ? (
              <View style={[styles.textBlock, styles.oldTextBlock]}>
                <Text style={styles.textBlockLabel}>
                  {paragraph.changeType === 'upphävd' ? 'Upphävd lydelse' : 'Tidigare lydelse'}
                </Text>
                <Text style={styles.oldText}>{paragraph.oldText}</Text>
              </View>
            ) : (
              <View style={[styles.textBlock, styles.newParagraphNote]}>
                <Text style={styles.newParagraphNoteText}>
                  Ny paragraf — fanns inte tidigare.
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  title: {
    ...createHeadingStyle(19),
    color: colors.ink,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  metadataText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
    marginTop: spacing.sm,
  },
  source: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.weakText,
    marginTop: spacing.xs,
  },
  paragraphCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  paragraphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paragraphReference: {
    ...createLabelStyle(13),
    color: colors.greenPrimary,
  },
  changeBadge: {
    backgroundColor: '#fdf1e0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  changeBadgeNy: {
    backgroundColor: '#d8f0e6',
  },
  changeBadgeUpphavd: {
    backgroundColor: '#fbe3dc',
  },
  changeBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: '#8a5a1f',
    letterSpacing: 0.3,
  },
  changeBadgeTextUpphavd: {
    color: colors.destructive,
  },
  textBlock: {
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  oldTextBlock: {
    backgroundColor: '#fbf0ed',
  },
  newParagraphNote: {
    backgroundColor: '#d8f0e6',
  },
  textBlockLabel: {
    ...createLabelStyle(10),
    color: colors.weakText,
  },
  oldText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.destructive,
  },
  newParagraphNoteText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  errorText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
});
