import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SetEntry, Workout, WorkoutExercise } from "@/types";

interface WorkoutStore {
  workouts: Workout[];
  activeWorkoutId: string | null;
  startWorkout: (name: string) => string;
  addExerciseToWorkout: (workoutId: string, exerciseId: string) => void;
  addSet: (workoutId: string, workoutExerciseId: string) => void;
  updateSet: (
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
    patch: Partial<SetEntry>
  ) => void;
  removeSet: (workoutId: string, workoutExerciseId: string, setId: string) => void;
  deleteExercise: (workoutId: string, workoutExerciseId: string) => void;
  finishWorkout: (workoutId: string) => void;
  deleteWorkout: (workoutId: string) => void;
  addWorkoutImages: (workoutId: string, uris: string[]) => void;
  removeWorkoutImage: (workoutId: string, index: number) => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      workouts: [],
      activeWorkoutId: null,

      startWorkout: (name) => {
        const id = newId();
        const workout: Workout = {
          id,
          name,
          date: new Date().toISOString(),
          exercises: [],
          images: [],
        };
        set((state) => ({
          workouts: [workout, ...state.workouts],
          activeWorkoutId: id,
        }));
        return id;
      },

      addExerciseToWorkout: (workoutId, exerciseId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: [
                    ...w.exercises,
                    { id: newId(), exerciseId, sets: [] } satisfies WorkoutExercise,
                  ],
                }
          ),
        })),

      addSet: (workoutId, workoutExerciseId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.map((we) =>
                    we.id !== workoutExerciseId
                      ? we
                      : {
                          ...we,
                          sets: [
                            ...we.sets,
                            { id: newId(), reps: 0, weight: 0, completed: false },
                          ],
                        }
                  ),
                }
          ),
        })),

      updateSet: (workoutId, workoutExerciseId, setId, patch) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.map((we) =>
                    we.id !== workoutExerciseId
                      ? we
                      : {
                          ...we,
                          sets: we.sets.map((s) =>
                            s.id !== setId ? s : { ...s, ...patch }
                          ),
                        }
                  ),
                }
          ),
        })),

      removeSet: (workoutId, workoutExerciseId, setId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  exercises: w.exercises.map((we) =>
                    we.id !== workoutExerciseId
                      ? we
                      : { ...we, sets: we.sets.filter((s) => s.id !== setId) }
                  ),
                }
          ),
        })),

      deleteExercise: (workoutId, workoutExerciseId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : { ...w, exercises: w.exercises.filter((we) => we.id !== workoutExerciseId) }
          ),
        })),

      finishWorkout: (workoutId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId ? w : { ...w, completedAt: new Date().toISOString() }
          ),
          activeWorkoutId:
            state.activeWorkoutId === workoutId ? null : state.activeWorkoutId,
        })),

      deleteWorkout: (workoutId) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== workoutId),
        })),

      addWorkoutImages: (workoutId, uris) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId ? w : { ...w, images: [...w.images, ...uris] }
          ),
        })),

      removeWorkoutImage: (workoutId, index) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : { ...w, images: w.images.filter((_, i) => i !== index) }
          ),
        })),
    }),
    {
      name: "workout-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as WorkoutStore;
        return {
          ...state,
          workouts: state.workouts.map((w) => ({ ...w, images: w.images ?? [] })),
        };
      },
    }
  )
);
