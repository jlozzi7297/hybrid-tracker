
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

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
    // Makes keyboard controls available throughout the app.
    <KeyboardProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </ThemeProvider>
    </KeyboardProvider>
  );}
