import { useState } from "react";
import { Pressable } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useThemeStore } from "@/store/useThemeStore";
import { SideMenu } from "@/components/SideMenu";
import { SettingsModal } from "@/components/SettingsModal";

export default function TabsLayout() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: isDark ? "#71717a" : "#9ca3af",
        tabBarStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff",
          borderTopColor: isDark ? "#27272a" : "#e5e7eb",
        },
        headerStyle: { backgroundColor: isDark ? "#09090b" : "#ffffff" },
        headerTintColor: isDark ? "#ffffff" : "#09090b",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          headerLeft: () => (
            <Pressable
              onPress={() => setIsMenuVisible(true)}
              hitSlop={12}
              className="px-4"
            >
              <Ionicons
                name="menu"
                size={26}
                color={isDark ? "#ffffff" : "#09090b"}
              />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Exercises",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>

    <SideMenu
      visible={isMenuVisible}
      onClose={() => setIsMenuVisible(false)}
      onOpenSettings={() => setIsSettingsVisible(true)}
    />
    <SettingsModal visible={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} />
    </>
  );
}
