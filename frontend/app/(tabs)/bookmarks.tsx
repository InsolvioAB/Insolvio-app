import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { legalTexts } from '../../src/data/legalTexts';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../../src/theme/theme';

export default function BookmarksScreen() {
  const { bookmarks, removeBookmark } = useBookmarks();
  const router = useRouter();

  const handleDeleteBookmark = (sectionId: string) => {
    Alert.alert(
      'Ta bort bokmärke?',
      'Bokmärket tas bort permanent.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => removeBookmark(sectionId),
        },
      ]
    );
  };

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

  const renderBookmark = ({ item }: { item: any }) => {
    if (!item) return null;
    
    return (
      <View style={styles.bookmarkCard}>
        <TouchableOpacity
          style={styles.bookmarkContent}
          onPress={() => router.push(`/law/${item.lawId}?section=${item.sectionId}`)}
        >
          <View style={styles.bookmarkHeader}>
            <Ionicons name="bookmark" size={20} color={colors.greenPrimary} />
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
          onPress={() => handleDeleteBookmark(item.sectionId)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {bookmarkDetails.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color={colors.dividerLight} />
          <Text style={styles.emptyTitle}>Inga bokmärken</Text>
          <Text style={styles.emptyText}>
            Tryck på bokmärkesikonen i en lagtext för att spara den här
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkDetails}
          renderItem={renderBookmark}
          keyExtractor={(item) => item?.sectionId || Math.random().toString()}
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
    backgroundColor: colors.cream,
  },
  listContent: {
    padding: spacing.md,
  },
  bookmarkCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  bookmarkContent: {
    flex: 1,
    padding: spacing.md,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lawTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.greenPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  bookmarkLocation: {
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.mutedText,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.weakText,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: '#fee2e2',
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
