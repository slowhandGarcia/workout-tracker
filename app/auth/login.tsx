import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";

export default function LogInScreen() {
  const setGuest = useAuthStore((s) => s.setGuest);
  const setEmail = useProfileStore((s) => s.setEmail);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-3xl font-extrabold">Log In</Text>
        <Text className="text-gray-400 text-base text-center mt-3">
          Login is coming soon.
        </Text>

        <Pressable
          onPress={() => {
            setGuest(false);
            setEmail("demo.user@example.com");
            router.replace("/(tabs)/home");
          }}
          className="bg-blue-600 rounded-2xl py-4 px-8 items-center mt-8 active:opacity-80"
        >
          <Text className="text-white text-base font-bold">Continue (Demo Log In)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
