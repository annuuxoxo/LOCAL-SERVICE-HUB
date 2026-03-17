import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: "#FAFAFA" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Create Account" }} />
    </Stack>
  );
}
