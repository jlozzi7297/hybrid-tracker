
// Custom web navigation for Hybrid Tracker.
// Keeps the browser tabs consistent with the app's light and dark themes.

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Use blue in light mode and green in dark mode.
  const accent = isDark ? '#8BE28B' : '#2563EB';
  const inactive = isDark ? '#89939F' : '#8290A2';

  // Match each route to an icon.
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: 'home',
    workout: 'barbell',
    nutrition: 'restaurant',
    run: 'walk',
    progress: 'stats-chart',
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        // Selected and unselected icon/label colors.
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: inactive,

        // Custom bottom navigation appearance.
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: isDark ? '#26313D' : '#DCE5F0',
          borderTopWidth: 1,
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
        },

        // Keep labels compact and readable.
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        // Render the appropriate icon for each tab.
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={icons[route.name] ?? 'ellipse'}
            size={focused ? size + 1 : size}
            color={String(color)}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="run" options={{ title: 'Run' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
