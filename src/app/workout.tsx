import { Colors } from '@/constants/theme';
import { dbPromise } from '@/database/database';
import { useEffect, useMemo, useState } from 'react';
// Provides pause and play icons for the workout timer.
import { Ionicons } from '@expo/vector-icons';
// Provides swipe gestures for workout history cards.
import { exerciseLibrary } from '@/data/exercises';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import MuscleModel3D from '../components/MuscleModel3D';

// Each set stores its own weight, reps, and completion status.
type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

// Stores the weight and reps from a previous workout.
type PreviousSet = {
  weight: number | null;
  reps: number | null;
};
// Each exercise contains a list of individually editable sets.
type WorkoutExercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
};

// A summary of a finished workout for the recent-workouts section.
type WorkoutHistoryItem = {
  id: string;
  name: string;
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
    weight: '',
    reps: '',
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

// Convert an HH:MM:SS duration into total seconds.
function parseDuration(value: string) {
  const parts = value.trim().split(':').map((part) => Number.parseInt(part, 10));

  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  const [hours, minutes, seconds] = parts;
  if (minutes > 59 || seconds > 59) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

// Defines the structure of a workout retrieved from SQLite.
type StoredWorkout = {
  id: string;
  name: string;
  date: string;
  duration: number;
  notes: string | null;
};

// Defines an exercise row retrieved from the workout database.
type StoredExercise = {
  id: string;
  name: string;
};

// Defines a set row retrieved from the workout database.
type StoredSet = {
  id: string;
  exercise_id: string;
  weight: number | null;
  reps: number | null;
  completed: number;
};

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

  // Track whether the workout timer is paused.
  const [timerPaused, setTimerPaused] = useState(false);
  // Keep the workout name and editable duration with the current session.
  const [workoutName, setWorkoutName] = useState('Workout');
  const [durationDraft, setDurationDraft] = useState('00:00:00');

  // A non-null ID means the current screen is editing an existing saved workout.
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  // Store the exercises and sets for the current workout.
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // Control the exercise-picker modal and its search field.
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Keep a short list of completed workouts in memory for this app session.
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);

  // Stores previous performance for each exercise, keyed by exercise name.
const [previousPerformance, setPreviousPerformance] = useState<
  Record<string, PreviousSet[]>
>({});

  // Load the five most recent saved workouts when the screen opens.
  useEffect(() => {
    async function loadWorkouts() {
      try {
        // Connect to the local database.
        const db = await dbPromise;

        // Retrieve recent workouts, including their saved names.
        const savedWorkouts = await db.getAllAsync<StoredWorkout>(
          'SELECT id, name, date, duration, notes FROM workouts ORDER BY date DESC LIMIT 5'
        );

        // Convert database records into the format used by the screen.
        setWorkoutHistory(
          savedWorkouts.map((workout) => {
            let exerciseCount = 0;
            let setCount = 0;

            // Recover exercise and set counts from the notes field.
            try {
              const details = JSON.parse(workout.notes || '{}');
              exerciseCount = details.exerciseCount || 0;
              setCount = details.setCount || 0;
            } catch {
              // Keep default counts if the saved notes aren't valid JSON.
            }

            return {
              id: workout.id,
              name: workout.name,
              date: new Date(workout.date).toLocaleDateString(),
              duration: formatDuration(workout.duration ?? 0),
              exerciseCount,
              setCount,
            };
          })
        );
      } catch (error) {
        // Log database errors so they can be diagnosed.
        console.error('Failed to load workouts:', error);
      }
    }

    // Run the database query after the screen mounts.
    loadWorkouts();
  }, []);

  // Update the timer once per second while a workout is active.
// Update the timer once per second while a workout is active and not paused.
useEffect(() => {
  if (!workoutActive || startedAt === null || timerPaused) {
    return;
  }

  const timer = setInterval(() => {
    setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
  }, 1000);

  return () => clearInterval(timer);
}, [workoutActive, startedAt, timerPaused]);

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
    setWorkoutName('Workout');
    setElapsedSeconds(0);
    setDurationDraft('00:00:00');
    setEditingWorkoutId(null);
    setStartedAt(Date.now());
    setWorkoutActive(true);
  }

  // Pause or resume the workout timer.
