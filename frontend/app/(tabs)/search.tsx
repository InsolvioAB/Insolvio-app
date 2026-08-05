import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
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

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
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

    return results.slice(0, 50); // Limit to 50 results
  }, [searchQuery]);

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const highlightedText = item.sectionText.length > 200
      ? `${item.sectionText.substring(0, 200)}...`
      : item.sectionText;

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => router.push(`/law/${item.lawId}?section=${item.sectionId}`)}
      >
        <View style={styles.resultHeader}>
          <Ionicons name="document-text-outline" size={20} color={colors.greenPrimary} />
          <Text style={styles.resultLawTitle}>{item.lawTitle}</Text>
        </View>
        <View style={styles.resultLocation}>
          <Text style={styles.locationText}>
            {item.chapterTitle} • {item.sectionNumber} §
          </Text>
        </View>
        <Text style={styles.resultText} numberOfLines={3}>
          {highlightedText}
        </Text>
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
            {searchResults.length} resultat
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
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item, index) => `${item.sectionId}-${index}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
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
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultLawTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.greenPrimary,
    marginLeft: spacing.sm,
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
