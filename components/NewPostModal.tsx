import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColors } from "@/store/useThemeStore";

interface NewPostModalProps {
  visible: boolean;
  onClose: () => void;
  onPost: (text: string, images: string[]) => void;
}

export function NewPostModal({ visible, onClose, onPost }: NewPostModalProps) {
  const colors = useThemeColors();
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const reset = () => {
    setText("");
    setImages([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickFromCamera = async () => {
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
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickFromLibrary = async () => {
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
      setImages((prev) => [...prev, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert("Add Photo", undefined, [
      { text: "Take Photo", onPress: pickFromCamera },
      { text: "Choose from Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePost = () => {
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;
    onPost(trimmed, images);
    reset();
    onClose();
  };

  const canPost = text.trim().length > 0 || images.length > 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView
        className="flex-1"
        edges={["top", "bottom"]}
        style={{ backgroundColor: colors.background }}
      >
        <Text className="text-base font-semibold text-center py-3" style={{ color: colors.text }}>
          New Post
        </Text>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 px-4">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.placeholder}
              multiline
              className="text-base mb-4"
              style={{ minHeight: 100, textAlignVertical: "top", color: colors.text }}
            />

            <FlatList
              data={images}
              keyExtractor={(uri, index) => `${uri}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item: uri, index }) => (
                <View>
                  <Image
                    source={{ uri }}
                    style={{ width: 80, height: 80, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    hitSlop={6}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="#ffffff" />
                  </Pressable>
                </View>
              )}
              ListFooterComponent={
                <Pressable
                  onPress={handleAddPhoto}
                  className="w-20 h-20 rounded-xl border border-dashed items-center justify-center"
                  style={{ borderColor: colors.border }}
                >
                  <Ionicons name="camera" size={22} color="#2563eb" />
                  <Text className="text-blue-600 text-xs mt-1">Add</Text>
                </Pressable>
              }
            />
          </View>

          <View className="flex-row gap-3 px-4 pt-3 pb-3">
            <Pressable
              onPress={handleClose}
              className="flex-1 rounded-xl py-3.5 items-center border"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handlePost}
              disabled={!canPost}
              className="flex-1 rounded-xl py-3.5 items-center"
              style={{ backgroundColor: canPost ? "#2563eb" : colors.surface }}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: canPost ? "#ffffff" : colors.muted }}
              >
                Post
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
