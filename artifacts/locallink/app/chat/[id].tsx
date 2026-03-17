import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { ChatMessage } from "@/context/AppContext";

export default function ChatScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const {
    conversations,
    messages,
    currentUser,
    sendMessage,
    markConversationRead,
  } = useApp();

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find((c) => c.id === id);
  const convMessages = messages[id] ?? [];

  const otherId =
    conversation?.participantIds.find((pid) => pid !== currentUser?.id) ?? "";
  const otherName = conversation?.participantNames[otherId] ?? "Chat";

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: otherName });
  }, [navigation, otherName]);

  useEffect(() => {
    markConversationRead(id);
  }, [id]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      conversationId: id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setText("");
    await sendMessage(msg);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === currentUser?.id;
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {!isMe && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>
              {item.senderName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.bubbleWrapper}>
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleThem,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isMe ? styles.bubbleTextMe : styles.bubbleTextThem,
              ]}
            >
              {item.text}
            </Text>
          </View>
          <Text
            style={[
              styles.timestamp,
              isMe ? styles.timestampRight : styles.timestampLeft,
            ]}
          >
            {time}
          </Text>
        </View>
      </View>
    );
  };

  if (!conversation) {
    return (
      <View style={styles.center}>
        <Ionicons name="chatbubble-outline" size={48} color={C.textTertiary} />
        <Text style={styles.noConv}>Conversation not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={flatListRef}
        data={convMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messageList,
          { paddingBottom: insets.bottom + 80 },
        ]}
        inverted={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyConv}>
            <Ionicons name="chatbubbles-outline" size={48} color={C.textTertiary} />
            <Text style={styles.emptyConvText}>
              Start the conversation with {otherName}
            </Text>
          </View>
        )}
      />

      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: insets.bottom + 8,
            borderTopColor: C.border,
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${otherName}...`}
            placeholderTextColor={C.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
        </View>
        <Pressable
          style={[
            styles.sendBtn,
            { backgroundColor: text.trim() ? C.primary : C.backgroundTertiary },
          ]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={text.trim() ? "#fff" : C.textTertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  noConv: { fontSize: 16, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  messageList: { padding: 16, flexGrow: 1 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  messageRowLeft: { justifyContent: "flex-start" },
  messageRowRight: { justifyContent: "flex-end" },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  senderAvatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  bubbleWrapper: { maxWidth: "75%" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: C.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  bubbleTextMe: { color: "#fff" },
  bubbleTextThem: { color: C.text },
  timestamp: {
    fontSize: 10,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  timestampLeft: { textAlign: "left", marginLeft: 4 },
  timestampRight: { textAlign: "right", marginRight: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  emptyConv: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyConvText: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
