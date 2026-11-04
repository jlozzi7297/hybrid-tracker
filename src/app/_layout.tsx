// Enables native swipe gestures throughout the app.
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Provides keyboard management throughout the app.
import { KeyboardProvider } from 'react-native-keyboard-controller';

import AppTabs from '@/components/app-tabs';
import { initializeDatabase } from '@/database/database';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Initialize SQLite on native platforms only for now.
useEffect(() => {
  if (Platform.OS !== 'web') {
    initializeDatabase().catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }
}, []);

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
    <KeyboardProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </ThemeProvider>
    </KeyboardProvider>
     </GestureHandlerRootView>
  );}
