import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Conversation } from "@/context/AppContext";

function ConversationRow({
  conv,
  currentUserId,
}: {
  conv: Conversation;
  currentUserId: string;
}) {
  const C = Colors.light;
  const otherId = conv.participantIds.find((id) => id !== currentUserId) ?? "";
  const otherName = conv.participantNames[otherId] ?? "Unknown";

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/chat/[id]", params: { id: conv.id } });
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{otherName.charAt(0)}</Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={[styles.name, conv.unreadCount > 0 && styles.nameBold]}>
            {otherName}
          </Text>
          <Text style={styles.time}>{timeAgo(conv.lastMessageTime)}</Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.preview, conv.unreadCount > 0 && styles.previewBold]}
            numberOfLines={1}
          >
            {conv.lastMessage ?? "Start a conversation"}
          </Text>
          {conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const C = Colors.light;
  const { conversations, currentUser, isAuthenticated } = useApp();

  const myConvos = conversations.filter((c) =>
    c.participantIds.includes(currentUser?.id ?? "")
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <Ionicons name="chatbubbles-outline" size={56} color={C.textTertiary} />
        <Text style={styles.authTitle}>Your Messages</Text>
        <Text style={styles.authDesc}>
          Sign in to chat with service providers and seekers
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
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={myConvos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow conv={item} currentUserId={currentUser?.id ?? ""} />
        )}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={48} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyDesc}>
              Send a service request to start chatting
            </Text>
            <Pressable
              style={styles.browseBtn}
              onPress={() => router.push("/(tabs)/index")}
            >
              <Text style={styles.browseBtnText}>Browse Services</Text>
            </Pressable>
          </View>
        )}
      />
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: C.surface,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  rowContent: { flex: 1 },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    color: C.text,
    fontFamily: "Inter_500Medium",
  },
  nameBold: { fontWeight: "700", fontFamily: "Inter_700Bold" },
  time: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  previewBold: { fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  unreadBadge: {
    backgroundColor: C.primary,
    borderRadius: 100,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  separator: { height: 1, backgroundColor: C.borderLight, marginLeft: 78 },
  listContent: { paddingBottom: 100 },
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
