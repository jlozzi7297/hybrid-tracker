
import { Colors } from '@/constants/theme';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

const initialExercises = [
  { id: '1', name: 'Bench Press', detail: '3 sets × 8 reps', sets: 3 },
  { id: '2', name: 'Dumbbell Row', detail: '3 sets × 10 reps', sets: 3 },
  { id: '3', name: 'Shoulder Press', detail: '3 sets × 10 reps', sets: 3 },
  { id: '4', name: 'Bicep Curls', detail: '3 sets × 12 reps', sets: 3 },
];

export default function WorkoutScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const styles = createStyles(colors);

  const [completedSets, setCompletedSets] = useState<Record<string, number[]>>(
    {},
  );

  const totalSets = initialExercises.reduce(
    (total, exercise) => total + exercise.sets,
    0,
  );

  const completedCount = Object.values(completedSets).reduce(
    (total, sets) => total + sets.length,
    0,
  );

  const progress =
    totalSets === 0 ? 0 : (completedCount / totalSets) * 100;

  function toggleSet(exerciseId: string, setNumber: number) {
    setCompletedSets((previous) => {
      const current = previous[exerciseId] ?? [];
      const isCompleted = current.includes(setNumber);

      return {
        ...previous,
        [exerciseId]: isCompleted
          ? current.filter((set) => set !== setNumber)
          : [...current, setNumber],
      };
    });
  }

  function resetWorkout() {
    setCompletedSets({});
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>BUILD YOUR STRENGTH</Text>
      <Text style={styles.title}>Workout</Text>
      <Text style={styles.subtitle}>Track every set. Make every rep count.</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.label}>Workout Progress</Text>
            <Text style={styles.progressNumber}>
              {completedCount} / {totalSets} sets
            </Text>
          </View>

          <View style={styles.percentageCircle}>
            <Text style={styles.percentageText}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>

        <Text style={styles.muted}>
          {completedCount === totalSets
            ? 'Workout complete. Great job!'
            : `${totalSets - completedCount} sets remaining`}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Today's Exercises</Text>
        <Pressable onPress={resetWorkout} hitSlop={8}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      {initialExercises.map((exercise, index) => {
        const exerciseCompleted = completedSets[exercise.id] ?? [];
        const isExerciseComplete =
          exerciseCompleted.length === exercise.sets;

        return (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.muted}>{exercise.detail}</Text>
              </View>

              {isExerciseComplete && (
                <View style={styles.doneBadge}>
                  <Text style={styles.doneText}>Done</Text>
                </View>
              )}
            </View>

            <View style={styles.setDivider} />

            <Text style={styles.setLabel}>COMPLETE YOUR SETS</Text>

            <View style={styles.setRow}>
              {Array.from({ length: exercise.sets }, (_, index) => {
                const setNumber = index + 1;
                const isCompleted = exerciseCompleted.includes(setNumber);

                return (
                  <Pressable
                    key={setNumber}
                    onPress={() => toggleSet(exercise.id, setNumber)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${setNumber} for ${exercise.name}`}
                    accessibilityState={{ selected: isCompleted }}
                    style={[
                      styles.setButton,
                      isCompleted && styles.setButtonCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.setButtonText,
                        isCompleted && styles.setButtonTextCompleted,
                      ]}
                    >
                      {isCompleted ? '✓ ' : ''}
                      Set {setNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <Text style={styles.footer}>
        Tap each set as you finish it. Your progress updates automatically.
      </Text>
    </ScrollView>
  );
}

function createStyles(
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'],
) {
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
    summaryCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      gap: 14,
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    progressNumber: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '800',
      marginTop: 5,
    },
    percentageCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentageText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 14,
    },
    progressBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: 8,
      backgroundColor: colors.accent,
      borderRadius: 10,
    },
    muted: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    heading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    resetText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
    },
    exerciseCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 14,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    exerciseNumber: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseNumberText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },
    exerciseInfo: {
      flex: 1,
      gap: 5,
    },
    exerciseName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    doneBadge: {
      backgroundColor: colors.backgroundSelected,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },
    doneText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    setDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    setLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    setRow: {
      flexDirection: 'row',
      gap: 8,
    },
    setButton: {
      flex: 1,
      minHeight: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 4,
    },
    setButtonCompleted: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    setButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    setButtonTextCompleted: {
      color: '#FFFFFF',
    },
    footer: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 4,
    },
  });
}
