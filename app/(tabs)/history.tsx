import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useThemeColors } from "@/store/useThemeStore";
import type { Workout } from "@/types";

export default function HistoryScreen() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  const completed = workouts.filter((w) => w.completedAt);
  const colors = useThemeColors();

  const confirmDelete = (workout: Workout) => {
    Alert.alert("Delete this workout?", workout.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteWorkout(workout.id),
      },
    ]);
  };

  return (
    <View className="flex-1 px-4 pt-4" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={{ color: colors.muted }}>No completed workouts yet.</Text>
        }
        renderItem={({ item }) => (
          <View
            className="rounded-lg p-4 mb-3 flex-row items-center border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Pressable
              onPress={() => router.push(`/workout/${item.id}`)}
              className="flex-1"
            >
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                {item.name}
              </Text>
              <Text className="text-sm" style={{ color: colors.muted }}>
                {new Date(item.date).toLocaleDateString()} ·{" "}
                {item.exercises.length} exercises
                {item.bodyWeight !== undefined
                  ? ` · ${item.bodyWeight} ${item.weightUnit ?? "kg"}`
                  : ""}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(item)}
              className="p-2 -mr-2"
              hitSlop={8}
            >
              <Ionicons name="trash" size={20} color="#dc2626" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
