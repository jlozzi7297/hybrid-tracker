import { getExerciseMuscles } from '@/data/exercises';
import { muscleGroups } from '@/data/muscleGroups';
import { dbPromise } from '@/database/database';

type TrainingSetRow = {
  workoutDate: string;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
};

export async function getTrainingHistory() {
  const db = await dbPromise;

  const rows = await db.getAllAsync<TrainingSetRow>(`
    SELECT
      workouts.date AS workoutDate,
      workout_exercises.name AS exerciseName,
      workout_sets.weight,
      workout_sets.reps
    FROM workout_sets
    INNER JOIN workout_exercises
      ON workout_sets.exercise_id = workout_exercises.id
    INNER JOIN workouts
      ON workout_exercises.workout_id = workouts.id
    WHERE workout_sets.completed = 1
    ORDER BY workouts.date DESC;
  `);

  return rows;
}

type MuscleTrainingStats = {
  sets: number;
  volume: number;
  lastTrained: string | null;
};

type MuscleRecoveryInfo = MuscleTrainingStats & {
  daysSinceTrained: number | null;
  recoveryStatus:
    | 'not-trained'
    | 'recently-trained'
    | 'recovering'
    | 'partially-recovered'
    | 'recovered';
};

export async function getMuscleTrainingStats() {
  const history = await getTrainingHistory();

  const stats: Record<string, MuscleTrainingStats> = {};

  for (const row of history) {
    const muscles = getExerciseMuscles(row.exerciseName);
    const volume = (row.weight ?? 0) * (row.reps ?? 0);

    for (const muscle of muscles.primary) {
      if (!stats[muscle]) {
        stats[muscle] = { 
            sets: 0,
            volume: 0,
            lastTrained: row.workoutDate, };
      }

      stats[muscle].sets += 1;
      stats[muscle].volume += volume;
    }
    for (const muscle of muscles.secondary) {
        if (!stats[muscle]) {
            stats[muscle] = { 
                sets: 0,
                volume: 0,
                lastTrained: row.workoutDate,};
        }
  stats[muscle].sets += 0.5;
  stats[muscle].volume += volume * 0.5;
}
  }
  

  return stats;
}

// Calculate days past since muscles trained
export function getDaysSinceLastTrained(lastTrained: string | null) {
  if (!lastTrained) return null;

  const trainedDate = new Date(lastTrained);

  if (Number.isNaN(trainedDate.getTime())) return null;

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const trainedStart = new Date(
    trainedDate.getFullYear(),
    trainedDate.getMonth(),
    trainedDate.getDate(),
  );

  return Math.max(
    0,
    Math.floor((todayStart.getTime() - trainedStart.getTime()) / 86400000),
  );
}

// Recovery calculation that returns a useful status
export function getRecoveryStatus(daysSinceTrained: number | null) {
  if (daysSinceTrained === null) return 'not-trained';
  if (daysSinceTrained < 1) return 'recently-trained';
  if (daysSinceTrained < 2) return 'recovering';
  if (daysSinceTrained < 4) return 'partially-recovered';

  return 'recovered';
}

export async function getMuscleRecoveryData(): Promise<Record<string, MuscleRecoveryInfo>> {
  const stats = await getMuscleTrainingStats();

  return Object.fromEntries(
    muscleGroups.map((muscle) => {
  const data = stats[muscle] ?? {
    sets: 0,
    volume: 0,
    lastTrained: null,
  };
      const daysSinceTrained = getDaysSinceLastTrained(data.lastTrained);

      return [
        muscle,
        {
          ...data,
          daysSinceTrained,
          recoveryStatus: getRecoveryStatus(daysSinceTrained),
        },
      ];
    }),
  );
}