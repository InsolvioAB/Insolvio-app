import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import { BookmarksProvider } from '../src/contexts/BookmarksContext';
import { NotesProvider } from '../src/contexts/NotesContext';
import { RecentlyViewedProvider } from '../src/contexts/RecentlyViewedContext';
import { colors } from '../src/theme/theme';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        console.log('🔤 Starting to load Outfit fonts...');
        await Font.loadAsync({
          'Outfit': require('../assets/fonts/Outfit-Variable.ttf'),
        });
        console.log('✅ Outfit fonts loaded successfully!');
        setFontsLoaded(true);
      } catch (error) {
        console.error('❌ Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.greenPrimary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <BookmarksProvider>
        <NotesProvider>
          <RecentlyViewedProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="law/[id]" options={{ presentation: 'card', headerShown: true, title: 'Lag' }} />
            <Stack.Screen name="about" options={{ presentation: 'card', headerShown: true, title: 'Om Insolvio' }} />
            <Stack.Screen name="nyheter" options={{ presentation: 'card', headerShown: true, title: 'Nyheter' }} />
            <Stack.Screen name="amendment/[newsId]" options={{ presentation: 'card', headerShown: true, title: 'Jämför ändring' }} />
          </Stack>
          </RecentlyViewedProvider>
        </NotesProvider>
      </BookmarksProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
