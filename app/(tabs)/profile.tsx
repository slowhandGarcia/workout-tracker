import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useProfileStore } from "@/store/useProfileStore";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useThemeColors } from "@/store/useThemeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { SettingsModal } from "@/components/SettingsModal";

export default function ProfileScreen() {
  const { name, bio, location, email, createdAt, avatarUri, setName, setBio, setLocation, setAvatar } =
    useProfileStore();
  const workouts = useWorkoutStore((s) => s.workouts);
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const colors = useThemeColors();

  const memberSince = new Date(user?.createdAt ?? createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [bioDraft, setBioDraft] = useState(bio);
  const [locationDraft, setLocationDraft] = useState(location);

  const completedWorkouts = workouts.filter((w) => w.completedAt);
  const totalSets = completedWorkouts.reduce(
    (sum, w) => sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0),
    0
  );

  const handleChangeAvatar = () => {
    Alert.alert("Change Profile Photo", undefined, [
      { text: "Take Photo", onPress: pickFromCamera },
      { text: "Choose from Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access needed", "Enable camera access in Settings to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo access needed",
        "Enable photo library access in Settings to choose a photo."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri);
  };

  const saveName = () => {
    setName(nameDraft.trim() || "Your Name");
    setIsEditingName(false);
  };

  const saveProfile = () => {
    setBio(bioDraft.trim());
    setLocation(locationDraft.trim());
    Alert.alert("Profile saved", "Your bio and location have been updated.");
  };

  const confirmLogout = () => {
    Alert.alert("Log out of your account?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Pressable
        onPress={() => setIsSettingsVisible(true)}
        hitSlop={8}
        className="absolute top-4 right-4 z-10 w-10 h-10 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.surface }}
      >
        <Ionicons name="settings-outline" size={20} color={colors.text} />
      </Pressable>

      <View className="items-center pt-6 pb-4">
        <Pressable onPress={handleChangeAvatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="w-24 h-24 rounded-full items-center justify-center border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Ionicons name="person" size={40} color={colors.muted} />
            </View>
          )}
          <View
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center border-2"
            style={{ backgroundColor: "#2563eb", borderColor: colors.background }}
          >
            <Ionicons name="camera" size={14} color="#ffffff" />
          </View>
        </Pressable>

        {isEditingName ? (
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            onBlur={saveName}
            onSubmitEditing={saveName}
            autoFocus
            className="text-xl font-bold text-center mt-3"
            style={{ color: colors.text, minWidth: 160 }}
          />
        ) : (
          <Pressable onPress={() => setIsEditingName(true)}>
            <Text className="text-xl font-bold mt-3" style={{ color: colors.text }}>
              {name}
            </Text>
          </Pressable>
        )}

        {!!bio && (
          <Text className="text-center mt-1 px-8" style={{ color: colors.muted }}>
            {bio}
          </Text>
        )}

        {!!location && (
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text className="ml-1" style={{ color: colors.muted }}>
              {location}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-4 mt-2">
        <View
          className="flex-1 rounded-xl p-5 items-center border"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {completedWorkouts.length}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.muted }}>
            Total Workouts
          </Text>
        </View>
        <View
          className="flex-1 rounded-xl p-5 items-center border"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {totalSets}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.muted }}>
            Total Sets
          </Text>
        </View>
      </View>

      <View
        className="rounded-xl p-4 mt-4 border"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
          Edit Profile
        </Text>

        <Text className="text-xs font-medium mb-1" style={{ color: colors.muted }}>
          Short Bio
        </Text>
        <TextInput
          value={bioDraft}
          onChangeText={setBioDraft}
          placeholder="Add a short bio about yourself."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
            minHeight: 80,
          }}
        />

        <Text className="text-xs font-medium mb-1 mt-4" style={{ color: colors.muted }}>
          Location
        </Text>
        <TextInput
          value={locationDraft}
          onChangeText={setLocationDraft}
          placeholder="City, Country"
          placeholderTextColor={colors.muted}
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          }}
        />

        <Pressable
          onPress={saveProfile}
          className="rounded-lg p-3 items-center mt-4"
          style={{ backgroundColor: "#2563eb" }}
        >
          <Text className="font-semibold" style={{ color: "#ffffff" }}>
            Save Profile
          </Text>
        </Pressable>
      </View>

      <View
        className="rounded-xl p-4 mt-4 border"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
          Account
        </Text>

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="mail-outline" size={16} color={colors.muted} />
            <Text className="text-sm" style={{ color: colors.muted }}>
              Email
            </Text>
          </View>
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {isGuest ? "Guest Account" : email ?? "—"}
          </Text>
        </View>

        <View
          className="flex-row items-center justify-between py-2 border-t"
          style={{ borderColor: colors.border }}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color={colors.muted} />
            <Text className="text-sm" style={{ color: colors.muted }}>
              Member since
            </Text>
          </View>
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            {memberSince}
          </Text>
        </View>
      </View>

      {isGuest ? (
        <Pressable
          onPress={() => router.push("/auth/login")}
          className="rounded-xl py-3.5 items-center mt-4 mb-2 active:opacity-80"
          style={{ backgroundColor: "#2563eb" }}
        >
          <Text className="text-base font-bold text-white">Log In</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={confirmLogout}
          className="rounded-xl py-3.5 items-center mt-4 mb-2 border-2 border-red-600 active:opacity-70"
        >
          <Text className="text-base font-bold text-red-600">Log Out</Text>
        </Pressable>
      )}

      <SettingsModal visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
    </ScrollView>
  );
}
