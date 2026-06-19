import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: "#111827" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontWeight: "600" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[id]" options={{ headerShown: true }} />
          <Stack.Screen name="exercise/[id]" options={{ headerShown: true }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
