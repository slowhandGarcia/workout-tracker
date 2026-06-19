import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "@/store/useWorkoutStore";
import type { Workout } from "@/types";

export default function HistoryScreen() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  const completed = workouts.filter((w) => w.completedAt);

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
    <View className="flex-1 bg-white px-4 pt-4">
      <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-gray-400">No completed workouts yet.</Text>
        }
        renderItem={({ item }) => (
          <View className="border border-gray-200 rounded-lg p-4 mb-3 flex-row items-center">
            <Pressable
              onPress={() => router.push(`/workout/${item.id}`)}
              className="flex-1"
            >
              <Text className="text-base font-medium">{item.name}</Text>
              <Text className="text-gray-400 text-sm">
                {new Date(item.date).toLocaleDateString()} ·{" "}
                {item.exercises.length} exercises
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
