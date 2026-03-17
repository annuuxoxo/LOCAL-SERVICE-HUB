import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { StarRating } from "@/components/ui/StarRating";
import { useApp } from "@/context/AppContext";
import { RequestStatus, Review } from "@/context/AppContext";

const STATUS_FLOW: Record<RequestStatus, { next?: RequestStatus; label?: string }> = {
  pending: { next: "accepted", label: "Accept Request" },
  accepted: { next: "in_progress", label: "Mark In Progress" },
  in_progress: { next: "completed", label: "Mark Completed" },
  completed: {},
  cancelled: {},
  disputed: {},
};

export default function RequestDetailScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, currentUser, updateRequest, addReview, reviews } = useApp();
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const request = requests.find((r) => r.id === id);
  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Request not found</Text>
      </View>
    );
  }

  const isProvider = request.providerId === currentUser?.id;
  const isSeeker = request.seekerId === currentUser?.id;
  const hasReviewed = reviews.some(
    (r) => r.listingId === request.listingId && r.seekerId === currentUser?.id
  );

  const flow = STATUS_FLOW[request.status];

  const handleAction = async () => {
    if (!flow.next) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(true);
    await updateRequest(request.id, flow.next);
    setActionLoading(false);
    if (flow.next === "completed") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Service Completed!",
        `Payment of $${request.price} has been released from escrow to ${request.providerName}.`,
        [{ text: "OK" }]
      );
    }
  };

  const handleCancel = async () => {
    Alert.alert("Cancel Request", "Are you sure you want to cancel this request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          await updateRequest(request.id, "cancelled");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleReview = async () => {
    if (!comment.trim()) {
      Alert.alert("Comment Required", "Please add a comment to your review.");
      return;
    }
    const review: Review = {
      id: "rev_" + Date.now(),
      providerId: request.providerId,
      seekerId: request.seekerId,
      seekerName: request.seekerName,
      listingId: request.listingId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    await addReview(review);
    setReviewModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Review Submitted!", "Thank you for your feedback!");
  };

  const convId = `conv_${request.id}`;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusBadgeLarge,
              {
                backgroundColor:
                  request.status === "completed"
                    ? "#D1FAE5"
                    : request.status === "cancelled"
                      ? "#FEE2E2"
                      : request.status === "pending"
                        ? "#FEF3C7"
                        : "#DBEAFE",
              },
            ]}
          >
            <Ionicons
              name={
                request.status === "completed"
                  ? "checkmark-done-circle"
                  : request.status === "cancelled"
                    ? "close-circle"
                    : request.status === "pending"
                      ? "time"
                      : "play-circle"
              }
              size={24}
              color={
                request.status === "completed"
                  ? "#10B981"
                  : request.status === "cancelled"
                    ? "#EF4444"
                    : request.status === "pending"
                      ? "#F59E0B"
                      : "#3B82F6"
              }
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    request.status === "completed"
                      ? "#10B981"
                      : request.status === "cancelled"
                        ? "#EF4444"
                        : request.status === "pending"
                          ? "#F59E0B"
                          : "#3B82F6",
                },
              ]}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace("_", " ")}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.serviceTitle}>{request.serviceTitle}</Text>
          <Text style={styles.category}>
            {request.serviceCategory.charAt(0).toUpperCase() + request.serviceCategory.slice(1)}
          </Text>

          <View style={styles.partiesCard}>
            <View style={styles.partyRow}>
              <View style={styles.partyAvatar}>
                <Text style={styles.partyAvatarText}>
                  {request.seekerName.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.partyRole}>Requested by</Text>
                <Text style={styles.partyName}>{request.seekerName}</Text>
              </View>
              {isProvider && (
                <Pressable
                  style={styles.chatBtn}
                  onPress={() =>
                    router.push({ pathname: "/chat/[id]", params: { id: convId } })
                  }
                >
                  <Ionicons name="chatbubble-outline" size={16} color={C.primary} />
                  <Text style={styles.chatBtnText}>Chat</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.partyDivider} />
            <View style={styles.partyRow}>
              <View style={[styles.partyAvatar, { backgroundColor: "#7C3AED" }]}>
                <Text style={styles.partyAvatarText}>
                  {request.providerName.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.partyRole}>Provider</Text>
                <Text style={styles.partyName}>{request.providerName}</Text>
              </View>
              {isSeeker && (
                <Pressable
                  style={styles.chatBtn}
                  onPress={() =>
                    router.push({ pathname: "/chat/[id]", params: { id: convId } })
                  }
                >
                  <Ionicons name="chatbubble-outline" size={16} color={C.primary} />
                  <Text style={styles.chatBtnText}>Chat</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.escrowCard}>
            <View style={styles.escrowHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
              <Text style={styles.escrowTitle}>Escrow Payment</Text>
            </View>
            <View style={styles.escrowRow}>
              <Text style={styles.escrowLabel}>Amount</Text>
              <Text style={styles.escrowAmount}>${request.escrow.amount}</Text>
            </View>
            <View style={styles.escrowRow}>
              <Text style={styles.escrowLabel}>Status</Text>
              <View
                style={[
                  styles.escrowStatus,
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
                <Text
                  style={[
                    styles.escrowStatusText,
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
                    ? "Held in Escrow"
                    : request.escrow.status === "released"
                      ? "Released to Provider"
                      : "Refunded"}
                </Text>
              </View>
            </View>
            <View style={styles.escrowRow}>
              <Text style={styles.escrowLabel}>Transaction</Text>
              <Text style={styles.txnId}>{request.escrow.transactionId}</Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageLabel}>Request Message</Text>
            <Text style={styles.messageText}>{request.message}</Text>
            {request.scheduledDate && (
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={C.textSecondary} />
                <Text style={styles.dateText}>{request.scheduledDate}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {isProvider && flow.next && (
          <Pressable
            style={[styles.actionBtn, { opacity: actionLoading ? 0.8 : 1 }]}
            onPress={handleAction}
            disabled={actionLoading}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>{flow.label}</Text>
          </Pressable>
        )}
        {isSeeker && request.status === "completed" && !hasReviewed && (
          <Pressable
            style={styles.reviewBtn}
            onPress={() => setReviewModal(true)}
          >
            <Ionicons name="star-outline" size={18} color={C.rating} />
            <Text style={styles.reviewBtnText}>Leave Review</Text>
          </Pressable>
        )}
        {(request.status === "pending" || request.status === "accepted") && (
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </Pressable>
        )}
      </View>

      <Modal
        visible={reviewModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setReviewModal(false)}
      >
        <View style={styles.reviewModalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.reviewModalTitle}>Leave a Review</Text>
          <Text style={styles.reviewModalSub}>
            How was your experience with {request.providerName}?
          </Text>

          <View style={styles.starSection}>
            <StarRating rating={rating} size={40} interactive onRate={setRating} />
          </View>

          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience..."
            placeholderTextColor={C.textTertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />

          <View style={styles.reviewButtons}>
            <Pressable
              style={styles.reviewCancelBtn}
              onPress={() => setReviewModal(false)}
            >
              <Text style={styles.reviewCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.reviewSubmitBtn} onPress={handleReview}>
              <Text style={styles.reviewSubmitText}>Submit Review</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 18, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  statusHeader: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statusBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  content: { padding: 16, gap: 16 },
  serviceTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  category: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  partiesCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  partyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  partyAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  partyRole: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  partyName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  partyDivider: { height: 1, backgroundColor: C.borderLight, marginVertical: 12 },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    backgroundColor: "#EBF0FA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chatBtnText: { fontSize: 13, fontWeight: "600", color: C.primary, fontFamily: "Inter_600SemiBold" },
  escrowCard: {
    backgroundColor: "#FAF5FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    gap: 10,
  },
  escrowHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  escrowTitle: { fontSize: 15, fontWeight: "700", color: "#7C3AED", fontFamily: "Inter_700Bold" },
  escrowRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  escrowLabel: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  escrowAmount: { fontSize: 18, fontWeight: "700", color: "#7C3AED", fontFamily: "Inter_700Bold" },
  escrowStatus: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  escrowStatusText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  txnId: { fontSize: 11, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  messageCard: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
  },
  messageLabel: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_600SemiBold", fontWeight: "600", marginBottom: 6 },
  messageText: { fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 20 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  dateText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  reviewBtnText: { color: "#D97706", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnText: { color: C.error, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  reviewModalContainer: { flex: 1, padding: 24, backgroundColor: C.background },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 20 },
  reviewModalTitle: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", marginBottom: 4 },
  reviewModalSub: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 24 },
  starSection: { alignItems: "center", marginBottom: 24 },
  commentInput: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  reviewButtons: { flexDirection: "row", gap: 12 },
  reviewCancelBtn: {
    flex: 1,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  reviewCancelText: { fontSize: 15, fontWeight: "600", color: C.textSecondary, fontFamily: "Inter_600SemiBold" },
  reviewSubmitBtn: {
    flex: 2,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  reviewSubmitText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
