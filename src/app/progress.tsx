
import { Colors } from '@/constants/theme';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

const weeklyActivity = [
  { day: 'M', workouts: 1 },
  { day: 'T', workouts: 1 },
  { day: 'W', workouts: 0 },
  { day: 'T', workouts: 1 },
  { day: 'F', workouts: 0 },
  { day: 'S', workouts: 1 },
  { day: 'S', workouts: 0 },
];

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const styles = createStyles(colors);
  const accent = colors.accent;

  const [currentWeight, setCurrentWeight] = useState('180');
  const [startingWeight, setStartingWeight] = useState('185');
  const [weightHistory, setWeightHistory] = useState<
    { id: string; weight: number }[]
  >([
    { id: '1', weight: 185 },
    { id: '2', weight: 183 },
    { id: '3', weight: 180 },
  ]);

  const current = Number(currentWeight);
  const starting = Number(startingWeight);
  const change = starting - current;

  function logWeight() {
    const weight = Number(currentWeight);

    if (
      !currentWeight.trim() ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      return;
    }

    setWeightHistory((history) => [
      ...history,
      { id: `${Date.now()}`, weight },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>Small steps. Real progress.</Text>

      <View style={styles.weightCard}>
        <Text style={styles.cardLabel}>CURRENT WEIGHT</Text>

        <View style={styles.weightRow}>
          <Text style={styles.weightNumber}>
            {currentWeight || '—'}
          </Text>
          <Text style={styles.weightUnit}>lb</Text>
        </View>

        <Text style={[styles.changeText, { color: accent }]}>
          {Number.isFinite(change)
            ? `${change >= 0 ? '−' : '+'}${Math.abs(change).toFixed(1)} lb since starting`
            : 'Enter your starting weight'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>Starting weight (lb)</Text>
        <TextInput
          style={styles.input}
          value={startingWeight}
          onChangeText={setStartingWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 185"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.inputLabel}>Current weight (lb)</Text>
        <TextInput
          style={styles.input}
          value={currentWeight}
          onChangeText={setCurrentWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 180"
          placeholderTextColor={colors.textSecondary}
        />

        <Pressable
          style={[styles.primaryButton, { backgroundColor: accent }]}
          onPress={logWeight}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: scheme === 'dark' ? '#0B0F14' : '#FFFFFF' },
            ]}
          >
            Log weight
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>This Week</Text>

      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.cardLabel}>WORKOUT ACTIVITY</Text>
          <Text style={[styles.activityCount, { color: accent }]}>
            4 / 7 days
          </Text>
        </View>

        <View style={styles.weekRow}>
          {weeklyActivity.map((item, index) => (
            <View key={index} style={styles.dayColumn}>
              <View
                style={[
                  styles.dayCircle,
                  item.workouts === 1 && {
                    backgroundColor: accent,
                    borderColor: accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayCheck,
                    item.workouts === 1 && styles.dayCheckActive,
                  ]}
                >
                  {item.workouts === 1 ? '✓' : '·'}
                </Text>
              </View>
              <Text style={styles.dayLabel}>{item.day}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.muted}>
          Example activity — connect your workout history to update this.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Weight History</Text>

      <View style={styles.historyCard}>
        {weightHistory.map((entry, index) => (
          <View
            key={entry.id}
            style={[
              styles.historyRow,
              index === weightHistory.length - 1 && {
                borderBottomWidth: 0,
              },
            ]}
          >
            <View>
              <Text style={styles.historyTitle}>
                Weight entry {index + 1}
              </Text>
              <Text style={styles.muted}>Logged this session</Text>
            </View>
            <Text style={[styles.historyWeight, { color: accent }]}>
              {entry.weight.toFixed(1)} lb
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.milestoneCard}>
        <Text style={styles.milestoneEmoji}>🏆</Text>
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneTitle}>Keep showing up</Text>
          <Text style={styles.muted}>
            Your consistency matters more than any single number.
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Sample activity and weight history are for demonstration. Data resets
        when the app reloads.
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: (typeof Colors)['light'] | (typeof Colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingTop: 30,
      paddingBottom: 40,
      gap: 16,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: -10,
    },
    weightCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      gap: 12,
    },
    cardLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
    },
    weightRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 7,
    },
    weightNumber: {
      color: colors.text,
      fontSize: 42,
      fontWeight: '800',
    },
    weightUnit: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    changeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      padding: 12,
      fontSize: 14,
    },
    primaryButton: {
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    primaryButtonText: {
      fontWeight: '800',
      fontSize: 14,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    activityCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 18,
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    activityCount: {
      fontSize: 12,
      fontWeight: '700',
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayColumn: {
      alignItems: 'center',
      gap: 8,
    },
    dayCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCheck: {
      color: colors.textSecondary,
      fontSize: 18,
    },
    dayCheckActive: {
      color: '#0B0F14',
      fontWeight: '800',
    },
    dayLabel: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    muted: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
    },
    historyCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 16,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    historyTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
    },
    historyWeight: {
      fontSize: 14,
      fontWeight: '800',
    },
    milestoneCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSelected,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    milestoneEmoji: {
      fontSize: 28,
    },
    milestoneInfo: {
      flex: 1,
      gap: 5,
    },
    milestoneTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    footer: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
    },
  });
}
