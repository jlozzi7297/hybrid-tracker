
// Browser-only Run screen.
// The native version retains the full GPS tracking and map functionality.

import { Colors } from '@/constants/theme';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function RunScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Running
        </Text>

        <Text style={[styles.subtitle, { color: colors.text }]}>
          Track your runs and monitor your progress.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Text style={[styles.icon, { color: isDark ? '#8BE28B' : '#2563EB' }]}>
            🏃
          </Text>

          <Text style={[styles.cardTitle, { color: colors.text }]}>
            GPS Run Tracking
          </Text>

          <Text style={[styles.description, { color: colors.text }]}>
            Your full GPS tracking experience is available in the
            iPhone version of Hybrid Tracker.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingTop: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    opacity: 0.7,
  },
  card: {
    marginTop: 28,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
  },
  icon: {
    fontSize: 42,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    opacity: 0.75,
    maxWidth: 400,
  },
});
