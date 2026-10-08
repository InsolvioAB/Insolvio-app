import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getAmendmentByNewsId, AmendmentChangeType, AmendmentParagraph } from '../../src/content/lawAmendments';
import { diffWords, DiffSegment } from '../../src/utils/wordDiff';
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
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={amendment.paragraphs}
        keyExtractor={(paragraph) => paragraph.id}
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.header}>
          <Text style={styles.title}>{amendment.title}</Text>
          <Text style={styles.metadataText}>SFS {amendment.sfsNumber}</Text>
          <Text style={styles.summary}>{amendment.summary}</Text>
          <Text style={styles.source}>Källa: {amendment.source}</Text>
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Så läser du jämförelsen:</Text>
            <View style={styles.legendRow}>
              <Text style={[styles.removed, styles.legendChip]}>Text</Text>
              <Text style={styles.legendText}>tas bort</Text>
              <Text style={[styles.added, styles.legendChip]}>Text</Text>
              <Text style={styles.legendText}>läggs till</Text>
            </View>
          </View>
        </View>
        }
        renderItem={({ item: paragraph }) => (
          <View style={styles.paragraphCard}>
            <View style={styles.paragraphHeader}>
              <Text style={styles.paragraphReference}>{paragraph.reference.replace('kap.', 'KAP.')}</Text>
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

            {renderComparison(paragraph, amendment.effectiveDate)}
          </View>
        )}
      />
    </>
  );
}

function renderSegments(segments: DiffSegment[], style: object, changedStyle: object) {
  return (
    <Text style={style}>
      {segments.map((seg, idx) =>
        seg.changed ? (
          <Text key={idx} style={changedStyle}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        )
      )}
    </Text>
  );
}

function renderComparison(paragraph: AmendmentParagraph, effectiveDate: string) {
  const { oldText, newText, changeType } = paragraph;
  const diff = oldText && newText ? diffWords(oldText, newText) : null;

  const oldBlock = oldText ? (
    <View style={[styles.textBlock, styles.oldTextBlock]}>
      <View style={styles.blockLabelRow}>
        <Ionicons name="document-text-outline" size={14} color={colors.weakText} />
        <Text style={styles.textBlockLabel}>
          {changeType === 'upphävd' ? 'Upphävd lydelse' : 'Nuvarande lydelse'}
        </Text>
      </View>
      {diff ? (
        renderSegments(diff.oldSegments, styles.bodyText, styles.removed)
      ) : changeType === 'upphävd' ? (
        <Text style={styles.bodyText}>
          <Text style={styles.removed}>{oldText}</Text>
        </Text>
      ) : (
        <Text style={styles.bodyText}>{oldText}</Text>
      )}
    </View>
  ) : (
    <View style={[styles.textBlock, styles.newParagraphNote]}>
      <Text style={styles.bodyText}>Ny paragraf — fanns inte tidigare.</Text>
    </View>
  );

  const newBlock = newText ? (
    <View style={[styles.textBlock, styles.newTextBlock]}>
      <View style={styles.blockLabelRow}>
        <Ionicons name="time-outline" size={14} color={colors.greenPrimary} />
        <Text style={[styles.textBlockLabel, styles.newLabel]}>Kommande lydelse</Text>
      </View>
      {diff ? (
        renderSegments(diff.newSegments, styles.bodyText, styles.added)
      ) : (
        <Text style={styles.bodyText}>{newText}</Text>
      )}
    </View>
  ) : null;

  return (
    <>
      {oldBlock}
      {newBlock ? (
        <View style={styles.dateDivider}>
          <View style={styles.dashedLine} />
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={14} color={colors.greenPrimary} />
            <Text style={styles.datePillText}>I kraft {formatDate(effectiveDate)}</Text>
          </View>
          <View style={styles.dashedLine} />
        </View>
      ) : null}
      {newBlock}
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
    textTransform: 'none', // "KAP." is capitalised in the JSX; "2 a §" keeps its lowercase letter
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
    backgroundColor: '#efefef',
  },
  newParagraphNote: {
    backgroundColor: '#d8f0e6',
  },
  newTextBlock: {
    backgroundColor: '#e3f1ea',
    borderWidth: 1,
    borderColor: '#bfdccd',
  },
  newLabel: {
    color: colors.greenPrimary,
  },
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  removed: {
    backgroundColor: '#f6d9d4',
    textDecorationLine: 'line-through',
    textDecorationColor: '#b3402f',
    color: '#7a2c20',
  },
  added: {
    backgroundColor: '#bfe3d0',
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  legend: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
    gap: spacing.xs,
  },
  legendTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
    borderRadius: 4,
    fontSize: 13,
  },
  legendText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dashedLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
    borderStyle: 'dashed',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.greenPrimary,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  datePillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
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
  },
  newText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
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