function toggleTimerPause() {
  if (!timerPaused) {
    // Save the current elapsed time before pausing.
    setElapsedSeconds(Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000));
    setTimerPaused(true);
  } else {
    // Restart the timer from the current time.
    setStartedAt(Date.now() - elapsedSeconds * 1000);
    setTimerPaused(false);
  }
}
  // Load a saved workout and all its exercises and sets into the editor.
  async function editSavedWorkout(workoutId: string) {
    try {
      const db = await dbPromise;
      const workout = await db.getFirstAsync<StoredWorkout>(
        'SELECT id, name, date, duration, notes FROM workouts WHERE id = ?',
        workoutId,
      );

      if (!workout) {
        Alert.alert('Workout not found', 'This saved workout could not be found.');
        return;
      }

      const savedExercises = await db.getAllAsync<StoredExercise>(
        'SELECT id, name FROM workout_exercises WHERE workout_id = ? ORDER BY rowid',
        workoutId,
      );

      const loadedExercises: WorkoutExercise[] = [];
      for (const exercise of savedExercises) {
        const savedSets = await db.getAllAsync<StoredSet>(
          'SELECT id, exercise_id, weight, reps, completed FROM workout_sets WHERE exercise_id = ? ORDER BY rowid',
          exercise.id,
        );

        loadedExercises.push({
          id: exercise.id,
          name: exercise.name,
          sets: savedSets.map((set) => ({
            id: set.id,
            weight: set.weight === null ? '' : String(set.weight),
            reps: set.reps === null ? '' : String(set.reps),
            completed: set.completed === 1,
          })),
        });
      }

      setEditingWorkoutId(workout.id);
      setWorkoutName(workout.name || 'Workout');
      setElapsedSeconds(workout.duration || 0);
      setDurationDraft(formatDuration(workout.duration || 0));
      setExercises(loadedExercises);
      setStartedAt(null);
      setWorkoutActive(true);
    } catch (error) {
      console.error('Failed to load workout for editing:', error);
      Alert.alert('Edit failed', 'Could not load this workout. Please try again.');
    }
  }

  // Delete a saved workout; SQLite foreign keys remove its exercises and sets.
  function deleteSavedWorkout(workoutId: string) {
    Alert.alert('Delete workout?', 'This will permanently delete the workout and all its exercises and sets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const db = await dbPromise;
            await db.runAsync('DELETE FROM workouts WHERE id = ?', workoutId);
            setWorkoutHistory((current) => current.filter((item) => item.id !== workoutId));
          } catch (error) {
            console.error('Failed to delete workout:', error);
            Alert.alert('Delete failed', 'Could not delete this workout. Please try again.');
          }
        },
      },
    ]);
  }

  // Add a selected exercise with three editable starter sets.
