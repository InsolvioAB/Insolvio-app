import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts } from '../../src/data/legalTexts';
import { activeNewsItems, updatedLawIds } from '../../src/content/newsContent';
import { LAW_CATEGORIES, lawCategoriesById, type LawCategory } from '../../src/data/lawCategories';
import PageHeader from '../../src/components/PageHeader';
import { getShortLawName } from '../../src/data/lawShortNames';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

// "17 kap." för lagar med kapitel, "70 §§" för lagar utan (t.ex. LAS)
function lawSize(law: typeof legalTexts[0]): string {
  if (law.chaptered === false) {
    return `${law.chapters.reduce((n, c) => n + c.sections.length, 0)} §§`;
  }
  return `${law.chapters.length} kap.`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = React.useState<'Alla' | LawCategory>('Alla');
  const visibleLaws =
    category === 'Alla'
      ? legalTexts
      : legalTexts.filter((law) => lawCategoriesById[law.id]?.includes(category));

  const renderLawItem = ({ item }: { item: typeof legalTexts[0] }) => (
    <TouchableOpacity
      style={styles.lawCard}
      onPress={() => router.push(`/law/${item.id}`)}
    >
      <View style={styles.lawCardHeader}>
        <View style={styles.lawCardContent}>
          <View style={styles.lawTitleRow}>
            <Text style={styles.lawTitle}>{getShortLawName(item.id, item.title)}</Text>
            {updatedLawIds.has(item.id) && (
              <View style={styles.updatedBadge}>
                <Text style={styles.updatedBadgeText}>Uppdaterad</Text>
              </View>
            )}
          </View>
          <Text style={styles.lawSubtitle}>
            SFS {item.sfsNumber} · {lawSize(item)}
          </Text>
          <Text style={styles.metadataText}>Ändrad {item.lastAmended}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title="Lagar" subtitle="Svensk lagsamling för insolvensrätt" />
      <View>
        <ScrollView
          horizontal
          style={styles.chipScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {(['Alla', ...LAW_CATEGORIES] as const).map((name) => {
            const selected = category === name;
            return (
              <TouchableOpacity
                key={name}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategory(name)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        style={styles.list}
        data={visibleLaws}
        renderItem={renderLawItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  chipSelected: {
    backgroundColor: colors.greenAction,
    borderColor: colors.greenAction,
  },
  chipText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: colors.ink,
  },
  chipTextSelected: {
    color: colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.md,
  },
  newsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenTint,
    borderWidth: 1,
    borderColor: colors.greenTintBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  newsBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  newsBannerLink: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenText,
  },
  lawCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  lawCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawCardContent: {
    flex: 1,
  },
  lawTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  lawTitle: {
    flexShrink: 1,
    fontSize: 19,
    lineHeight: 25,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  updatedBadge: {
    backgroundColor: '#d8f0e6',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  updatedBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenText,
    letterSpacing: 0.3,
  },

  lawSubtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    fontWeight: typography.weights.regular,
    color: colors.mutedText,
  },
  lawMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    fontWeight: typography.weights.regular,
    color: colors.weakText,
  },
});
