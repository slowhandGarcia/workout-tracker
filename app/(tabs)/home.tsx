import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "@/store/useWorkoutStore";
import type { Workout } from "@/types";

export default function HomeScreen() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);

  const recent = workouts.slice(0, 5);

  const onStartWorkout = () => {
    const id = startWorkout(`Workout ${new Date().toLocaleDateString()}`);
    router.push(`/workout/${id}`);
  };

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
      <Pressable
        onPress={onStartWorkout}
        className="bg-blue-600 rounded-xl py-4 items-center mb-6 active:opacity-80"
      >
        <Text className="text-white text-lg font-semibold">Start New Workout</Text>
      </Pressable>

      <Text className="text-base font-semibold text-gray-500 mb-2">Recent Workouts</Text>

      <FlatList
        data={recent}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-gray-400">No workouts logged yet.</Text>
        }
        renderItem={({ item }) => (
          <View className="border border-gray-200 rounded-lg p-4 mb-3 flex-row items-center">
            <Pressable
              onPress={() => router.push(`/workout/${item.id}`)}
              className="flex-1"
            >
              <Text className="text-base font-medium">{item.name}</Text>
              <Text className="text-gray-400 text-sm">
                {new Date(item.date).toLocaleString()}
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
