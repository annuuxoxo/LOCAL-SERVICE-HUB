import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { ServiceRequest } from "@/context/AppContext";

export default function ServiceDetailScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, currentUser, isAuthenticated, createRequest, reviews } = useApp();
  const [bookingModal, setBookingModal] = useState(false);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const listing = listings.find((l) => l.id === id);
  const listingReviews = reviews.filter((r) => r.listingId === id);

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Listing not found</Text>
      </View>
    );
  }

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Message Required", "Please describe what you need.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const request: ServiceRequest = {
      id: "req_" + Date.now(),
      listingId: listing.id,
      seekerId: currentUser!.id,
      providerId: listing.providerId,
      seekerName: currentUser!.name,
      providerName: listing.providerName,
      serviceTitle: listing.title,
      serviceCategory: listing.category,
      status: "pending",
      message,
      scheduledDate: date || undefined,
      price: listing.price,
      escrow: {
        amount: listing.price,
        status: "held",
        transactionId: "txn_" + Date.now(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createRequest(request);
    setLoading(false);
    setBookingModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Request Sent!",
      `Your request for "${listing.title}" has been sent to ${listing.providerName}. Payment of $${listing.price} is held in escrow.`,
      [
        {
          text: "View Requests",
          onPress: () => router.push("/(tabs)/requests"),
        },
        { text: "OK" },
      ]
    );
  };

  const isMyListing = listing.providerId === currentUser?.id;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroBg}>
            <Ionicons name="briefcase-outline" size={64} color="rgba(255,255,255,0.4)" />
          </View>
          <View style={styles.heroOverlay}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingBlock}>
              <StarRating rating={listing.providerRating} size={16} />
              <Text style={styles.ratingText}>
                {listing.providerRating.toFixed(1)} ({listing.reviewCount} reviews)
              </Text>
            </View>
            {listing.distance !== undefined && (
              <View style={styles.distanceBlock}>
                <Ionicons name="navigate-outline" size={14} color={C.textSecondary} />
                <Text style={styles.distanceText}>{listing.distance.toFixed(1)} mi away</Text>
              </View>
            )}
          </View>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>
                ${listing.price}
                <Text style={styles.priceType}>
                  {listing.priceType === "hourly"
                    ? " / hour"
                    : listing.priceType === "fixed"
                      ? " fixed"
                      : " (negotiable)"}
                </Text>
              </Text>
            </View>
            <View style={styles.escrowInfo}>
              <Ionicons name="shield-checkmark" size={16} color="#7C3AED" />
              <Text style={styles.escrowText}>Escrow Protected</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider</Text>
            <View style={styles.providerCard}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerAvatarText}>
                  {listing.providerName.charAt(0)}
                </Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{listing.providerName}</Text>
                <Text style={styles.providerLocation}>
                  {listing.location}
                </Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <Text style={styles.verifiedText}>Verified Provider</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.daysRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <View
                  key={day}
                  style={[
                    styles.dayChip,
                    listing.availability.includes(day) && styles.dayChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      listing.availability.includes(day) && styles.dayLabelActive,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {listing.tags.map((tag) => (
                <Badge key={tag} label={`#${tag}`} size="sm" />
              ))}
            </View>
          </View>

          {listingReviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <Pressable onPress={() => router.push({
                  pathname: "/reviews/[providerId]",
                  params: { providerId: listing.providerId }
                })}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              {listingReviews.slice(0, 2).map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {rev.seekerName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewName}>{rev.seekerName}</Text>
                      <StarRating rating={rev.rating} size={12} />
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {!isMyListing && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          {isAuthenticated ? (
            <Pressable
              style={({ pressed }) => [
                styles.bookBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setBookingModal(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.bookBtnText}>Request Service</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.bookBtn}
              onPress={() => router.push("/(auth)/login")}
            >
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={styles.bookBtnText}>Sign In to Request</Text>
            </Pressable>
          )}
        </View>
      )}

      <Modal
        visible={bookingModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setBookingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Request Service</Text>
          <Text style={styles.modalSubtitle}>
            Describe what you need from {listing.providerName}
          </Text>

          <View style={styles.escrowNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
            <View style={styles.escrowNoticeText}>
              <Text style={styles.escrowNoticeTitle}>Escrow Payment</Text>
              <Text style={styles.escrowNoticeDesc}>
                ${listing.price} will be held securely until service is completed
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.messageInput}
            placeholder="Describe what you need (e.g., tutoring in Calculus for 2 hours)..."
            placeholderTextColor={C.textTertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <TextInput
            style={styles.dateInput}
            placeholder="Preferred date (e.g., Saturday March 22)"
            placeholderTextColor={C.textTertiary}
            value={date}
            onChangeText={setDate}
          />

          <View style={styles.modalButtons}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setBookingModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, { opacity: loading ? 0.8 : 1 }]}
              onPress={handleBook}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.confirmBtnText}>Confirm & Pay ${listing.price}</Text>
                </>
              )}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFound: {
    fontSize: 18,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  heroSection: {
    height: 200,
    backgroundColor: C.primary,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBg: { opacity: 0.6 },
  heroOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
  },
  categoryTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryTagText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  mainContent: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingBlock: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  distanceBlock: { flexDirection: "row", alignItems: "center", gap: 4 },
  distanceText: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EBF0FA",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: "700",
    color: C.primary,
    fontFamily: "Inter_700Bold",
  },
  priceType: {
    fontSize: 14,
    fontWeight: "400",
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  escrowInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDE9FE",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  escrowText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
    fontFamily: "Inter_600SemiBold",
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  providerAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  providerInfo: { flex: 1 },
  providerName: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  providerLocation: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  verifiedText: {
    fontSize: 12,
    color: C.success,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  daysRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  dayChip: {
    width: 42,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  dayChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  dayLabelActive: { color: "#fff" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    color: C.primary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  reviewCard: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  reviewMeta: { gap: 2 },
  reviewName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  reviewComment: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
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
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  modalContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: C.background,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  escrowNotice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#EDE9FE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  escrowNoticeText: { flex: 1 },
  escrowNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7C3AED",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  escrowNoticeDesc: {
    fontSize: 12,
    color: "#6D28D9",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  messageInput: {
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
    marginBottom: 12,
  },
  dateInput: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
