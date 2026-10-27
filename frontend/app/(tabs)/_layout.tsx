import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PlatformPressable } from 'expo-router/react-navigation';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { colors, typography } from '../../src/theme/theme';

// Ikonerna ska ligga högre upp i flikraden, som i Sofies design (bild 1)
const TAB_BAR_ICON_OFFSET = 4;

// Flikknapp med en 2 px grön indikator överst på den aktiva fliken, så att
// aktiv flik inte bara visas med färg (EJU-193).
// (props typad som any: pressColor-typen skiljer sig mellan expo-router och react-navigation)
function TabButton(props: any) {
  // React Navigation skickar aria-selected (äldre versioner: accessibilityState)
  const selected = props['aria-selected'] ?? props.accessibilityState?.selected;
  return (
    <PlatformPressable {...props}>
      {selected ? <View style={styles.indicator} /> : null}
      {props.children}
    </PlatformPressable>
  );
}

export default function TabLayout() {
  const { bookmarks } = useBookmarks();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenAction,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarButton: (props) => <TabButton {...props} />,
        tabBarBadgeStyle: {
          backgroundColor: colors.greenAction,
          color: colors.white,
          fontFamily: typography.fontFamily.bold,
          fontWeight: '700',
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopWidth: 1,
          borderTopColor: colors.dividerLight,
          height: 80,
          paddingBottom: 12,
          paddingTop: 0,
          // Flikarna dras in från skärmkanten (Sofies feedback på EJU-193)
          paddingHorizontal: 32,
        },
        // Bara den aktiva flikens text är fet och mörk; övriga är normala och grå
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={{
              fontSize: 13,
              marginTop: 4,
              fontFamily: typography.fontFamily.regular,
              fontWeight: focused ? typography.weights.bold : typography.weights.regular,
              color: focused ? colors.ink : colors.mutedText,
            }}
          >
            {children}
          </Text>
        ),
        tabBarIconStyle: {
          marginBottom: 0,
          // Ikonen flyttas ner från kanten här (inte via paddingTop), så att
          // indikatorn kan ligga inuti knappen och inte klipps på Android
          marginTop: TAB_BAR_ICON_OFFSET,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hem',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="laws"
        options={{
          title: 'Lagar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Sök',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bokmärken',
          tabBarBadge: bookmarks.length > 0 ? bookmarks.length : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: 0,
    // Kort linje över ikonen, som i designen (inte hela flikens bredd)
    alignSelf: 'center',
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.greenAction,
  },
});
