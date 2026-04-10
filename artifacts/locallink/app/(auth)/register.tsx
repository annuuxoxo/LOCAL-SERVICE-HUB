import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { UserRole } from "@/context/AppContext";
import { api } from "@/lib/api";

export default function RegisterScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("seeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.auth.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      await login({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        rating: user.rating ?? 0,
        reviewCount: user.reviewCount ?? 0,
        isVerified: user.isVerified ?? false,
        joinedAt: user.joinedAt ?? new Date().toISOString(),
        completedJobs: user.completedJobs ?? 0,
        earnings: user.earnings ?? 0,
      }, token);
      router.replace("/set-location");
    } catch (err: any) {
      setError(err?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headline}>Join LocalLink</Text>
        <Text style={styles.subtitle}>
          Discover and offer local services in your community
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={C.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>I am a...</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleCard, role === "seeker" && styles.roleCardActive]}
            onPress={() => setRole("seeker")}
          >
            <Ionicons
              name="search"
              size={24}
              color={role === "seeker" ? C.primary : C.textTertiary}
            />
            <Text
              style={[
                styles.roleTitle,
                role === "seeker" && { color: C.primary },
              ]}
            >
              Service Seeker
            </Text>
            <Text style={styles.roleDesc}>
              Looking for local services & providers
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.roleCard,
              role === "provider" && styles.roleCardActive,
            ]}
            onPress={() => setRole("provider")}
          >
            <Ionicons
              name="briefcase"
              size={24}
              color={role === "provider" ? C.primary : C.textTertiary}
            />
            <Text
              style={[
                styles.roleTitle,
                role === "provider" && { color: C.primary },
              ]}
            >
              Service Provider
            </Text>
            <Text style={styles.roleDesc}>
              Offer your skills to the community
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color={C.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={C.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color={C.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color={C.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={C.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed || loading ? 0.85 : 1 },
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Already have an account?</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: C.error, fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleCard: {
    flex: 1,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },
  roleCardActive: {
    backgroundColor: "#EBF0FA",
    borderColor: C.primary,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  roleDesc: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    alignItems: "center",
  },
  loginLabel: {
    color: C.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  loginLink: {
    color: C.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
