import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { StarRating } from "@/components/ui/StarRating";
import { useApp } from "@/context/AppContext";

export default function ReviewsScreen() {
  const C = Colors.light;
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const { reviews } = useApp();

  const providerReviews = reviews.filter((r) => r.providerId === providerId);
  const avgRating =
    providerReviews.length > 0
      ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: providerReviews.filter((r) => r.rating === star).length,
  }));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={providerReviews}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <View style={styles.header}>
          <View style={styles.overallSection}>
            <Text style={styles.avgRating}>{avgRating.toFixed(1)}</Text>
            <StarRating rating={avgRating} size={24} />
            <Text style={styles.totalReviews}>
              {providerReviews.length} review{providerReviews.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.distribution}>
            {ratingDistribution.map(({ star, count }) => (
              <View key={star} style={styles.distRow}>
                <Text style={styles.distStar}>{star}</Text>
                <View style={styles.distBar}>
                  <View
                    style={[
                      styles.distFill,
                      {
                        width:
                          providerReviews.length > 0
                            ? `${(count / providerReviews.length) * 100}%`
                            : "0%",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>
                {item.seekerName.charAt(0)}
              </Text>
            </View>
            <View style={styles.reviewMeta}>
              <Text style={styles.reviewName}>{item.seekerName}</Text>
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <StarRating rating={item.rating} size={14} />
          </View>
          <Text style={styles.reviewComment}>{item.comment}</Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No reviews yet</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: 40 },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    marginBottom: 8,
  },
  overallSection: {
    alignItems: "center",
    marginBottom: 20,
    gap: 6,
  },
  avgRating: {
    fontSize: 52,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  totalReviews: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  distribution: { gap: 8 },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distStar: {
    width: 12,
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  distBar: {
    flex: 1,
    height: 8,
    backgroundColor: C.backgroundTertiary,
    borderRadius: 4,
    overflow: "hidden",
  },
  distFill: {
    height: "100%",
    backgroundColor: C.rating,
    borderRadius: 4,
  },
  distCount: {
    width: 16,
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  reviewCard: { padding: 16 },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  reviewMeta: { flex: 1 },
  reviewName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  reviewDate: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  reviewComment: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  separator: { height: 1, backgroundColor: C.borderLight },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: {
    fontSize: 16,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
});
