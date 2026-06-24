import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useExerciseStore } from "@/store/useExerciseStore";
import { useThemeColors } from "@/store/useThemeStore";
import { ExercisePickerModal } from "@/components/ExercisePickerModal";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SwipeableRow } from "@/components/SwipeableRow";
import type { WeightUnit } from "@/types";

const KG_TO_LBS = 2.20462;

function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  const converted = from === "kg" ? value * KG_TO_LBS : value / KG_TO_LBS;
  return Math.round(converted * 10) / 10;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
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
  const setBodyWeight = useWorkoutStore((s) => s.setBodyWeight);
  const setNotes = useWorkoutStore((s) => s.setNotes);
  const exercises = useExerciseStore((s) => s.exercises);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [weightText, setWeightText] = useState(() =>
    workout?.bodyWeight !== undefined ? String(workout.bodyWeight) : ""
  );

  // Re-sync the raw text only when switching to a different workout, not on
  // every store update — otherwise typing a trailing "." would immediately
  // get round-tripped through Number() and stripped back to an integer.
  useEffect(() => {
    setWeightText(workout?.bodyWeight !== undefined ? String(workout.bodyWeight) : "");
  }, [workout?.id]);

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
          onPress: async () => {
            setIsDeleting(true);
            const result = await deleteWorkout(workoutId);
            setIsDeleting(false);
            if (!result.success) {
              Alert.alert("Couldn't delete workout", result.error);
              return;
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleFinishWorkout = async (workoutId: string) => {
    setIsFinishing(true);
    const result = await finishWorkout(workoutId);
    setIsFinishing(false);
    if (!result.success) {
      Alert.alert(
        "Workout saved, but didn't sync",
        `${result.error}\n\nIt's saved on this device — you can try again later.`
      );
    }
    router.back();
  };

  const handleWeightChange = (text: string) => {
    // Allow only digits with at most one decimal point (e.g. "75", "75.",
    // "75.5"), so the field can hold valid intermediate typing states.
    if (!/^\d*\.?\d*$/.test(text)) return;
    setWeightText(text);

    if (!workout) return;
    const unit = workout.weightUnit ?? "kg";
    if (text === "" || text === ".") {
      setBodyWeight(workout.id, undefined, unit);
      return;
    }
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      setBodyWeight(workout.id, parsed, unit);
    }
  };

  // Explicit, controlled back navigation rather than relying on the header's
  // implicit default back button — also gives somewhere sensible to go
  // (Home) if this screen was somehow reached with no back history at all
  // (e.g. a deep link), instead of being a dead end.
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const renderBackButton = () => (
    <Pressable onPress={handleGoBack} hitSlop={12} className="px-2 -ml-2">
      <Ionicons name="chevron-back" size={28} color={colors.text} />
    </Pressable>
  );

  const handleUnitChange = (newUnit: WeightUnit) => {
    if (!workout) return;
    const currentUnit = workout.weightUnit ?? "kg";
    if (newUnit === currentUnit) return;
    const converted =
      workout.bodyWeight !== undefined
        ? convertWeight(workout.bodyWeight, currentUnit, newUnit)
        : undefined;
    setBodyWeight(workout.id, converted, newUnit);
    setWeightText(converted !== undefined ? String(converted) : "");
  };

  if (!workout) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Stack.Screen
          options={{
            title: "Workout Details",
            headerBackTitle: "Back",
            headerLeft: renderBackButton,
          }}
        />
        <Text style={{ color: colors.muted }}>Workout not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={["bottom"]}
      style={{ backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          title: workout.completedAt ? "Workout Details" : "New Workout",
          headerBackTitle: "Back",
          headerLeft: renderBackButton,
        }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-4 pt-4">
          <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
            {workout.name}
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.muted }}>
              Body Weight
            </Text>
            {workout.completedAt ? (
              <View
                className="rounded-lg px-3 py-2.5 border flex-row items-center"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <Ionicons name="body-outline" size={16} color={colors.muted} />
                <Text className="ml-2" style={{ color: colors.text }}>
                  {workout.bodyWeight !== undefined
                    ? `${workout.bodyWeight} ${workout.weightUnit ?? "kg"}`
                    : "Not recorded"}
                </Text>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg px-3 py-2.5 border"
                  style={{ borderColor: colors.border, color: colors.text }}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  placeholder="Enter your current weight"
                  value={weightText}
                  onChangeText={handleWeightChange}
                />
                <View
                  className="flex-row rounded-lg border overflow-hidden"
                  style={{ borderColor: colors.border }}
                >
                  {(["kg", "lbs"] as const).map((unit) => {
                    const isActive = (workout.weightUnit ?? "kg") === unit;
                    return (
                      <Pressable
                        key={unit}
                        onPress={() => handleUnitChange(unit)}
                        className="px-3 items-center justify-center"
                        style={{ backgroundColor: isActive ? "#2563eb" : colors.surface }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{ color: isActive ? "#ffffff" : colors.muted }}
                        >
                          {unit}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.muted }}>
              Notes
            </Text>
            <TextInput
              className="rounded-lg px-3 py-2.5 border"
              style={{ borderColor: colors.border, color: colors.text, minHeight: 44 }}
              placeholderTextColor={colors.placeholder}
              placeholder="How did it go?"
              multiline
              value={workout.notes ?? ""}
              onChangeText={(text) => setNotes(workout.id, text)}
            />
          </View>

          <FlatList
            className="flex-1"
            data={workout.exercises}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const exercise = exercises.find((e) => e.id === item.exerciseId);
              return (
                <View
                  className="rounded-lg p-3 mb-3 border"
                  style={{ borderColor: colors.border }}
                >
                  <SwipeableRow onDelete={() => handleDeleteExercise(workout.id, item.id)}>
                    <View
                      className="flex-row items-center justify-between mb-2"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <Text className="font-semibold" style={{ color: colors.text }}>
                        {exercise?.name ?? "Unknown"}
                      </Text>
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
                      <View
                        className="flex-row items-center gap-2 mb-2"
                        style={{ backgroundColor: colors.surface }}
                      >
                        <Text className="w-6" style={{ color: colors.muted }}>
                          {idx + 1}
                        </Text>
                        <TextInput
                          className="rounded px-2 py-1 w-16 text-center border"
                          style={{ borderColor: colors.border, color: colors.text }}
                          placeholderTextColor={colors.placeholder}
                          keyboardType="numeric"
                          placeholder="lbs"
                          value={set.weight ? String(set.weight) : ""}
                          onChangeText={(v) =>
                            updateSet(workout.id, item.id, set.id, { weight: Number(v) || 0 })
                          }
                        />
                        <TextInput
                          className="rounded px-2 py-1 w-16 text-center border"
                          style={{ borderColor: colors.border, color: colors.text }}
                          placeholderTextColor={colors.placeholder}
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
              <Text className="mb-3" style={{ color: colors.muted }}>
                No exercises added yet.
              </Text>
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
                onPress={() => handleFinishWorkout(workout.id)}
                disabled={isFinishing}
                className="bg-blue-600 rounded-xl py-3.5 items-center"
                style={{ opacity: isFinishing ? 0.7 : 1 }}
              >
                {isFinishing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">Finish Workout</Text>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => handleDeleteWorkout(workout.id)}
              disabled={isDeleting}
              className="bg-red-600 rounded-xl py-3.5 items-center"
              style={{ opacity: isDeleting ? 0.7 : 1 }}
            >
              {isDeleting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-semibold">Delete Workout</Text>
              )}
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
