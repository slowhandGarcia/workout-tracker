import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api, getApiErrorMessage } from "@/lib/api";
import { applyAuthSession } from "@/store/useAuthStore";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      console.log("🔄 Trying to sign up with:", { email, username, password: "****" });
      console.log("Backend URL being used:", api.defaults.baseURL);

      // NOTE: `api`'s baseURL already ends in `/api` (see lib/api.ts), so the
      // path here must NOT repeat that prefix — "/api/auth/register/" would
      // 404 against ".../api/api/auth/register/". This was the actual bug
      // behind the generic "Sign up failed." message: a 404 has no DRF-shaped
      // error body, so getApiErrorMessage() had nothing to parse and fell
      // back to the generic text every time.
      const response = await api.post("/auth/register/", {
        email,
        username,
        password,
        password2: confirmPassword,
      });

      console.log("✅ Signup successful:", response.data);
      await applyAuthSession(response.data.user, response.data.access, response.data.refresh);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.error("❌ Full Signup Error:", err);
      console.error("Error Response:", err.response?.data);
      console.error("Status Code:", err.response?.status);

      const message = getApiErrorMessage(err);
      setError(message);
      Alert.alert("Sign Up Failed", message || "Something went wrong. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center px-4 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={8} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-white text-3xl font-extrabold">Create Account</Text>
          <Text className="text-gray-400 text-base mt-2 mb-6">
            Sign up to sync your progress across devices.
          </Text>

          {error && (
            <View className="bg-red-600/10 border border-red-600 rounded-xl px-4 py-3 mb-4">
              {error.split("\n").map((line, index) => (
                <Text
                  key={index}
                  className="text-red-500 text-sm"
                  style={{ marginTop: index > 0 ? 4 : 0 }}
                >
                  {line}
                </Text>
              ))}
            </View>
          )}

          <Text className="text-gray-400 text-xs font-medium mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white mb-4"
          />

          <Text className="text-gray-400 text-xs font-medium mb-1">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white mb-4"
          />

          <Text className="text-gray-400 text-xs font-medium mb-1">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor="#6b7280"
            secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white mb-4"
          />

          <Text className="text-gray-400 text-xs font-medium mb-1">Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white mb-6"
          />

          <Pressable
            onPress={handleSignUp}
            disabled={isSubmitting}
            className="bg-blue-600 rounded-2xl py-4 items-center active:opacity-80"
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-bold">Sign Up</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace("/auth/login")}
            className="items-center mt-5 mb-6"
          >
            <Text className="text-gray-400 text-sm">
              Already have an account? <Text className="text-blue-500 font-semibold">Log In</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
