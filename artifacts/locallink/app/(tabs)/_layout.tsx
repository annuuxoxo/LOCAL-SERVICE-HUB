import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

let isLiquidGlassAvailable: () => boolean = () => false;
let NativeTabs: any = null;
let Icon: any = null;
let Label: any = null;
let NativeBadge: any = null;

try {
  const glassEffect = require("expo-glass-effect");
  isLiquidGlassAvailable = glassEffect.isLiquidGlassAvailable ?? (() => false);
} catch {}

try {
  const nativeTabs = require("expo-router/unstable-native-tabs");
  NativeTabs = nativeTabs.NativeTabs;
  Icon = nativeTabs.Icon;
  Label = nativeTabs.Label;
  NativeBadge = nativeTabs.Badge;
} catch {}

function NativeTabLayout() {
  const { getUnreadNotificationCount } = useApp();
  const unread = getUnreadNotificationCount();
  if (!NativeTabs) return <ClassicTabLayout />;
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="requests">
        <Icon sf={{ default: "doc.text", selected: "doc.text.fill" }} />
        <Label>Requests</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Messages</Label>
        {unread > 0 && NativeBadge && <NativeBadge>{unread}</NativeBadge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const C = Colors.light;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { getUnreadNotificationCount } = useApp();
  const unread = getUnreadNotificationCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#000" : "#fff",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: isDark ? "#333" : C.border,
          elevation: 0,
          ...(isWeb ? { height: 60 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? "#000" : "#fff" },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={24} />
            ) : (
              <Feather name="map" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="doc.text" tintColor={color} size={24} />
            ) : (
              <Feather name="file-text" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message" tintColor={color} size={24} />
            ) : (
              <Feather name="message-square" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
