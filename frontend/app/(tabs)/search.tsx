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
          <Ionicons name="document-text-outline" size={20} color="#2563eb" />
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
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Sök nyckelord, § eller kapitel..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
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
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Sök i lagtexter</Text>
          <Text style={styles.emptyText}>
            Sök efter nyckelord, paragrafnummer (t.ex. "5 §") eller kapitel (t.ex. "3 kap")
          </Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sad-outline" size={64} color="#d1d5db" />
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
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  resultCount: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLawTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  resultLocation: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
