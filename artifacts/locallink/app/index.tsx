import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

const FEATURES = [
  { icon: "location", label: "Local services near you" },
  { icon: "shield-checkmark", label: "Secure escrow payments" },
  { icon: "star", label: "Verified providers" },
];

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, userLocation } = useApp();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!userLocation) {
        router.replace("/set-location");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, userLocation]);

  if (isLoading) return null;

  return (
    <LinearGradient
      colors={["#1B3A6B", "#2A5298", "#1B3A6B"]}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.topSection}>
        <View style={styles.logoBox}>
          <Ionicons name="location" size={36} color="#fff" />
        </View>
        <Text style={styles.appName}>LocalLink</Text>
        <Text style={styles.tagline}>Your Neighbourhood,{"\n"}Your Services</Text>
      </View>

      <View style={styles.illustrationBox}>
        <View style={styles.cardRow}>
          {[
            { icon: "construct", label: "Repair", color: "#10B981" },
            { icon: "sparkles", label: "Cleaning", color: "#06B6D4" },
            { icon: "restaurant", label: "Home Food", color: "#F97316" },
          ].map((item) => (
            <View key={item.label} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: item.color + "22" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.cardRow}>
          {[
            { icon: "book", label: "Tutoring", color: "#3B82F6" },
            { icon: "cut", label: "Tailoring", color: "#8B5CF6" },
            { icon: "flower", label: "Beauty", color: "#EC4899" },
          ].map((item) => (
            <View key={item.label} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: item.color + "22" }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.trustRow}>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.trustItem}>
            <Ionicons name={f.icon as any} size={18} color="#FF6B47" />
            <Text style={styles.trustLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#1B3A6B" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.guestBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.guestBtnText}>Browse as guest</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(255,107,71,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#FF6B47",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 26,
  },
  illustrationBox: {
    gap: 12,
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  featureCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  featureLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textAlign: "center",
  },
  trustRow: {
    gap: 10,
    marginBottom: 28,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  bottomSection: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF6B47",
    borderRadius: 16,
    paddingVertical: 17,
    shadowColor: "#FF6B47",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  guestBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  guestBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
