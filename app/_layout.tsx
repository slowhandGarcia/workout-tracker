import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useThemeStore } from "@/store/useThemeStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Validate any tokens left on the device against the API once at startup,
  // before any screen (e.g. Welcome's auto-redirect) trusts `user`/`isGuest`.
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: isDark ? "#09090b" : "#ffffff" },
            headerTintColor: isDark ? "#ffffff" : "#09090b",
            headerTitleStyle: { fontWeight: "600" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="workout/[id]" options={{ headerShown: true }} />
          <Stack.Screen name="exercise/[id]" options={{ headerShown: true }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
