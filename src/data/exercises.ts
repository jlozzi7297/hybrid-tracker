import { muscleGroups } from './muscleGroups';

// A starter exercise library. Users can choose from these when adding exercises.
export  const exerciseLibrary = [
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
  'Landmine RDL',
  'Zercher Squats',
  'Leg Press',
  'Romanian Deadlift',
  'Leg Curl',
  'Leg Extension',
  'Hip Abductors',
  'Hip Adductors',
  'Calf Raise',
  'Deadlift',
  'Plank',
];

// Define data type for muscle map 
type ExerciseMuscleMapping = {
  primary: (typeof muscleGroups)[number][];
  secondary: (typeof muscleGroups)[number][];
};

//Create mapping between exerizes and hit muscle groups
export const exerciseMuscleGroups: Record<string, ExerciseMuscleMapping> = {
  'Bench Press': {
    primary: ['chest'],
    secondary: ['triceps', 'shoulders'],
  },
  'Incline Dumbbell Press': {
    primary: ['chest'],
    secondary: ['triceps', 'shoulders'],
  },
  'Chest Fly': {
    primary: ['chest'],
    secondary: ['shoulders'],
  },
  'Shoulder Press': {
    primary: ['shoulders'],
    secondary: ['triceps'],
  },
  'Lateral Raise': {
    primary: ['shoulders'],
    secondary: [],
  },
  'Tricep Pushdown': {
    primary: ['triceps'],
    secondary: [],
  },
  'Pull-ups': {
    primary: ['lats'],
    secondary: ['biceps', 'upper back'],
  },
  'Lat Pulldown': {
    primary: ['lats'],
    secondary: ['biceps', 'upper back'],
  },
  'Dumbbell Row': {
    primary: ['upper back'],
    secondary: ['lats', 'biceps'],
  },
  'Barbell Row': {
    primary: ['upper back'],
    secondary: ['lats', 'biceps'],
  },
  'Bicep Curl': {
    primary: ['biceps'],
    secondary: ['forearms'],
  },
  'Hammer Curl': {
    primary: ['brachialis', 'forearms'],
    secondary: ['biceps'],
  },
  'Squat': {
    primary: ['quadriceps', 'glutes'],
    secondary: ['hamstrings', 'abs'],
  },
  'Landmine RDL': {
    primary: ['hamstrings', 'glutes'],
    secondary: ['lower back'],
  },
  'Zercher Squats': {
    primary: ['quadriceps', 'glutes'],
    secondary: ['upper back', 'abs'],
  },
  'Leg Press': {
    primary: ['quadriceps'],
    secondary: ['glutes'],
  },
  'Romanian Deadlift': {
    primary: ['hamstrings', 'glutes'],
    secondary: ['lower back'],
  },
  'Leg Curl': {
    primary: ['hamstrings'],
    secondary: [],
  },
  'Leg Extension': {
    primary: ['quadriceps'],
    secondary: [],
  },
  'Hip Abductors': {
    primary: ['gluteus medius'],
    secondary: ['glutes'],
  },
  'Hip Adductors': {
    primary: ['hip adductors'],
    secondary: [],
  },
  'Calf Raise': {
    primary: ['calves'],
    secondary: [],
  },
  'Deadlift': {
    primary: ['glutes', 'hamstrings'],
    secondary: ['lower back', 'upper back', 'quadriceps'],
  },
  'Plank': {
    primary: ['abs'],
    secondary: ['shoulders', 'glutes'],
  },
};

export function getExerciseMuscles(exerciseName: string) {
  return exerciseMuscleGroups[
  exerciseName as keyof typeof exerciseMuscleGroups
] ?? { primary: [], secondary: [] };
}
