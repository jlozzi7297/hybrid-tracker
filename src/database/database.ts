import * as SQLite from 'expo-sqlite';

// Open (or create) the local Hybrid Tracker database.
export const dbPromise = SQLite.openDatabaseAsync('hybrid-tracker.db');

// Initialize the database and create our tables and indexes.
export async function initializeDatabase() {
  const db = await dbPromise;

  // Enable foreign key enforcement for related database records.
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Store completed workout sessions.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER,
      notes TEXT
    );
  `);

  // Store completed running sessions.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      distance REAL NOT NULL,
      duration INTEGER NOT NULL,
      average_pace REAL
    );
  `);

  // Store individual exercises belonging to each workout.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workout_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
  `);

  // Store individual sets belonging to each exercise.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY NOT NULL,
      exercise_id TEXT NOT NULL,
      weight REAL,
      reps INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
    );
  `);

  // Speed up retrieving workouts in date order.
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_workouts_date
    ON workouts(date);
  `);

  // Speed up finding exercises belonging to a workout.
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id
    ON workout_exercises(workout_id);
  `);

  // Speed up finding sets belonging to an exercise.
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id
    ON workout_sets(exercise_id);
  `);
}