// Add an exercise and retrieve its previous workout performance.
async function addExercise(name: string) {
  const alreadyAdded = exercises.some(
    (exercise) => exercise.name.toLowerCase() === name.toLowerCase(),
  );

  if (alreadyAdded) {
    Alert.alert('Exercise already added', `${name} is already in this workout.`);
    return;
  }

  try {
    const db = await dbPromise;

    // Find the most recent workout containing this exercise.
    // Exclude the workout currently being edited.
    const previousExercise = await db.getFirstAsync<{ id: string }>(
      `SELECT we.id
       FROM workout_exercises we
       JOIN workouts w ON w.id = we.workout_id
       WHERE LOWER(we.name) = LOWER(?)
       AND (? IS NULL OR w.id != ?)
       ORDER BY w.date DESC
       LIMIT 1`,
      name,
      editingWorkoutId,
      editingWorkoutId,
    );

    let previousSets: PreviousSet[] = [];

    if (previousExercise) {
      // Retrieve the previous weights and reps in set order.
      previousSets = await db.getAllAsync<PreviousSet>(
        `SELECT weight, reps
         FROM workout_sets
         WHERE exercise_id = ?
         ORDER BY rowid ASC`,
        previousExercise.id,
      );
    }

    // Store historical performance separately from editable sets.    
    setPreviousPerformance((current) => ({
      ...current,
      [name.toLowerCase()]: previousSets,
    }));

    // Create three new, empty sets.
    const newExercise: WorkoutExercise = {
      id: createId(),
      name,
      sets: [createSet(), createSet(), createSet()],
    };

    setExercises((current) => [...current, newExercise]);
    setPickerVisible(false);
    setExerciseSearch('');
  } catch (error) {
    console.error('Failed to retrieve previous exercise performance:', error);
    Alert.alert('Exercise error', 'Could not retrieve previous exercise history.');
  }
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

// Save a new workout or update an existing saved workout in SQLite.
async function finishWorkout() {
  if (exercises.length === 0) {
    Alert.alert('No exercises added', 'Add at least one exercise before saving your workout.');
    return;
  }

  // Validate the editable duration before writing anything to the database.
  const finalDuration = editingWorkoutId !== null ? parseDuration(durationDraft) : elapsedSeconds;
  if (finalDuration === null) {
    Alert.alert('Invalid duration', 'Enter the duration as HH:MM:SS, for example 01:15:00.');
    return;
  }

  const cleanName = workoutName.trim() || 'Workout';

  try {
    const db = await dbPromise;
    const workoutId = editingWorkoutId ?? createId();
    const workoutDate = new Date().toISOString();
    const completedSetCount = exercises.reduce(
      (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
      0,
    );
    const allSetCount = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

    // Save the workout and its related records as one database transaction.
    await db.withTransactionAsync(async () => {
      if (editingWorkoutId !== null) {
        // Update the saved workout's name, duration, and summary.
        await db.runAsync(
          'UPDATE workouts SET name = ?, duration = ?, notes = ? WHERE id = ?',
          cleanName,
          finalDuration,
          JSON.stringify({
            exerciseCount: exercises.length,
            setCount: completedSetCount,
            totalSets: allSetCount,
          }),
          workoutId,
        );

        // Remove old child rows; the updated exercise and set rows are inserted below.
        await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', workoutId);
      } else {
        // Insert the main record for a brand-new workout.
        await db.runAsync(
          `INSERT INTO workouts (id, name, date, duration, notes)
           VALUES (?, ?, ?, ?, ?)`,
          workoutId,
          cleanName,
          workoutDate,
          finalDuration,
          JSON.stringify({
            exerciseCount: exercises.length,
            setCount: completedSetCount,
            totalSets: allSetCount,
          }),
        );
      }

      // Save each exercise and its sets, whether this is new or edited.
      for (const exercise of exercises) {
        await db.runAsync(
          'INSERT INTO workout_exercises (id, workout_id, name) VALUES (?, ?, ?)',
          exercise.id,
          workoutId,
          exercise.name,
        );

        for (const set of exercise.sets) {
          const weight = set.weight.trim() === '' ? null : Number.parseFloat(set.weight);
          const reps = set.reps.trim() === '' ? null : Number.parseInt(set.reps, 10);

          await db.runAsync(
            `INSERT INTO workout_sets (id, exercise_id, weight, reps, completed)
             VALUES (?, ?, ?, ?, ?)`,
            set.id,
            exercise.id,
            weight !== null && Number.isFinite(weight) ? weight : null,
            reps !== null && Number.isFinite(reps) ? reps : null,
            set.completed ? 1 : 0,
          );
        }
      }
    });

    // Update the recent-workouts list after the database transaction succeeds.
    const historyItem: WorkoutHistoryItem = {
      id: workoutId,
      name: cleanName,
      date: editingWorkoutId !== null
        ? (workoutHistory.find((item) => item.id === workoutId)?.date ?? new Date().toLocaleDateString())
        : new Date(workoutDate).toLocaleDateString(),
      duration: formatDuration(finalDuration),
      exerciseCount: exercises.length,
      setCount: completedSetCount,
    };

    setWorkoutHistory((current) => {
      const withoutEditedItem = current.filter((item) => item.id !== workoutId);
      return [historyItem, ...withoutEditedItem].slice(0, 5);
    });

    setWorkoutActive(false);
    setStartedAt(null);
    setEditingWorkoutId(null);
    setExercises([]);
    setWorkoutName('Workout');
    setElapsedSeconds(0);
    setDurationDraft('00:00:00');
    Alert.alert('Workout saved', editingWorkoutId !== null ? 'Your changes were saved.' : 'Your workout and exercise details were saved!');
  } catch (error) {
    console.error('Failed to save workout:', error);
    Alert.alert('Save failed', 'Could not save your workout. Please try again.');
  }
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
        setEditingWorkoutId(null);
        setExercises([]);
        setWorkoutName('Workout');
        setElapsedSeconds(0);
        setDurationDraft('00:00:00');
      },
    },
  ]);
}

  return (
  <SafeAreaView style={styles.container} edges={['top']}>
      {!workoutActive ? (
        // Simple landing screen shown before a workout starts.
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>TRAINING</Text>
          <Text style={styles.title}>Workout</Text>
          <Text style={styles.subtitle}>Keep it simple. Track your progress.</Text>

          <View style={styles.startCard}>
  <View style={{ flex: 1, alignItems: 'flex-start', gap: 12 }}>
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

  <MuscleModel3D />
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
  <ReanimatedSwipeable
    key={item.id}
    overshootRight={false}
    renderRightActions={() => (
      <View style={styles.historySwipeActions}>
        {/* Edit the selected workout. */}
        <Pressable
          style={styles.swipeEditButton}
          onPress={() => editSavedWorkout(item.id)}
        >
          <Text style={styles.swipeActionText}>Edit</Text>
        </Pressable>

        {/* Delete the selected workout. */}
        <Pressable
          style={styles.swipeDeleteButton}
          onPress={() => deleteSavedWorkout(item.id)}
        >
          <Text style={styles.swipeActionText}>Delete</Text>
        </Pressable>
      </View>
    )}
  >
    <View style={styles.historyCard}>
      <View style={styles.historyTop}>
        <Text style={styles.historyName}>{item.name}</Text>
        <Text style={styles.historyDuration}>{item.duration}</Text>
      </View>

      <Text style={styles.muted}>
        {item.date} · {item.exerciseCount} exercises · {item.setCount} completed sets
      </Text>
    </View>
  </ReanimatedSwipeable>
))
          )}
        </ScrollView>
      ) : (
        // Active workout screen with timer, exercises, and editable sets.
        <KeyboardAwareScrollView
  contentContainerStyle={styles.content}
  keyboardShouldPersistTaps="handled"
  bottomOffset={20}>
          <View style={styles.activeHeader}>
            <View>
              <Text style={styles.eyebrow}>WORKOUT IN PROGRESS</Text>
              <Text style={styles.title}>{editingWorkoutId !== null ? 'Edit Workout' : 'Your Workout'}</Text>
            </View>
            <Pressable onPress={cancelWorkout} hitSlop={10}>
              <Text style={styles.cancelText}>Discard</Text>
            </Pressable>
          </View>

<View style={styles.timerCard}>
  <Text style={styles.timerLabel}>
    DURATION {editingWorkoutId !== null ? '(HH:MM:SS)' : ''}
  </Text>

  {/* Keep the timer and its controls on the same row. */}
  <View style={styles.timerRow}>
    <View style={styles.timerInfo}>
      {editingWorkoutId !== null ? (
        <TextInput
          style={styles.durationInput}
          value={durationDraft}
          onChangeText={setDurationDraft}
          placeholder="00:45:00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel="Workout duration in hours, minutes, and seconds"
        />
      ) : (
        <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
      )}

      <Text style={styles.muted}>
        {completedSets} of {totalSets} sets completed
      </Text>
    </View>

    {/* Pause or resume the workout using a theme-colored icon. */}
    {editingWorkoutId === null && workoutActive && (
      <Pressable
        style={styles.timerControl}
        onPress={toggleTimerPause}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={timerPaused ? 'Resume timer' : 'Pause timer'}
      >
        <Ionicons
          name={timerPaused ? 'play' : 'pause'}
          size={26}
          color={colors.accent}
        />
      </Pressable>
    )}
  </View>
</View>

          <View style={styles.nameCard}>
            <Text style={styles.timerLabel}>WORKOUT NAME</Text>
            <TextInput
              style={styles.nameInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Workout name"
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
            />
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
                      placeholder={
                        previousPerformance[exercise.name.toLowerCase()]?.[setIndex]?.weight?.toString() ?? '0'}
                      placeholderTextColor={colors.textSecondary}
                      accessibilityLabel={`Weight for ${exercise.name}, set ${setIndex + 1}`}
                    />
                    <TextInput
                      style={[styles.numberInput, styles.valueColumn]}
                      value={set.reps}
                      onChangeText={(value) => updateSet(exercise.id, set.id, 'reps', value)}
                      keyboardType="number-pad"
                      // Show the previous reps as a gray hint, or 8 if no history exists.
                      placeholder={
                        previousPerformance[exercise.name.toLowerCase()]?.[setIndex]?.reps?.toString() ?? '8'}
                      placeholderTextColor={colors.textSecondary}
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
            <Text style={styles.primaryButtonText}>{editingWorkoutId !== null ? 'Save Changes' : 'Finish Workout'}</Text>
          </Pressable>
        </KeyboardAwareScrollView>
      )}

      {/* Exercise picker modal: choose a library exercise or enter a custom name. */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
<View style={styles.modalOverlay}>
  <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1, justifyContent: 'flex-end' }}
  >
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
  </KeyboardAvoidingView>
