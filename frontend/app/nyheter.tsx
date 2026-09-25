import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { newsItems } from '../src/content/newsContent';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../src/theme/theme';

export default function NyheterScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.intro}>Senaste lagändringarna i lagar du använder</Text>

        {newsItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{item.date}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NY ÄNDRING</Text>
              </View>
            </View>
            <Text style={styles.lawTitle}>{item.lawTitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <TouchableOpacity
              onPress={() => router.push(`/law/${item.lawId}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.link}>Visa lagtext ›</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.watchBanner}>
          <Ionicons name="notifications-outline" size={20} color={colors.greenHover} />
          <Text style={styles.watchBannerText}>
            Bevaka en lag du bokmärkt för att få en avisering nästa gång den ändras.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  intro: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    ...createHeadingStyle(12),
    color: colors.greenPrimary,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#d8f0e6',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.darkText,
    letterSpacing: 0.3,
  },
  lawTitle: {
    ...createHeadingStyle(18),
    color: colors.ink,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  link: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.greenPrimary,
    marginTop: spacing.xs,
  },
  watchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.deepGreen,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  watchBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.cream,
  },
});
