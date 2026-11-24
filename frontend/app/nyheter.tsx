import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../src/components/AppText';
import { useRouter, Stack } from 'expo-router';
import { TextSizeButton, TextSizePopover } from '../src/components/TextSizeControl';
import { activeNewsItems } from '../src/content/newsContent';
import { getAmendmentByNewsId } from '../src/content/lawAmendments';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../src/theme/theme';

export default function NyheterScreen() {
  const router = useRouter();
  const [showTextSize, setShowTextSize] = useState(false);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { fontFamily: typography.fontFamily.bold, color: colors.ink },
          headerTintColor: colors.greenPrimary,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: spacing.md }}>
              <TextSizeButton onPress={() => setShowTextSize((v) => !v)} expanded={showTextSize} />
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.intro}>Senaste lagändringarna i lagar du använder</Text>

        {activeNewsItems.map((item) => {
          const hasAmendmentDetails = !!getAmendmentByNewsId(item.id);

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{item.date}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>NY ÄNDRING</Text>
                </View>
              </View>
              <Text style={styles.lawTitle}>{item.lawTitle}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.linkRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/law/${item.lawId}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.link}>Visa lagtext ›</Text>
                </TouchableOpacity>
                {hasAmendmentDetails && (
                  <TouchableOpacity
                    onPress={() => router.push(`/amendment/${item.id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.link}>Se vad som ändrats ›</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
      {showTextSize && <TextSizePopover onClose={() => setShowTextSize(false)} />}
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
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  link: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.greenPrimary,
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
