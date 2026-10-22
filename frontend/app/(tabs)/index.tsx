import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts, sectionLabel } from '../../src/data/legalTexts';
import { useRecentlyViewed } from '../../src/contexts/RecentlyViewedContext';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { formatSaved } from '../../src/utils/formatSaved';
import { activeNewsItems } from '../../src/content/newsContent';
import PageHeader from '../../src/components/PageHeader';
import { getShortLawName } from '../../src/data/lawShortNames';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Visad idag';
  if (diffDays === 1) return 'Visad igår';
  return `Visad för ${diffDays} dagar sedan`;
}

// "Lag (1982:80) om anställningsskydd" -> "Lag om anställningsskydd":
// SFS-numret visas i stället som egen rad så att hela namnet syns (EJU-193)
function stripSfs(title: string): string {
  return title.replace(/\s*\(\d{4}:\d+\)/, '');
}

// Titeln visar bara lagens namn; platsen ("2 kap. 7 §") går i andra raden
function formatEntryTitle(lawTitle: string): string {
  return stripSfs(lawTitle);
}

function formatEntryPlace(
  lawId: string,
  chapterNumber?: number,
  sectionNumber?: number,
  sectionId?: string
): string {
  const chaptered = legalTexts.find((l) => l.id === lawId)?.chaptered !== false;
  // Lettered sections ("1 a §") keep their letter in the section id, e.g. kap-1-§-1a
  const letter = sectionId?.match(/§-\d+([a-z]+)$/)?.[1];
  const label = sectionNumber ? `${sectionNumber}${letter ? ' ' + letter : ''} §` : '';
  if (!chaptered) return label;
  if (chapterNumber && sectionNumber) return `${chapterNumber} kap. ${label}`;
  if (chapterNumber) return `${chapterNumber} kap.`;
  return '';
}

export default function HomeScreen() {
  const router = useRouter();
  const { recentlyViewed } = useRecentlyViewed();
  const { bookmarks } = useBookmarks();
  // Senast visade: 3 rader som standard, "Visa alla" visar resten (EJU-193)
  const RECENT_PREVIEW_COUNT = 3;
  const [showAllRecent, setShowAllRecent] = React.useState(false);

  // Senast sparade bokmärket, med lag, plats och text (EJU-193)
  const latestBookmark = React.useMemo(() => {
    if (bookmarks.length === 0) return null;
    const latest = bookmarks.reduce((a, b) => (b.timestamp > a.timestamp ? b : a));
    const law = legalTexts.find((l) => l.id === latest.lawId);
    const chapter = law?.chapters.find((c) => c.id === latest.chapterId);
    const section = chapter?.sections.find((sec) => sec.id === latest.sectionId);
    if (!law || !chapter || !section) return null;
    return {
      lawId: law.id,
      sectionId: section.id,
      lawTitle: getShortLawName(law.id, law.title),
      timestamp: latest.timestamp,
      place: law.chaptered !== false
        ? `${chapter.number}${chapter.numberSuffix ?? ''} kap. ${sectionLabel(section)}`
        : sectionLabel(section),
      text: section.text,
    };
  }, [bookmarks]);

  const hasActivity = recentlyViewed.length > 0 || bookmarks.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader
        title="Hem"
        right={
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => router.push('/about')}
            accessibilityLabel="Om Insolvio"
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.ink} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.navigate('/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <Text style={styles.searchPlaceholder}>Sök nyckelord, § eller kapitel…</Text>
        </TouchableOpacity>

        {activeNewsItems.length > 0 && (
          <TouchableOpacity
            style={styles.newsBanner}
            onPress={() => router.push('/nyheter')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Visa nyheter om uppdaterade lagar"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.greenAction} />
            <View style={styles.newsBannerTextBlock}>
              <Text style={styles.newsBannerTitle}>
                {activeNewsItems.length} {activeNewsItems.length === 1 ? 'lag har' : 'lagar har'} uppdaterats
              </Text>
              <Text style={styles.newsBannerLaws} numberOfLines={1}>
                {activeNewsItems
                  .map((item) => getShortLawName(item.lawId, item.lawTitle))
                  .join(', ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </TouchableOpacity>
        )}

        {!hasActivity && (
          <View style={styles.emptyState}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>i</Text>
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Senast visade</Text>
              {recentlyViewed.length > RECENT_PREVIEW_COUNT && (
                <TouchableOpacity
                  onPress={() => setShowAllRecent((v) => !v)}
                  accessibilityLabel={showAllRecent ? 'Visa färre senast visade' : 'Visa alla senast visade'}
                >
                  <Text style={styles.bookmarksCardLink}>
                    {showAllRecent ? 'Visa färre ‹' : `Visa alla (${recentlyViewed.length}) ›`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.list}>
              {(showAllRecent ? recentlyViewed : recentlyViewed.slice(0, RECENT_PREVIEW_COUNT)).map((entry) => (
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
                    <Ionicons name="document-text" size={20} color={colors.greenAction} />
                  </View>
                  <View style={styles.rowTextContainer}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {getShortLawName(entry.lawId, entry.lawTitle)}
                    </Text>
                    <Text style={styles.rowSubtitle}>
                      {[
                        legalTexts.find((l) => l.id === entry.lawId)?.sfsNumber
                          ? `SFS ${legalTexts.find((l) => l.id === entry.lawId)?.sfsNumber}`
                          : '',
                        formatEntryPlace(entry.lawId, entry.chapterNumber, entry.sectionNumber, entry.sectionId),
                        formatRelativeTime(entry.timestamp),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {bookmarks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Bokmärken</Text>
              <TouchableOpacity
                onPress={() => router.navigate('/bookmarks')}
                accessibilityLabel="Visa alla bokmärken"
              >
                <Text style={styles.bookmarksCardLink}>Visa alla</Text>
              </TouchableOpacity>
            </View>
            {latestBookmark ? (
              <TouchableOpacity
                style={styles.bookmarksCard}
                onPress={() =>
                  router.push(`/law/${latestBookmark.lawId}?section=${latestBookmark.sectionId}`)
                }
                activeOpacity={0.7}
              >
                <View style={styles.bookmarkCardTop}>
                  <Ionicons name="bookmark" size={20} color={colors.greenAction} />
                  <Text style={styles.bookmarksCardText} numberOfLines={1}>
                    {latestBookmark.lawTitle} · {latestBookmark.place}
                  </Text>
                  <Text style={styles.bookmarkSaved}>{formatSaved(latestBookmark.timestamp)}</Text>
                </View>
                <Text style={styles.bookmarkExcerpt} numberOfLines={2}>
                  {latestBookmark.text}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: colors.greenAction,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoBadgeText: {
    ...createHeadingStyle(28),
    color: colors.white,
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
    ...createHeadingStyle(20),
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  newsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#e4efe9',
    borderWidth: 1,
    borderColor: '#cfe3d9',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  newsBannerTextBlock: {
    flex: 1,
    gap: 2,
  },
  newsBannerTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.ink,
  },
  newsBannerLaws: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
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
    fontWeight: '700',
    color: colors.ink,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  bookmarksCard: {
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.dividerLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  bookmarkCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bookmarkSaved: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookmarkTextBlock: {
    flex: 1,
    gap: 2,
  },
  bookmarkPlace: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.mutedText,
  },
  bookmarkExcerpt: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
  },
  bookmarksCardText: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.ink,
  },
  bookmarksCardLink: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenText,
  },
});
