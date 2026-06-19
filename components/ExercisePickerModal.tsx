import { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TextInput, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useExerciseStore } from "@/store/useExerciseStore";
import type { Exercise, MuscleGroup } from "@/types";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "cardio",
  "full body",
];

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  startInCreateMode?: boolean;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  startInCreateMode = false,
}: ExercisePickerModalProps) {
  const exercises = useExerciseStore((s) => s.exercises);
  const addExercise = useExerciseStore((s) => s.addExercise);

  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState<MuscleGroup>("chest");

  useEffect(() => {
    if (visible && startInCreateMode) setIsCreating(true);
  }, [visible, startInCreateMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  const reset = () => {
    setQuery("");
    setIsCreating(false);
    setNewName("");
    setNewMuscleGroup("chest");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    handleClose();
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    addExercise({ name, muscleGroup: newMuscleGroup });
    const created = useExerciseStore
      .getState()
      .exercises.find((e) => e.name === name && e.isCustom);
    if (created) handleSelect(created);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-white pt-14 px-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold">
            {isCreating ? "New Exercise" : "Add Exercise"}
          </Text>
          <Pressable onPress={handleClose} className="p-1">
            <Ionicons name="close" size={26} color="#374151" />
          </Pressable>
        </View>

        {isCreating ? (
          <View>
            <Text className="text-sm text-gray-500 mb-1">Name</Text>
            <TextInput
              autoFocus
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Cable Fly"
              className="border border-gray-200 rounded-lg px-3 py-2 mb-4"
            />

            <Text className="text-sm text-gray-500 mb-2">Muscle Group</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {MUSCLE_GROUPS.map((group) => (
                <Pressable
                  key={group}
                  onPress={() => setNewMuscleGroup(group)}
                  className={`px-3 py-1.5 rounded-full border ${
                    newMuscleGroup === group
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  <Text
                    className={`capitalize text-sm ${
                      newMuscleGroup === group ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {group}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={!newName.trim()}
              className={`rounded-xl py-3 items-center mb-3 ${
                newName.trim() ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-semibold ${
                  newName.trim() ? "text-white" : "text-gray-400"
                }`}
              >
                Add & Select
              </Text>
            </Pressable>
            <Pressable onPress={() => setIsCreating(false)} className="items-center py-2">
              <Text className="text-gray-500">Back to list</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="flex-row items-center border border-gray-200 rounded-lg px-3 mb-4">
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises"
                className="flex-1 py-2 px-2"
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  className="border border-gray-200 rounded-lg p-3 mb-2 flex-row justify-between items-center"
                >
                  <Text className="text-base font-medium">{item.name}</Text>
                  <Text className="text-gray-400 text-sm capitalize">
                    {item.muscleGroup}
                  </Text>
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
              onPress={() => {
                setIsCreating(true);
                setNewName(query);
              }}
              className="border border-blue-600 rounded-xl py-3 items-center mb-6"
            >
              <Text className="text-blue-600 font-medium">+ Create Custom Exercise</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}
