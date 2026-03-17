import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { RequestCard } from "@/components/RequestCard";
import { useApp } from "@/context/AppContext";
import { RequestStatus } from "@/context/AppContext";

const TABS: { id: "all" | RequestStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "in_progress", label: "Active" },
  { id: "completed", label: "Done" },
];

export default function RequestsScreen() {
  const C = Colors.light;
  const { requests, currentUser, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<"all" | RequestStatus>("all");

  const myRequests = requests.filter(
    (r) =>
      r.seekerId === currentUser?.id || r.providerId === currentUser?.id
  );

  const filtered =
    activeTab === "all"
      ? myRequests
      : myRequests.filter((r) => r.status === activeTab);

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <Ionicons name="document-text-outline" size={56} color={C.textTertiary} />
        <Text style={styles.authTitle}>Track Your Requests</Text>
        <Text style={styles.authDesc}>
          Sign in to send and manage service requests
        </Text>
        <Pressable
          style={styles.authBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.authBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <Text style={styles.headerSub}>
          {myRequests.length} total request{myRequests.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? myRequests.length
              : myRequests.filter((r) => r.status === tab.id).length;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    activeTab === tab.id && styles.tabBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      activeTab === tab.id && styles.tabBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptyDesc}>
              {activeTab === "all"
                ? "Browse services and send your first request"
                : `No ${activeTab} requests`}
            </Text>
            {activeTab === "all" && (
              <Pressable
                style={styles.browseBtn}
                onPress={() => router.push("/(tabs)/index")}
              >
                <Text style={styles.browseBtnText}>Browse Services</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              currentUserId={currentUser?.id ?? ""}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  tabRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  tabLabelActive: { color: "#fff" },
  tabBadge: {
    backgroundColor: C.backgroundTertiary,
    borderRadius: 100,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textSecondary,
    fontFamily: "Inter_700Bold",
  },
  tabBadgeTextActive: { color: "#fff" },
  list: { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 100 },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  browseBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    backgroundColor: C.background,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  authDesc: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  authBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  authBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
