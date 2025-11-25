import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BookmarksProvider } from '../src/contexts/BookmarksContext';
import { NotesProvider } from '../src/contexts/NotesContext';

export default function RootLayout() {
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
