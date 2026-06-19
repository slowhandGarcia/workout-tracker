import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useExerciseStore } from "@/store/useExerciseStore";
import { ExercisePickerModal } from "@/components/ExercisePickerModal";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SwipeableRow } from "@/components/SwipeableRow";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === id));
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const deleteExercise = useWorkoutStore((s) => s.deleteExercise);
  const addExerciseToWorkout = useWorkoutStore((s) => s.addExerciseToWorkout);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  const addWorkoutImages = useWorkoutStore((s) => s.addWorkoutImages);
  const removeWorkoutImage = useWorkoutStore((s) => s.removeWorkoutImage);
  const exercises = useExerciseStore((s) => s.exercises);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setIsViewerVisible(true);
  };

  const pickFromCamera = async (workoutId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera access needed",
        "Enable camera access in Settings to take a photo."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      addWorkoutImages(workoutId, [result.assets[0].uri]);
    }
  };

  const pickFromLibrary = async (workoutId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo access needed",
        "Enable photo library access in Settings to choose photos."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      addWorkoutImages(workoutId, result.assets.map((asset) => asset.uri));
    }
  };

  const handleAddPhoto = (workoutId: string) => {
    Alert.alert("Add Photo", undefined, [
      { text: "Take Photo", onPress: () => pickFromCamera(workoutId) },
      { text: "Choose from Library", onPress: () => pickFromLibrary(workoutId) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDeletePhoto = (workoutId: string, index: number) => {
    Alert.alert("Delete this photo?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeWorkoutImage(workoutId, index),
      },
    ]);
  };

  const handleDeleteSet = (workoutId: string, workoutExerciseId: string, setId: string) => {
    Alert.alert("Delete this set?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeSet(workoutId, workoutExerciseId, setId),
      },
    ]);
  };

  const handleDeleteExercise = (workoutId: string, workoutExerciseId: string) => {
    Alert.alert("Delete this entire exercise and all its sets?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteExercise(workoutId, workoutExerciseId),
      },
    ]);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      "Delete this entire workout?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteWorkout(workoutId);
            router.back();
          },
        },
      ]
    );
  };

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ title: "Workout Details" }} />
        <Text className="text-gray-400">Workout not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <Stack.Screen
        options={{ title: workout.completedAt ? "Workout Details" : "New Workout" }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-4 pt-4">
          <Text className="text-xl font-bold mb-4">{workout.name}</Text>

          <FlatList
            className="flex-1"
            data={workout.exercises}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const exercise = exercises.find((e) => e.id === item.exerciseId);
              return (
                <View className="border border-gray-200 rounded-lg p-3 mb-3">
                  <SwipeableRow onDelete={() => handleDeleteExercise(workout.id, item.id)}>
                    <View className="flex-row items-center justify-between mb-2 bg-white">
                      <Text className="font-semibold">{exercise?.name ?? "Unknown"}</Text>
                      <Pressable
                        onPress={() => handleDeleteExercise(workout.id, item.id)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash" size={18} color="#dc2626" />
                      </Pressable>
                    </View>
                  </SwipeableRow>
                  {item.sets.map((set, idx) => (
                    <SwipeableRow
                      key={set.id}
                      onDelete={() => handleDeleteSet(workout.id, item.id, set.id)}
                    >
                      <View className="flex-row items-center gap-2 mb-2 bg-white">
                        <Text className="w-6 text-gray-400">{idx + 1}</Text>
                        <TextInput
                          className="border border-gray-200 rounded px-2 py-1 w-16 text-center"
                          keyboardType="numeric"
                          placeholder="lbs"
                          value={set.weight ? String(set.weight) : ""}
                          onChangeText={(v) =>
                            updateSet(workout.id, item.id, set.id, { weight: Number(v) || 0 })
                          }
                        />
                        <TextInput
                          className="border border-gray-200 rounded px-2 py-1 w-16 text-center"
                          keyboardType="numeric"
                          placeholder="reps"
                          value={set.reps ? String(set.reps) : ""}
                          onChangeText={(v) =>
                            updateSet(workout.id, item.id, set.id, { reps: Number(v) || 0 })
                          }
                        />
                        <Pressable
                          onPress={() => handleDeleteSet(workout.id, item.id, set.id)}
                          hitSlop={8}
                          className="ml-1"
                        >
                          <Ionicons name="trash" size={18} color="#dc2626" />
                        </Pressable>
                      </View>
                    </SwipeableRow>
                  ))}
                  <Pressable onPress={() => addSet(workout.id, item.id)}>
                    <Text className="text-blue-600 text-sm">+ Add Set</Text>
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text className="text-gray-400 mb-3">No exercises added yet.</Text>
            }
            contentContainerStyle={{ paddingBottom: 12 }}
          />

          <View className="pt-3 gap-3">
            <PhotoGallery
              images={workout.images}
              onPressPhoto={openViewer}
              onLongPressPhoto={(index) => handleDeletePhoto(workout.id, index)}
              onAddPhoto={() => handleAddPhoto(workout.id)}
            />

            <Pressable
              onPress={() => setIsPickerVisible(true)}
              className="border border-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-blue-600 font-medium">+ Add Exercise</Text>
            </Pressable>

            {!workout.completedAt && (
              <Pressable
                onPress={() => {
                  finishWorkout(workout.id);
                  router.back();
                }}
                className="bg-blue-600 rounded-xl py-3.5 items-center"
              >
                <Text className="text-white text-base font-semibold">Finish Workout</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => handleDeleteWorkout(workout.id)}
              className="bg-red-600 rounded-xl py-3.5 items-center"
            >
              <Text className="text-white text-base font-semibold">Delete Workout</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ExercisePickerModal
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={(exercise) => addExerciseToWorkout(workout.id, exercise.id)}
      />

      <FullScreenImageViewer
        visible={isViewerVisible}
        images={workout.images}
        initialIndex={viewerIndex}
        onClose={() => setIsViewerVisible(false)}
      />
    </SafeAreaView>
  );
}
