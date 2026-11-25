import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../src/components/AppText';
import { homeContent } from '../src/content/homeContent';
import { Stack } from 'expo-router';
import { TextSizeButton, TextSizePopover } from '../src/components/TextSizeControl';
import AppearanceButton from '../src/components/AppearanceButton';
import HeaderTitle from '../src/components/HeaderTitle';
import { typography, spacing, borderRadius, createHeadingStyle, ThemeColors } from '../src/theme/theme';
import { useTheme } from '../src/theme/useTheme';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showTextSize, setShowTextSize] = useState(false);
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { fontFamily: typography.fontFamily.bold, color: colors.ink },
          headerTitle: (props) => <HeaderTitle {...props} />,
          headerTintColor: colors.greenPrimary,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: spacing.md }}>
              <AppearanceButton />
              <TextSizeButton onPress={() => setShowTextSize((v) => !v)} expanded={showTextSize} />
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {homeContent.sections.map((section, index) => (
          <View key={index} style={styles.infoSection}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
      {showTextSize && <TextSizePopover onClose={() => setShowTextSize(false)} />}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 20,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  sectionHeading: {
    ...createHeadingStyle(18),
    color: colors.ink,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
  },
});
