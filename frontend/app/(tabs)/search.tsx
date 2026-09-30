import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts } from '../../src/data/legalTexts';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../../src/theme/theme';

type SearchResult = {
  lawId: string;
  lawTitle: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  sectionNumber: number;
  sectionText: string;
  matchType: 'keyword' | 'section' | 'chapter';
};

// Results grouped by law, for the collapsible sections in the results list.
// Shaped for React Native's SectionList: `data` is what that law's section
// actually renders (the full match list when expanded, empty when
// collapsed -- see `visibleSections` below), while `allResults` always holds
// every match for that law so the count and "show more" logic have the true
// total to work with.
type SearchResultGroup = {
  lawId: string;
  lawTitle: string;
  data: SearchResult[];
  allResults: SearchResult[];
};

// Laws are shown expanded by default when there are only a few of them (a
// narrow search), and collapsed by default when a broad keyword spreads
// across many laws -- so a search like "lön" doesn't dump 50+ rows on you
// at once, while a specific search still shows its handful of results
// immediately.
const AUTO_EXPAND_GROUP_THRESHOLD = 3;
// Within an expanded law, only the first N matches render until the user
// asks to see the rest -- keeps a single very common keyword from pushing
// every other law's results off screen.
const RESULTS_PER_LAW_CAP = 20;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A snippet of `text` centered on the first occurrence of `query` (if any),
// so the matched word is actually visible instead of always showing the
// start of a section that might be hundreds of characters before the match.
function getSnippet(text: string, query: string, radius = 90): string {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return text.length > 200 ? `${text.substring(0, 200)}...` : text;
  }
  const matchIndex = text.toLowerCase().indexOf(trimmedQuery.toLowerCase());
  if (matchIndex === -1) {
    return text.length > 200 ? `${text.substring(0, 200)}...` : text;
  }
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + trimmedQuery.length + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.substring(start, end)}${suffix}`;
}

// Renders `text` as a sequence of <Text> spans, with every case-insensitive
// occurrence of `query` wrapped in a highlighted span.
function HighlightedText({ text, query, style, highlightStyle, numberOfLines }: {
  text: string;
  query: string;
  style: any;
  highlightStyle: any;
  numberOfLines?: number;
}) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi'));
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <Text key={i} style={highlightStyle}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  // Which law groups the user has manually expanded/collapsed, and which
  // they've asked to fully show past the per-law cap -- tracked as
  // overrides on top of the query's default state (see `defaultExpandedLawIds`
  // below) rather than as the expanded state itself, so a brand new search
  // can reset cleanly (see the render-time reset right below) without an
  // effect.
  const [toggledLawIds, setToggledLawIds] = useState<Set<string>>(new Set());
  const [fullyShownLawIds, setFullyShownLawIds] = useState<Set<string>>(new Set());
  // Remembers which query the two sets above belong to, so they can be
  // cleared the moment a *new* query is detected. Adjusting state during
  // render like this (rather than in a useEffect) is React's recommended
  // way to reset state when an input changes -- see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [toggleStateQuery, setToggleStateQuery] = useState(searchQuery);
  if (toggleStateQuery !== searchQuery) {
    setToggleStateQuery(searchQuery);
    setToggledLawIds(new Set());
    setFullyShownLawIds(new Set());
  }
  const router = useRouter();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase().trim();

    // Check if it's a section number search (e.g., "5 §" or "§5")
    const sectionMatch = query.match(/§?\s*(\d+)\s*§?/);
    const sectionNumber = sectionMatch ? parseInt(sectionMatch[1]) : null;

    // Check if it's a chapter search (e.g., "3 kap" or "kap 3")
    const chapterMatch = query.match(/(?:kap\.?\s*(\d+)|([\d]+)\s*kap\.?)/);
    const chapterNumber = chapterMatch ? parseInt(chapterMatch[1] || chapterMatch[2]) : null;

    legalTexts.forEach((law) => {
      law.chapters.forEach((chapter) => {
        // Chapter number match
        if (chapterNumber && chapter.number === chapterNumber) {
          chapter.sections.forEach((section) => {
            results.push({
              lawId: law.id,
              lawTitle: law.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              sectionId: section.id,
              sectionNumber: section.number,
              sectionText: section.text,
              matchType: 'chapter',
            });
          });
          return;
        }

        chapter.sections.forEach((section) => {
          // Section number match
          if (sectionNumber && section.number === sectionNumber) {
            results.push({
              lawId: law.id,
              lawTitle: law.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              sectionId: section.id,
              sectionNumber: section.number,
              sectionText: section.text,
              matchType: 'section',
            });
            return;
          }

          // Keyword search in text
          if (section.text.toLowerCase().includes(query)) {
            results.push({
              lawId: law.id,
              lawTitle: law.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              sectionId: section.id,
              sectionNumber: section.number,
              sectionText: section.text,
              matchType: 'keyword',
            });
          }
        });
      });
    });

    return results;
  }, [searchQuery]);

  // Group the flat match list by law, most matches first, so results from
  // the same law aren't scattered as repeated rows throughout the list.
  const groupedResults = useMemo(() => {
    const groups: SearchResultGroup[] = [];
    const groupsByLawId: Record<string, SearchResultGroup> = {};

    searchResults.forEach((result) => {
      let group = groupsByLawId[result.lawId];
      if (!group) {
        group = { lawId: result.lawId, lawTitle: result.lawTitle, data: [], allResults: [] };
        groupsByLawId[result.lawId] = group;
        groups.push(group);
      }
      group.allResults.push(result);
    });

    groups.sort((a, b) => b.allResults.length - a.allResults.length);
    return groups;
  }, [searchResults]);

  // A handful of laws start fully expanded by default; a broad search
  // (many laws matched) starts collapsed so it doesn't dump everything on
  // screen at once. `toggledLawIds` then flips individual laws away from
  // whichever default they started at.
  const defaultExpandedLawIds = useMemo(() => {
    if (groupedResults.length > 0 && groupedResults.length <= AUTO_EXPAND_GROUP_THRESHOLD) {
      return new Set(groupedResults.map((g) => g.lawId));
    }
    return new Set<string>();
  }, [groupedResults]);

  const isLawExpanded = (lawId: string) => {
    const isDefaultExpanded = defaultExpandedLawIds.has(lawId);
    return toggledLawIds.has(lawId) ? !isDefaultExpanded : isDefaultExpanded;
  };

  const toggleLawExpanded = (lawId: string) => {
    setToggledLawIds((prev) => {
      const next = new Set(prev);
      if (next.has(lawId)) {
        next.delete(lawId);
      } else {
        next.add(lawId);
      }
      return next;
    });
  };

  const showAllForLaw = (lawId: string) => {
    setFullyShownLawIds((prev) => new Set(prev).add(lawId));
  };

  // What each section actually renders: nothing while collapsed, otherwise
  // every match up to the per-law cap (or all of them once the user has
  // tapped "Visa fler" for that law).
  const visibleSections = useMemo(() => {
    return groupedResults.map((group) => {
      if (!isLawExpanded(group.lawId)) {
        return { ...group, data: [] };
      }
      const showAll = fullyShownLawIds.has(group.lawId);
      return {
        ...group,
        data: showAll ? group.allResults : group.allResults.slice(0, RESULTS_PER_LAW_CAP),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedResults, defaultExpandedLawIds, toggledLawIds, fullyShownLawIds]);

  const totalResultCount = searchResults.length;
  const lawCount = groupedResults.length;

  const renderSearchResult = (item: SearchResult) => {
    const snippet = getSnippet(item.sectionText, searchQuery);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => router.push(`/law/${item.lawId}?section=${item.sectionId}`)}
      >
        <View style={styles.resultLocation}>
          <Text style={styles.locationText}>
            {item.chapterTitle} • {item.sectionNumber} §
          </Text>
        </View>
        <HighlightedText
          text={snippet}
          query={searchQuery}
          style={styles.resultText}
          highlightStyle={styles.resultTextHighlight}
          numberOfLines={3}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Sök nyckelord, § eller kapitel..."
            placeholderTextColor={colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Text style={styles.resultCount}>
            {totalResultCount} resultat{lawCount > 0 ? ` i ${lawCount} ${lawCount === 1 ? 'lag' : 'lagar'}` : ''}
          </Text>
        )}
      </View>

      {searchQuery.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={colors.dividerLight} />
          <Text style={styles.emptyTitle}>Sök i lagtexter</Text>
          <Text style={styles.emptyText}>
            Sök efter nyckelord, paragrafnummer (t.ex. "5 §") eller kapitel (t.ex. "3 kap")
          </Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sad-outline" size={64} color={colors.dividerLight} />
          <Text style={styles.emptyTitle}>Inga resultat</Text>
          <Text style={styles.emptyText}>
            Försök med andra sökord
          </Text>
        </View>
      ) : (
        <SectionList
          sections={visibleSections}
          keyExtractor={(item) => `${item.lawId}-${item.sectionId}`}
          renderItem={({ item }) => renderSearchResult(item)}
          renderSectionHeader={({ section }) => {
            const isExpanded = isLawExpanded(section.lawId);
            return (
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => toggleLawExpanded(section.lawId)}
              >
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="document-text-outline" size={18} color={colors.greenPrimary} />
                  <Text style={styles.groupHeaderTitle}>{section.lawTitle}</Text>
                </View>
                <View style={styles.groupHeaderRight}>
                  <Text style={styles.groupHeaderCount}>
                    {section.allResults.length} {section.allResults.length === 1 ? 'träff' : 'träffar'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.mutedText}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          renderSectionFooter={({ section }) => {
            const isExpanded = isLawExpanded(section.lawId);
            const isFullyShown = fullyShownLawIds.has(section.lawId);
            const hiddenCount = section.allResults.length - RESULTS_PER_LAW_CAP;
            if (!isExpanded || isFullyShown || hiddenCount <= 0) return null;
            return (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => showAllForLaw(section.lawId)}
              >
                <Text style={styles.showMoreText}>Visa {hiddenCount} till</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  searchContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  resultCount: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  resultsList: {
    padding: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  groupHeaderTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.greenPrimary,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  groupHeaderCount: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  showMoreText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.greenPrimary,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginHorizontal: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  resultLocation: {
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.mutedText,
  },
  resultText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
    lineHeight: 20,
  },
  resultTextHighlight: {
    fontFamily: typography.fontFamily.bold,
    backgroundColor: '#fff3b0',
    color: colors.ink,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...createHeadingStyle(18),
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
