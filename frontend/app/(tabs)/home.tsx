import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecentlyViewed } from '../../src/contexts/RecentlyViewedContext';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Visad idag';
  if (diffDays === 1) return 'Visad igår';
  return `Visad för ${diffDays} dagar sedan`;
}

function formatEntryTitle(lawTitle: string, chapterNumber?: number, sectionNumber?: number): string {
  if (chapterNumber && sectionNumber) {
    return `${lawTitle} — ${chapterNumber} kap. ${sectionNumber} §`;
  }
  if (chapterNumber) {
    return `${lawTitle} — ${chapterNumber} kap.`;
  }
  return lawTitle;
}

export default function HomeScreen() {
  const router = useRouter();
  const { recentlyViewed } = useRecentlyViewed();
  const { bookmarks } = useBookmarks();

  const hasActivity = recentlyViewed.length > 0 || bookmarks.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hem</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => router.push('/nyheter')}
            accessibilityLabel="Nyheter"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => router.push('/about')}
            accessibilityLabel="Om Insolvio"
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <Text style={styles.searchPlaceholder}>Sök nyckelord, § eller kapitel ...</Text>
        </TouchableOpacity>

        {!hasActivity && (
          <View style={styles.emptyState}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>IN</Text>
            </View>
            <Text style={styles.emptyTitle}>Välkommen till Insolvio</Text>
            <Text style={styles.emptyText}>
              Sök i lagtexter eller bläddra bland lagarna för att komma igång.
            </Text>
            <Text style={styles.emptySubtext}>
              Dina senaste sökningar och bokmärken visas här så snart du har använt appen.
            </Text>
          </View>
        )}

        {recentlyViewed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Senast visade</Text>
            <View style={styles.list}>
              {recentlyViewed.map((entry) => (
                <TouchableOpacity
                  key={`${entry.lawId}-${entry.timestamp}`}
                  style={styles.listRow}
                  onPress={() =>
                    router.push(
                      entry.sectionId
                        ? `/law/${entry.lawId}?section=${entry.sectionId}`
                        : `/law/${entry.lawId}`
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name="document-text" size={20} color={colors.greenPrimary} />
                  </View>
                  <View style={styles.rowTextContainer}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {formatEntryTitle(entry.lawTitle, entry.chapterNumber, entry.sectionNumber)}
                    </Text>
                    <Text style={styles.rowSubtitle}>{formatRelativeTime(entry.timestamp)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {bookmarks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bokmärken</Text>
            <TouchableOpacity
              style={styles.bookmarksCard}
              onPress={() => router.push('/bookmarks')}
              activeOpacity={0.7}
            >
              <View style={styles.bookmarksCardIcon}>
                <Ionicons name="bookmark" size={20} color={colors.greenPrimary} />
              </View>
              <Text style={styles.bookmarksCardText}>
                {bookmarks.length} sparade bokmärken
              </Text>
              <Text style={styles.bookmarksCardLink}>Visa alla ›</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  title: {
    ...createHeadingStyle(24),
    color: colors.ink,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoBadgeText: {
    ...createHeadingStyle(22),
    color: colors.cream,
  },
  emptyTitle: {
    ...createHeadingStyle(20),
    color: colors.ink,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...createLabelStyle(12),
    color: colors.mutedText,
  },
  list: {
    gap: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#e8f4f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  bookmarksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.deepGreen,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  bookmarksCardIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dividerDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarksCardText: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.cream,
  },
  bookmarksCardLink: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.greenPrimary,
  },
});
