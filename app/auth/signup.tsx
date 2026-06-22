import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-3xl font-extrabold">Sign Up</Text>
        <Text className="text-gray-400 text-base text-center mt-3">
          Account creation is coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
