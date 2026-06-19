import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useExerciseStore } from "@/store/useExerciseStore";
import { ExercisePickerModal } from "@/components/ExercisePickerModal";

export default function ExercisesScreen() {
  const exercises = useExerciseStore((s) => s.exercises);
  const [query, setQuery] = useState("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <View className="flex-row items-center border border-gray-200 rounded-lg px-3 mb-4">
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          className="flex-1 py-2 px-2"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/exercise/${item.id}`)}
            className="border border-gray-200 rounded-lg p-4 mb-3 flex-row justify-between items-center"
          >
            <Text className="text-base font-medium">{item.name}</Text>
            <Text className="text-gray-400 text-sm capitalize">{item.muscleGroup}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-4">
            No exercises match "{query}"
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      <Pressable
        onPress={() => setIsCreateModalVisible(true)}
        className="border border-blue-600 rounded-xl py-3 items-center mb-3"
      >
        <Text className="text-blue-600 font-medium">+ Add Custom Exercise</Text>
      </Pressable>

      <ExercisePickerModal
        visible={isCreateModalVisible}
        startInCreateMode
        onClose={() => setIsCreateModalVisible(false)}
        onSelect={() => setIsCreateModalVisible(false)}
      />
    </View>
  );
}
