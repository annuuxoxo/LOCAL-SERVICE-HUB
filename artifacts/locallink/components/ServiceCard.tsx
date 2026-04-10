import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { ServiceListing } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";

const CATEGORY_ICONS: Record<string, string> = {
  tutoring: "book",
  tailoring: "cut",
  homefood: "restaurant",
  repair: "construct",
  cleaning: "sparkles",
  beauty: "flower",
  gardening: "leaf",
  plumbing: "water",
};

const CATEGORY_LABELS: Record<string, string> = {
  tutoring: "Tutoring",
  tailoring: "Tailoring",
  homefood: "Home Food",
  repair: "Repair",
  cleaning: "Cleaning",
  beauty: "Beauty",
  gardening: "Gardening",
  plumbing: "Plumbing",
};

const CATEGORY_COLORS: Record<string, string> = {
  tutoring: "#3B82F6",
  tailoring: "#8B5CF6",
  homefood: "#F97316",
  repair: "#10B981",
  cleaning: "#06B6D4",
  beauty: "#EC4899",
  gardening: "#84CC16",
  plumbing: "#14B8A6",
};

interface ServiceCardProps {
  listing: ServiceListing;
  compact?: boolean;
}

export function ServiceCard({ listing, compact = false }: ServiceCardProps) {
  const C = Colors.light;
  const catColor = CATEGORY_COLORS[listing.category] ?? C.primary;
  const catIcon = (CATEGORY_ICONS[listing.category] ?? "briefcase") as any;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/service/[id]",
      params: { id: listing.id },
    });
  };

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.compact, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View
          style={[
            styles.compactIcon,
            { backgroundColor: catColor + "20" },
          ]}
        >
          <Ionicons name={catIcon} size={20} color={catColor} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.compactProvider} numberOfLines={1}>
            {listing.providerName}
          </Text>
          <View style={styles.compactMeta}>
            <Ionicons name="star" size={11} color={C.rating} />
            <Text style={styles.compactRating}>
              {listing.providerRating.toFixed(1)}
            </Text>
            {listing.distance !== undefined && (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.compactDistance}>
                  {listing.distance.toFixed(1)} km
                </Text>
              </>
            )}
          </View>
        </View>
        <Text style={styles.compactPrice}>
          ₹{listing.price}
          {listing.priceType === "hourly" ? "/hr" : ""}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: catColor + "18" }]}>
          <Ionicons name={catIcon} size={26} color={catColor} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <View style={styles.categoryRow}>
            <Badge
              label={CATEGORY_LABELS[listing.category] ?? listing.category}
              variant="info"
              size="sm"
            />
            {listing.distance !== undefined && (
              <View style={styles.distanceRow}>
                <Feather name="navigation" size={10} color={C.textTertiary} />
                <Text style={styles.distanceText}>
                  {listing.distance.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {listing.title}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {listing.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.providerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {listing.providerName.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.providerName}>{listing.providerName}</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={listing.providerRating} size={12} />
              <Text style={styles.ratingText}>
                {listing.providerRating.toFixed(1)} ({listing.reviewCount})
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceValue}>₹{listing.price}</Text>
          <Text style={styles.priceType}>
            {listing.priceType === "hourly"
              ? "/hr"
              : listing.priceType === "fixed"
                ? " fixed"
                : " neg."}
          </Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {listing.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardHeaderInfo: { flex: 1 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distanceText: {
    fontSize: 11,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarCircle: {
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
  providerName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  priceBox: { alignItems: "flex-end" },
  priceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: C.primary,
    fontFamily: "Inter_700Bold",
  },
  priceType: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  compactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compactInfo: { flex: 1 },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  compactProvider: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  compactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  compactRating: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  dot: { fontSize: 11, color: C.textTertiary },
  compactDistance: {
    fontSize: 11,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  compactPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: C.primary,
    fontFamily: "Inter_700Bold",
  },
});
