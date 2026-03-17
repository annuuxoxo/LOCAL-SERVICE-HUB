import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { ServiceRequest, RequestStatus } from "@/context/AppContext";

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "time-outline",
  },
  accepted: {
    label: "Accepted",
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: "checkmark-circle-outline",
  },
  in_progress: {
    label: "In Progress",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "play-circle-outline",
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "checkmark-done-circle-outline",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
  },
  disputed: {
    label: "Disputed",
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "alert-circle-outline",
  },
};

interface RequestCardProps {
  request: ServiceRequest;
  currentUserId: string;
}

export function RequestCard({ request, currentUserId }: RequestCardProps) {
  const C = Colors.light;
  const status = STATUS_CONFIG[request.status];
  const isProvider = request.providerId === currentUserId;
  const otherName = isProvider ? request.seekerName : request.providerName;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/request/[id]",
      params: { id: request.id },
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={13} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        <Text style={styles.timeText}>{timeAgo(request.createdAt)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {request.serviceTitle}
      </Text>
      <Text style={styles.category}>
        {request.serviceCategory.charAt(0).toUpperCase() +
          request.serviceCategory.slice(1)}
      </Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.personRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.roleLabel}>
              {isProvider ? "Requested by" : "Provider"}
            </Text>
            <Text style={styles.personName}>{otherName}</Text>
          </View>
        </View>
        <View style={styles.priceSection}>
          <View
            style={[
              styles.escrowBadge,
              {
                backgroundColor:
                  request.escrow.status === "held"
                    ? "#EDE9FE"
                    : request.escrow.status === "released"
                      ? "#D1FAE5"
                      : "#FEE2E2",
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={
                request.escrow.status === "held"
                  ? "#7C3AED"
                  : request.escrow.status === "released"
                    ? "#10B981"
                    : "#EF4444"
              }
            />
            <Text
              style={[
                styles.escrowText,
                {
                  color:
                    request.escrow.status === "held"
                      ? "#7C3AED"
                      : request.escrow.status === "released"
                        ? "#10B981"
                        : "#EF4444",
                },
              ]}
            >
              {request.escrow.status === "held"
                ? "Escrow"
                : request.escrow.status === "released"
                  ? "Paid"
                  : "Refunded"}
            </Text>
          </View>
          <Text style={styles.priceText}>${request.price}</Text>
        </View>
      </View>

      <View style={styles.arrowRow}>
        <Feather name="chevron-right" size={16} color={C.textTertiary} />
      </View>
    </Pressable>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  timeText: {
    fontSize: 11,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  roleLabel: {
    fontSize: 10,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  personName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  priceSection: { alignItems: "flex-end", gap: 4 },
  escrowBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  escrowText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  arrowRow: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});
