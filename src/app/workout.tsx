import { Colors } from '@/constants/theme';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

// A starter exercise library. Users can choose from these when adding exercises.
const exerciseLibrary = [
  'Bench Press',
  'Incline Dumbbell Press',
  'Chest Fly',
  'Shoulder Press',
  'Lateral Raise',
  'Tricep Pushdown',
  'Pull-ups',
  'Lat Pulldown',
  'Dumbbell Row',
  'Barbell Row',
  'Bicep Curl',
  'Hammer Curl',
  'Squat',
  'Leg Press',
  'Romanian Deadlift',
  'Leg Curl',
  'Leg Extension',
  'Calf Raise',
  'Deadlift',
  'Plank',
];

// Each set stores its own weight, reps, and completion status.
type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

// Each exercise contains a list of individually editable sets.
type WorkoutExercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
};

// A small summary of a finished workout for the recent-workouts section.
type WorkoutHistoryItem = {
  id: string;
  date: string;
  duration: string;
  exerciseCount: number;
  setCount: number;
};

// Creates a unique-enough local ID for exercises and sets.
function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Creates a new blank set with sensible starter values.
function createSet(): WorkoutSet {
  return {
    id: createId(),
    weight: '0',
    reps: '8',
    completed: false,
  };
}

// Formats elapsed seconds as HH:MM:SS.
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export default function WorkoutScreen() {
  // Use the app's current light or dark theme.
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const styles = createStyles(colors);

  // Track whether the user is currently in a workout.
  const [workoutActive, setWorkoutActive] = useState(false);

  // Store the time the workout started and the elapsed timer value.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Store the exercises and sets for the current workout.
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // Control the exercise-picker modal and its search field.
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Keep a short list of completed workouts in memory for this app session.
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);

  // Update the timer once per second while a workout is active.
  useEffect(() => {
    if (!workoutActive || startedAt === null) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [workoutActive, startedAt]);

  // Filter the exercise library based on the user's search.
  const filteredExercises = useMemo(() => {
    const search = exerciseSearch.trim().toLowerCase();
    return exerciseLibrary.filter((name) => name.toLowerCase().includes(search));
  }, [exerciseSearch]);

  // Calculate workout totals from the current exercise list.
  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const completedSets = exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );

  // Start a fresh workout and begin the timer.
  function startWorkout() {
    setExercises([]);
    setElapsedSeconds(0);
    setStartedAt(Date.now());
    setWorkoutActive(true);
  }

  // Add a selected exercise with three editable starter sets.
  function addExercise(name: string) {
    const alreadyAdded = exercises.some(
      (exercise) => exercise.name.toLowerCase() === name.toLowerCase(),
    );

    if (alreadyAdded) {
      Alert.alert('Exercise already added', `${name} is already in this workout.`);
      return;
    }

    const newExercise: WorkoutExercise = {
      id: createId(),
      name,
      sets: [createSet(), createSet(), createSet()],
    };

    setExercises((current) => [...current, newExercise]);
    setPickerVisible(false);
    setExerciseSearch('');
  }

  // Add a custom exercise name typed into the search field.
  function addCustomExercise() {
    const customName = exerciseSearch.trim();

    if (!customName) {
      return;
    }

    addExercise(customName);
  }

  // Update one field on one specific set.
  function updateSet(
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string,
  ) {
    // Only allow numbers and a decimal point in the weight field.
    const cleanedValue = field === 'weight' ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');

    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: cleanedValue } : set,
              ),
            },
      ),
    );
  }

  // Mark a set as complete or incomplete.
  function toggleSet(exerciseId: string, setId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, completed: !set.completed } : set,
              ),
            },
      ),
    );
  }

  // Add another blank set to an exercise.
  function addSet(exerciseId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, createSet()] }
          : exercise,
      ),
    );
  }

  // Remove a set, but keep at least one set for each exercise.
  function removeSet(exerciseId: string, setId: string) {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.sets.length <= 1) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      }),
    );
  }

  // Remove an exercise from the active workout.
  function removeExercise(exerciseId: string) {
    setExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
  }

  // Finish the workout, save a summary, and return to the starting screen.
  function finishWorkout() {
    if (exercises.length === 0) {
      Alert.alert('No exercises added', 'Add at least one exercise before finishing your workout.');
      return;
    }

    const duration = formatDuration(elapsedSeconds);
    const historyItem: WorkoutHistoryItem = {
      id: createId(),
      date: new Date().toLocaleDateString(),
      duration,
      exerciseCount: exercises.length,
      setCount: totalSets,
    };

    setWorkoutHistory((current) => [historyItem, ...current].slice(0, 5));
    setWorkoutActive(false);
    setStartedAt(null);
    setExercises([]);
    setElapsedSeconds(0);

    Alert.alert('Workout saved', `Duration: ${duration}\nExercises: ${historyItem.exerciseCount}\nSets: ${historyItem.setCount}`);
  }

  // Ask before discarding an active workout.
  function cancelWorkout() {
    Alert.alert('Discard workout?', 'Your current workout will be lost.', [
      { text: 'Keep working out', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setWorkoutActive(false);
          setStartedAt(null);
          setExercises([]);
          setElapsedSeconds(0);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {!workoutActive ? (
        // Simple landing screen shown before a workout starts.
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>TRAINING</Text>
          <Text style={styles.title}>Workout</Text>
          <Text style={styles.subtitle}>Keep it simple. Track your progress.</Text>

          <View style={styles.startCard}>
            <View style={styles.startIcon}>
              <Text style={styles.startIconText}>+</Text>
            </View>
            <Text style={styles.startTitle}>Ready to train?</Text>
            <Text style={styles.startDescription}>
              Start a workout, add your exercises, and record the weight and reps for every set.
            </Text>
            <Pressable style={styles.primaryButton} onPress={startWorkout}>
              <Text style={styles.primaryButtonText}>Start New Workout</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
          </View>

          {workoutHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryTitle}>No workouts yet</Text>
              <Text style={styles.muted}>Your completed workouts will appear here.</Text>
            </View>
          ) : (
            workoutHistory.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyName}>Workout</Text>
                  <Text style={styles.historyDuration}>{item.duration}</Text>
                </View>
                <Text style={styles.muted}>
                  {item.date} · {item.exerciseCount} exercises · {item.setCount} sets
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        // Active workout screen with timer, exercises, and editable sets.
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.activeHeader}>
            <View>
              <Text style={styles.eyebrow}>WORKOUT IN PROGRESS</Text>
              <Text style={styles.title}>Your Workout</Text>
            </View>
            <Pressable onPress={cancelWorkout} hitSlop={10}>
              <Text style={styles.cancelText}>Discard</Text>
            </Pressable>
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>DURATION</Text>
            <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.muted}>{completedSets} of {totalSets} sets completed</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Text style={styles.muted}>{exercises.length} added</Text>
          </View>

          {exercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyExercisesTitle}>No exercises added</Text>
              <Text style={styles.muted}>Choose an exercise to start tracking your sets.</Text>
            </View>
          ) : (
            exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>
                      {String(exerciseIndex + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.muted}>{exercise.sets.length} sets</Text>
                  </View>
                  <Pressable onPress={() => removeExercise(exercise.id)} hitSlop={8}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeading, styles.setColumn]}>SET</Text>
                  <Text style={[styles.tableHeading, styles.valueColumn]}>WEIGHT</Text>
                  <Text style={[styles.tableHeading, styles.valueColumn]}>REPS</Text>
                  <Text style={[styles.tableHeading, styles.doneColumn]}>DONE</Text>
                </View>

                {exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setEntry}>
                    <Text style={[styles.setNumber, styles.setColumn]}>{setIndex + 1}</Text>
                    <TextInput
                      style={[styles.numberInput, styles.valueColumn]}
                      value={set.weight}
                      onChangeText={(value) => updateSet(exercise.id, set.id, 'weight', value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      selectTextOnFocus
                      accessibilityLabel={`Weight for ${exercise.name}, set ${setIndex + 1}`}
                    />
                    <TextInput
                      style={[styles.numberInput, styles.valueColumn]}
                      value={set.reps}
                      onChangeText={(value) => updateSet(exercise.id, set.id, 'reps', value)}
                      keyboardType="number-pad"
                      placeholder="8"
                      placeholderTextColor={colors.textSecondary}
                      selectTextOnFocus
                      accessibilityLabel={`Reps for ${exercise.name}, set ${setIndex + 1}`}
                    />
                    <Pressable
                      style={[styles.completeButton, set.completed && styles.completeButtonSelected]}
                      onPress={() => toggleSet(exercise.id, set.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: set.completed }}
                    >
                      <Text style={[styles.completeButtonText, set.completed && styles.completeButtonTextSelected]}>
                        {set.completed ? '✓' : '○'}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => removeSet(exercise.id, set.id)} hitSlop={8}>
                      <Text style={styles.removeSetText}>×</Text>
                    </Pressable>
                  </View>
                ))}

                <Pressable style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
                  <Text style={styles.addSetText}>+ Add Set</Text>
                </Pressable>
              </View>
            ))
          )}

          <Pressable style={styles.secondaryButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.secondaryButtonText}>+ Add Exercise</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={finishWorkout}>
            <Text style={styles.primaryButtonText}>Finish Workout</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Exercise picker modal: choose a library exercise or enter a custom name. */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => setPickerVisible(false)} hitSlop={10}>
                <Text style={styles.cancelText}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              placeholder="Search or type a custom exercise"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <ScrollView keyboardShouldPersistTaps="handled" style={styles.exerciseChoices}>
              {filteredExercises.map((name) => (
                <Pressable key={name} style={styles.exerciseChoice} onPress={() => addExercise(name)}>
                  <Text style={styles.exerciseChoiceText}>{name}</Text>
                  <Text style={styles.choicePlus}>+</Text>
                </Pressable>
              ))}

              {exerciseSearch.trim().length > 0 &&
                !exerciseLibrary.some((name) => name.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
                  <Pressable style={styles.customExerciseChoice} onPress={addCustomExercise}>
                    <Text style={styles.exerciseChoiceText}>Add custom: {exerciseSearch.trim()}</Text>
                    <Text style={styles.choicePlus}>+</Text>
                  </Pressable>
                )}

              {filteredExercises.length === 0 && !exerciseSearch.trim() && (
                <Text style={styles.muted}>No exercises found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// All screen styles use the shared app theme so light and dark mode stay consistent.
function createStyles(colors: (typeof Colors)['light'] | (typeof Colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingTop: 30,
      paddingBottom: 48,
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
    startCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 20,
      padding: 22,
      alignItems: 'flex-start',
      gap: 12,
      marginTop: 8,
    },
    startIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startIconText: {
      color: colors.accent,
      fontSize: 30,
      fontWeight: '500',
      lineHeight: 34,
    },
    startTitle: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '800',
    },
    startDescription: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      marginTop: 4,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    secondaryButton: {
      borderColor: colors.accent,
      borderWidth: 1,
      borderRadius: 12,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundElement,
    },
    secondaryButtonText: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '800',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    emptyHistory: {
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    emptyHistoryTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    historyCard: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 7,
    },
    historyTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyName: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
    },
    historyDuration: {
      color: colors.accent,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    muted: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    activeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cancelText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
    },
    timerCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 20,
      alignItems: 'center',
      gap: 7,
    },
    timerLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
    },
    timer: {
      color: colors.text,
      fontSize: 36,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    emptyExercises: {
      padding: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      gap: 7,
    },
    emptyExercisesTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    exerciseCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    exerciseNumber: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseNumberText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    exerciseInfo: {
      flex: 1,
      gap: 4,
    },
    exerciseName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    removeText: {
      color: '#D9534F',
      fontSize: 12,
      fontWeight: '700',
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingTop: 5,
    },
    tableHeading: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      textAlign: 'center',
    },
    setColumn: {
      width: 34,
      textAlign: 'center',
    },
    valueColumn: {
      flex: 1,
      textAlign: 'center',
    },
    doneColumn: {
      width: 42,
      textAlign: 'center',
    },
    setEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 44,
    },
    setNumber: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    numberInput: {
      color: colors.text,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      minHeight: 38,
      paddingHorizontal: 5,
      fontSize: 14,
      textAlign: 'center',
    },
    completeButton: {
      width: 34,
      height: 34,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    completeButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    completeButtonText: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: '800',
    },
    completeButtonTextSelected: {
      color: '#FFFFFF',
    },
    removeSetText: {
      width: 17,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 21,
    },
    addSetButton: {
      alignSelf: 'flex-start',
      paddingVertical: 5,
      paddingHorizontal: 2,
    },
    addSetText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    modalCard: {
      maxHeight: '82%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      paddingBottom: 32,
      gap: 14,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    searchInput: {
      color: colors.text,
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 11,
      minHeight: 46,
      paddingHorizontal: 13,
      fontSize: 14,
    },
    exerciseChoices: {
      flexGrow: 0,
    },
    exerciseChoice: {
      minHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    customExerciseChoice: {
      minHeight: 48,
      backgroundColor: colors.backgroundSelected,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      marginTop: 10,
    },
    exerciseChoiceText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    choicePlus: {
      color: colors.accent,
      fontSize: 23,
      fontWeight: '500',
    },
  });
}
