import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { legalTexts } from '../../src/data/legalTexts';

export default function BookmarksScreen() {
  const { bookmarks, removeBookmark } = useBookmarks();
  const router = useRouter();

  // Get full details for each bookmark
  const bookmarkDetails = bookmarks.map((bookmark) => {
    const law = legalTexts.find((l) => l.id === bookmark.lawId);
    if (!law) return null;

    const chapter = law.chapters.find((c) => c.id === bookmark.chapterId);
    if (!chapter) return null;

    const section = chapter.sections.find((s) => s.id === bookmark.sectionId);
    if (!section) return null;

    return {
      ...bookmark,
      lawTitle: law.title,
      chapterTitle: chapter.title,
      sectionNumber: section.number,
      sectionText: section.text,
    };
  }).filter(Boolean);

  const renderBookmark = ({ item }: { item: any }) => (
    <View style={styles.bookmarkCard}>
      <TouchableOpacity
        style={styles.bookmarkContent}
        onPress={() => router.push(`/law/${item.lawId}?section=${item.sectionId}`)}
      >
        <View style={styles.bookmarkHeader}>
          <Ionicons name="bookmark" size={20} color="#2563eb" />
          <Text style={styles.lawTitle}>{item.lawTitle}</Text>
        </View>
        <View style={styles.bookmarkLocation}>
          <Text style={styles.locationText}>
            {item.chapterTitle} • {item.sectionNumber} §
          </Text>
        </View>
        <Text style={styles.sectionText} numberOfLines={3}>
          {item.sectionText}
        </Text>
        <Text style={styles.timestamp}>
          Sparad: {new Date(item.timestamp).toLocaleDateString('sv-SE')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeBookmark(item.sectionId)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {bookmarkDetails.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Inga bokmärken</Text>
          <Text style={styles.emptyText}>
            Tryck på bokmärkesikonen i en lagtext för att spara den här
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkDetails}
          renderItem={renderBookmark}
          keyExtractor={(item) => item.sectionId}
          contentContainerStyle={styles.listContent}
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
  listContent: {
    padding: 16,
  },
  bookmarkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bookmarkContent: {
    flex: 1,
    padding: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lawTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
    flex: 1,
  },
  bookmarkLocation: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
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
