import { View, Text } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { useExerciseStore } from "@/store/useExerciseStore";
import { useWorkoutStore } from "@/store/useWorkoutStore";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = useExerciseStore((s) => s.exercises.find((e) => e.id === id));
  const workouts = useWorkoutStore((s) => s.workouts);

  const history = workouts
    .filter((w) => w.exercises.some((we) => we.exerciseId === id))
    .flatMap((w) =>
      w.exercises
        .filter((we) => we.exerciseId === id)
        .map((we) => ({ date: w.date, sets: we.sets }))
    );

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <Stack.Screen options={{ title: exercise?.name ?? "Exercise" }} />
      <Text className="text-xl font-bold mb-1">{exercise?.name ?? "Exercise"}</Text>
      <Text className="text-gray-400 capitalize mb-4">{exercise?.muscleGroup}</Text>

      <Text className="text-base font-semibold text-gray-500 mb-2">History</Text>
      {history.length === 0 ? (
        <Text className="text-gray-400">No history for this exercise yet.</Text>
      ) : (
        history.map((entry, idx) => (
          <View key={idx} className="border border-gray-200 rounded-lg p-3 mb-2">
            <Text className="text-sm text-gray-500 mb-1">
              {new Date(entry.date).toLocaleDateString()}
            </Text>
            <Text>
              {entry.sets.map((s) => `${s.weight}x${s.reps}`).join(", ") || "No sets"}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
