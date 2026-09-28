import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts } from '../../src/data/legalTexts';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

// Placeholder list of recently-amended law IDs, pending real per-law
// amendment tracking in the law data itself.
const RECENTLY_UPDATED_LAW_IDS = new Set(['sfs-1987-672', 'sfs-2005-551']);

export default function HomeScreen() {
  const router = useRouter();

  const renderLawItem = ({ item }: { item: typeof legalTexts[0] }) => (
    <TouchableOpacity
      style={styles.lawCard}
      onPress={() => router.push(`/law/${item.id}`)}
    >
      <View style={styles.lawCardHeader}>
        <Ionicons name="document-text" size={24} color={colors.greenPrimary} />
        <View style={styles.lawCardContent}>
          <View style={styles.lawTitleRow}>
            <Text style={styles.lawTitle}>{item.title}</Text>
            {RECENTLY_UPDATED_LAW_IDS.has(item.id) && (
              <View style={styles.updatedBadge}>
                <Text style={styles.updatedBadgeText}>UPPDATERAD</Text>
              </View>
            )}
          </View>
          <Text style={styles.lawSubtitle}>SFS {item.sfsNumber}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
      </View>
      <View style={styles.lawMetadata}>
        <Text style={styles.metadataText}>
          {item.chapters.length} kapitel
        </Text>
        <Text style={styles.metadataText}>•</Text>
        <Text style={styles.metadataText}>
          Ändrad: {item.lastAmended}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konkursadministration</Text>
        <Text style={styles.headerSubtitle}>
          Svensk lagsamling för konkursförvaltning
        </Text>
      </View>
      <FlatList
        style={styles.list}
        data={legalTexts}
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
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  headerTitle: {
    ...createHeadingStyle(24),
    color: colors.ink,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  lawCard: {
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
  lawCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lawCardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  lawTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  lawTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: typography.weights.semiBold,
    color: colors.ink,
  },
  updatedBadge: {
    backgroundColor: '#d8f0e6',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  updatedBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.darkText,
    letterSpacing: 0.3,
  },
  lawSubtitle: {
    fontSize: 13,
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
