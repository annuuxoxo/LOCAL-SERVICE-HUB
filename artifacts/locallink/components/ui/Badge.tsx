import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info" | "escrow";
  size?: "sm" | "md";
}

export function Badge({ label, variant = "default", size = "md" }: BadgeProps) {
  const C = Colors.light;
  const styles_ = {
    default: { bg: C.backgroundTertiary, text: C.textSecondary },
    success: { bg: C.successLight, text: C.success },
    warning: { bg: C.warningLight, text: C.warning },
    error: { bg: C.errorLight, text: C.error },
    info: { bg: C.infoLight, text: C.info },
    escrow: { bg: C.escrowLight, text: C.escrow },
  };
  const s = styles_[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: s.bg },
        size === "sm" && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: s.text },
          size === "sm" && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 2 },
  text: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  textSm: { fontSize: 10 },
});
