# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm start          # Start Metro / Expo dev server
npm run ios        # Start with iOS simulator
npm run android    # Start with Android emulator
npm run web        # Start web target
npx tsc --noEmit   # Type-check the whole project (no separate lint/test scripts exist yet)
npx expo-doctor    # Validate dependency versions against the installed Expo SDK
```

There are no test or lint scripts configured. After dependency changes, always run `npx expo-doctor` — Expo SDK packages must match the version expected by the installed `expo` package exactly (see Dependency versioning below).

## Dependency versioning (important)

This project pins Expo SDK packages to the versions `expo-doctor` expects for SDK 54, not to `^latest`. When adding a package that Expo manages (anything also installable via `npx expo install`), do not let npm resolve it to the newest major version:

```bash
npx expo install <package>     # preferred — resolves the SDK-compatible version automatically
```

If a package ends up at the wrong major version (e.g. `babel-preset-expo` resolving to a newer release than the one bundled with `expo`), pin it explicitly in `package.json` and reinstall. Run `npx expo-doctor` after any dependency change to confirm all 18 checks still pass.

## Architecture

**Stack:** Expo SDK 54 (new architecture enabled) + Expo Router (file-based nav) + TypeScript + NativeWind (Tailwind classes via `className`) + Zustand (persisted to AsyncStorage).

**Routing (`app/`)** — Expo Router file-based routes:
- `app/_layout.tsx` — root `Stack`, wraps the app in `GestureHandlerRootView` + `SafeAreaProvider`, imports `global.css` (NativeWind entry point).
- `app/(tabs)/` — tab group (Home, History, Exercises, Stats), tab bar defined in `app/(tabs)/_layout.tsx`.
- `app/workout/[id].tsx` — active/completed workout session screen: add exercises (via `ExercisePickerModal`), log sets, finish workout.
- `app/exercise/[id].tsx` — per-exercise detail/history, derived by scanning `useWorkoutStore` for past sets of that exercise.

**State (`store/`)** — two independent Zustand stores, each wrapped in `persist` + `createJSONStorage(() => AsyncStorage)` so state survives app restarts:
- `useWorkoutStore` — the list of `Workout` records and all mutations (`startWorkout`, `addExerciseToWorkout`, `addSet`, `updateSet`, `removeSet`, `finishWorkout`, `deleteWorkout`). A `Workout` is in progress while `completedAt` is unset.
- `useExerciseStore` — the exercise library, seeded from `constants/exercises.ts` (`SEED_EXERCISES`) on first run, with `addExercise`/`removeExercise` for user-created entries (flagged `isCustom: true`, id prefixed `custom-`).

A `WorkoutExercise` only stores an `exerciseId` reference — exercise metadata (name, muscle group) is always looked up from `useExerciseStore`, never duplicated into the workout record.

**Types (`types/index.ts`)** — single source of truth for `Exercise`, `MuscleGroup`, `SetEntry`, `WorkoutExercise`, `Workout`. Update this file first when changing the data model; both stores and all screens import from it.

**Components (`components/`)** — shared UI not tied to a specific route, e.g. `ExercisePickerModal` (searchable modal for selecting/creating an exercise, used by the workout screen instead of any hardcoded exercise list).

**Path alias** — `@/*` maps to the project root (see `tsconfig.json`), e.g. `import { useWorkoutStore } from "@/store/useWorkoutStore"`.

**Styling** — NativeWind v4: use Tailwind utility classes via the `className` prop on RN components. Babel/Metro config (`babel.config.js`, `metro.config.js`) and `global.css`/`tailwind.config.js` wire this up; don't hand-roll `StyleSheet` for new screens unless NativeWind can't express the style.
