import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import { BookmarksProvider } from '../src/contexts/BookmarksContext';
import { NotesProvider } from '../src/contexts/NotesContext';
import { colors } from '../src/theme/theme';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'OpenSans_400Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
          'OpenSans_500Medium': require('../assets/fonts/OpenSans-Medium.ttf'),
          'OpenSans_600SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
          'OpenSans_700Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
          'OpenSans_800ExtraBold': require('../assets/fonts/OpenSans-ExtraBold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
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
      <BookmarksProvider>
        <NotesProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="law/[id]" options={{ presentation: 'card', headerShown: true, title: 'Lag' }} />
          </Stack>
        </NotesProvider>
      </BookmarksProvider>
    </GestureHandlerRootView>
  );
}
