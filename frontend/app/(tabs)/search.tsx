import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  TouchableOpacity,
  Keyboard,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts, sectionLabel } from '../../src/data/legalTexts';
import PageHeader from '../../src/components/PageHeader';
import { getShortLawName } from '../../src/data/lawShortNames';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../../src/theme/theme';

// Senaste sökningar sparas bara på enheten (EJU-193)
const RECENT_SEARCHES_KEY = '@insolvio_recent_searches';
const MAX_RECENT_SEARCHES = 5;

// Förkortningar som gör att "LAS 7 §" söker paragraf 7 i just den lagen
const LAW_ABBREVIATIONS: Record<string, string> = {
  las: 'sfs-1982-80',
  abl: 'sfs-2005-551',
  kl: 'sfs-1987-672',
};

const SEARCH_EXAMPLES = [
  { query: '5 §', description: 'Paragraf, i alla lagar' },
  { query: '3 kap.', description: 'Kapitel, öppnas direkt' },
  { query: 'LAS 7 §', description: 'Lag och paragraf, hoppar direkt dit' },
];

type SearchResult = {
  lawId: string;
  lawTitle: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  sectionNumber: number;
  sectionLabel: string;
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

  // "Sök i": null = alla lagar
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [scopeLawId, setScopeLawId] = useState<string | null>(null);
  const [scopeModalVisible, setScopeModalVisible] = useState(false);
  const scopeLawTitle = scopeLawId
    ? getShortLawName(scopeLawId, legalTexts.find((l) => l.id === scopeLawId)?.title ?? '')
    : 'Alla lagar';

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((stored) => {
        if (stored) setRecentSearches(JSON.parse(stored));
      })
      .catch((error) => console.error('Error loading recent searches:', error));
  }, []);

  const persistRecentSearches = (list: string[]) => {
    setRecentSearches(list);
    AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list)).catch((error) =>
      console.error('Error saving recent searches:', error)
    );
  };

  const rememberSearch = (raw: string) => {
    const value = raw.trim();
    if (value.length < 2) return;
    const withoutDuplicate = recentSearches.filter((q) => q.toLowerCase() !== value.toLowerCase());
    persistRecentSearches([value, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES));
  };

  const runSearch = (value: string) => {
    setSearchQuery(value);
    rememberSearch(value);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    let query = searchQuery.toLowerCase().trim();

    // "LAS 7 §": förkortning först i frågan begränsar sökningen till den lagen
    let effectiveScopeLawId = scopeLawId;
    const abbreviation = query.match(/^([a-zåäö]+)\s+(.*)$/);
    if (abbreviation && LAW_ABBREVIATIONS[abbreviation[1]]) {
      effectiveScopeLawId = LAW_ABBREVIATIONS[abbreviation[1]];
      query = abbreviation[2].trim();
      if (!query) return [];
    }

    // Check if it's a section number search (e.g., "5 §" or "§5")
    const sectionMatch = query.match(/§?\s*(\d+)(?:\s*([a-z])(?![a-zåäö]))?\s*§?/);
    const sectionNumber = sectionMatch ? parseInt(sectionMatch[1]) : null;
    const sectionSuffix = sectionMatch && sectionMatch[2] ? sectionMatch[2] : null;

    // Check if it's a chapter search (e.g., "3 kap" or "kap 3")
    const chapterMatch = query.match(/(?:kap\.?\s*(\d+)|([\d]+)\s*kap\.?)/);
    const chapterNumber = chapterMatch ? parseInt(chapterMatch[1] || chapterMatch[2]) : null;

    legalTexts.filter((law) => !effectiveScopeLawId || law.id === effectiveScopeLawId).forEach((law) => {
      law.chapters.forEach((chapter) => {
        // Chapter number match
        if (chapterNumber && chapter.number === chapterNumber) {
          chapter.sections.forEach((section) => {
            results.push({
              lawId: law.id,
              lawTitle: getShortLawName(law.id, law.title),
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              sectionId: section.id,
              sectionNumber: section.number,
              sectionLabel: sectionLabel(section),
              sectionText: section.text,
              matchType: 'chapter',
            });
          });
          return;
        }

        chapter.sections.forEach((section) => {
          // Section number match
          if (sectionNumber && section.number === sectionNumber && (!sectionSuffix || section.suffix === sectionSuffix)) {
            results.push({
              lawId: law.id,
              lawTitle: getShortLawName(law.id, law.title),
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              sectionId: section.id,
              sectionNumber: section.number,
              sectionLabel: sectionLabel(section),
              sectionText: section.text,
              matchType: 'section',
            });
            return;
          }

          // Keyword search in text
          if (section.text.toLowerCase().includes(query)) {
            results.push({
              lawId: law.id,
              lawTitle: getShortLawName(law.id, law.title),
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              sectionId: section.id,
              sectionNumber: section.number,
              sectionLabel: sectionLabel(section),
              sectionText: section.text,
              matchType: 'keyword',
            });
          }
        });
      });
    });

    return results;
  }, [searchQuery, scopeLawId]);

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
        onPress={() => {
          rememberSearch(searchQuery);
          router.push(`/law/${item.lawId}?section=${item.sectionId}`);
        }}
      >
        <View style={styles.resultLocation}>
          <Text style={styles.locationText}>
            {legalTexts.find((l) => l.id === item.lawId)?.chaptered === false
              ? item.sectionLabel
              : `${item.chapterTitle} • ${item.sectionLabel}`}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title="Sök" />
      <View style={styles.searchContainer}>
        <View style={[styles.searchRing, searchFocused && styles.searchRingFocused]}>
        <Pressable
          style={[styles.searchBar, searchFocused && styles.searchBarFocused]}
          onPress={() => searchInputRef.current?.focus()}
        >
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Sök nyckelord, § eller kapitel…"
            placeholderTextColor={colors.mutedText}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // När sökordet raderas helt stängs tangentbordet automatiskt
              if (text.length === 0 && searchQuery.length > 0) Keyboard.dismiss();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            blurOnSubmit
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              setSearchFocused(false);
              rememberSearch(searchQuery);
            }}
            onSubmitEditing={() => {
              rememberSearch(searchQuery);
              Keyboard.dismiss();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                Keyboard.dismiss();
              }}
              accessibilityLabel="Rensa sökfältet"
            >
              <Ionicons name="close-circle" size={20} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </Pressable>
        </View>
        <View style={styles.scopeRow}>
          <Text style={styles.scopeLabel}>Sök i</Text>
          <TouchableOpacity
            style={styles.scopeButton}
            onPress={() => {
              Keyboard.dismiss();
              setScopeModalVisible(true);
            }}
            accessibilityLabel={`Sök i: ${scopeLawTitle}`}
          >
            <Text style={styles.scopeButtonText} numberOfLines={1}>
              {scopeLawTitle}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.ink} />
          </TouchableOpacity>
        </View>
        {searchQuery.length > 0 && (
          <Text style={styles.resultCount}>
            {totalResultCount} resultat{lawCount > 0 ? ` i ${lawCount} ${lawCount === 1 ? 'lag' : 'lagar'}` : ''}
          </Text>
        )}
      </View>

      {searchQuery.length === 0 ? (
        <ScrollView
          style={styles.emptyScroll}
          contentContainerStyle={styles.emptyContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {recentSearches.length > 0 && (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Senaste sökningar</Text>
                <TouchableOpacity onPress={() => persistRecentSearches([])} accessibilityLabel="Rensa senaste sökningar">
                  <Text style={styles.clearLink}>Rensa</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.recentRow}
                  onPress={() => runSearch(q)}
                  accessibilityLabel={`Sök igen: ${q}`}
                >
                  <Ionicons name="time-outline" size={20} color={colors.mutedText} />
                  <Text style={styles.recentText} numberOfLines={1}>{q}</Text>
                  <Ionicons name="arrow-up-outline" size={18} color={colors.mutedText} style={styles.recentArrow} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Så kan du söka</Text>
            {SEARCH_EXAMPLES.map((example) => (
              <TouchableOpacity
                key={example.query}
                style={styles.exampleRow}
                onPress={() => runSearch(example.query)}
                accessibilityLabel={`Prova ${example.query}`}
              >
                <View style={styles.exampleChip}>
                  <Text style={styles.exampleChipText}>{example.query}</Text>
                </View>
                <Text style={styles.exampleDescription}>{example.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : searchResults.length === 0 ? (
        <Pressable style={styles.emptyState} onPress={Keyboard.dismiss}>
          <Ionicons name="sad-outline" size={64} color={colors.dividerLight} />
          <Text style={styles.emptyTitle}>Inga resultat</Text>
          <Text style={styles.emptyText}>
            Försök med andra sökord
          </Text>
        </Pressable>
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
                  <Ionicons name="document-text-outline" size={18} color={colors.greenAction} />
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      )}
      <Modal
        visible={scopeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScopeModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setScopeModalVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Sök i</Text>
            <ScrollView>
              {[{ id: null as string | null, title: 'Alla lagar' }, ...legalTexts.map((l) => ({ id: l.id as string | null, title: getShortLawName(l.id, l.title) }))].map((option) => {
                const selected = option.id === scopeLawId;
                return (
                  <TouchableOpacity
                    key={option.id ?? 'alla'}
                    style={styles.modalRow}
                    onPress={() => {
                      setScopeLawId(option.id);
                      setScopeModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalRowText, selected && styles.modalRowTextSelected]}>
                      {option.title}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color={colors.greenAction} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  searchContainer: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  // Dubbel grön ram när fältet är aktivt: tunn yttre ring + tjockare inre ram
  searchRing: {
    padding: 2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchRingFocused: {
    borderColor: colors.greenText,
  },
  searchBarFocused: {
    borderWidth: 2,
    borderColor: colors.greenText,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  scopeLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  scopeButton: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.dividerLight,
    backgroundColor: colors.white,
  },
  scopeButtonText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: colors.ink,
  },
  emptyScroll: {
    flex: 1,
  },
  emptyContent: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  block: {
    gap: spacing.xs,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    ...createHeadingStyle(20),
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  clearLink: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenText,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  recentArrow: {
    transform: [{ rotate: '-45deg' }],
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  exampleChip: {
    width: 92,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ebebeb',
    alignItems: 'center',
  },
  exampleChipText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontWeight: '700',
    color: colors.ink,
  },
  exampleDescription: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '70%',
    backgroundColor: colors.cream,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...createHeadingStyle(20),
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  modalRowText: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  modalRowTextSelected: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.greenText,
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
    fontWeight: '600',
    color: colors.greenText,
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
    fontWeight: '500',
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
    fontWeight: '700',
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
