export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "full body";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom?: boolean;
}

export interface SetEntry {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  date: string; // ISO string
  name: string;
  exercises: WorkoutExercise[];
  completedAt?: string; // ISO string, undefined while in progress
  images: string[];
  bodyWeight?: number;
  weightUnit?: WeightUnit;
}

export type WeightUnit = "kg" | "lbs";

export interface Comment {
  id: string;
  username: string;
  text: string;
  createdAt: string; // ISO string
}

export interface Post {
  id: string;
  username: string;
  text: string;
  images: string[];
  createdAt: string; // ISO string
  likedByMe: boolean;
  likeCount: number;
  comments: Comment[];
}