</View>
</Modal>
            {/* Shows keyboard navigation and a Done button when an input is focused. */}
      <KeyboardToolbar />
    </SafeAreaView>
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
      paddingTop: 0,
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
      alignItems: 'center',
      gap: 12,
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between'
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
      borderRadius: 0,
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
    historyActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    // Container for the actions revealed when swiping a workout.
historySwipeActions: {
  flexDirection: 'row',
  alignSelf: 'stretch',
  width: 156,
},

// Blue button for editing a workout.
swipeEditButton: {
  backgroundColor: colors.accent,
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
},

// Red button for deleting a workout.
swipeDeleteButton: {
  backgroundColor: '#D9534F',
  justifyContent: 'center',
  alignItems: 'center',
  borderTopEndRadius: 14,
  borderBottomEndRadius: 14,
  flex: 1,
},

// Shared text styling for both swipe actions.
swipeActionText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '800',
},
    historyActionButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 9,
      backgroundColor: colors.backgroundSelected,
    },
    historyActionText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },
    deleteActionText: {
      color: '#D9534F',
      fontSize: 12,
      fontWeight: '800',
    },
    nameCard: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      gap: 4,
    },
    nameInput: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      paddingVertical: 5,
    },
    durationInput: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
      minWidth: 180,
      paddingVertical: 4,
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
      gap: 7,
    },
    // Places the timer and pause/play control beside each other.
timerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
},

// Keeps the timer text and completed-set count together.
timerInfo: {
  flex: 1,
  gap: 4,
},

// Makes the pause/play icon easy to tap.
timerControl: {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 12,
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
      minHeight: 0,
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
      minHeight: 32,
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
