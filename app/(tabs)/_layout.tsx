import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { getDarkModePref } from "../../storage/expenseStorage";

const lightColors = {
  background: "#f5f5f7",
  card: "#ffffff",
  text: "#1c1c1e",
  subtext: "#8e8e93",
  accent: "#007aff",
};

const darkColors = {
  background: "#000000",
  card: "#1c1c1e",
  text: "#ffffff",
  subtext: "#98989f",
  accent: "#0a84ff",
};

export default function TabLayout() {
  const systemScheme = useColorScheme();
  const segments = useSegments();
  const [darkMode, setDarkMode] = useState(systemScheme === "dark");

  useEffect(() => {
    getDarkModePref().then((saved) => {
      if (saved !== null) setDarkMode(saved);
    });
  }, [segments]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "darkModeChanged",
      (value: boolean) => {
        setDarkMode(value);
      },
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    getDarkModePref().then((saved) => {
      if (saved !== null) setDarkMode(saved);
    });
  }, [segments]);

  const theme = darkMode ? darkColors : lightColors;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.subtext,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.subtext + "20",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
