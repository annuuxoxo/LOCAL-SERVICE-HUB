import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { ServiceCategory, ServiceListing } from "@/context/AppContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const MUMBAI_DEFAULT = { latitude: 19.1726, longitude: 72.9538 };

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

const FILTERS: { id: ServiceCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tutoring", label: "Tutoring" },
  { id: "tailoring", label: "Tailoring" },
  { id: "homefood", label: "Food" },
  { id: "repair", label: "Repair" },
  { id: "cleaning", label: "Cleaning" },
  { id: "beauty", label: "Beauty" },
  { id: "plumbing", label: "Plumbing" },
];

const RADIUS_OPTIONS = [1, 2, 5, 10];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { listings, userLocation } = useApp();

  const center = userLocation ?? MUMBAI_DEFAULT;

  const [selectedFilter, setSelectedFilter] = useState<ServiceCategory | "all">("all");
  const [selectedListing, setSelectedListing] = useState<ServiceListing | null>(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [region] = useState<Region>({
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (!l.isActive) return false;
      if (selectedFilter !== "all" && l.category !== selectedFilter) return false;
      const dist = haversineKm(center.latitude, center.longitude, l.latitude, l.longitude);
      return dist <= radiusKm;
    });
  }, [listings, selectedFilter, radiusKm, center]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Circle
          center={{ latitude: center.latitude, longitude: center.longitude }}
          radius={radiusKm * 1000}
          strokeColor="rgba(27,58,107,0.4)"
          fillColor="rgba(27,58,107,0.07)"
          strokeWidth={1.5}
        />

        {filtered.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedListing(listing);
            }}
          >
            <View
              style={[
                styles.markerBubble,
                {
                  backgroundColor: CATEGORY_COLORS[listing.category] ?? C.primary,
                  borderColor: selectedListing?.id === listing.id ? "#fff" : "transparent",
                  borderWidth: selectedListing?.id === listing.id ? 2 : 0,
                  transform: [{ scale: selectedListing?.id === listing.id ? 1.15 : 1 }],
                },
              ]}
            >
              <Text style={styles.markerPrice}>₹{listing.price}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[styles.filterChip, selectedFilter === f.id && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(f.id);
                setSelectedListing(null);
              }}
            >
              <Text style={[styles.filterLabel, selectedFilter === f.id && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.radiusRow}>
          <Ionicons name="radio-button-on" size={14} color={C.primary} />
          <Text style={styles.radiusLabel}>Radius:</Text>
          {RADIUS_OPTIONS.map((r) => (
            <Pressable
              key={r}
              style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRadiusKm(r);
                setSelectedListing(null);
              }}
            >
              <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
                {r} km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.bottomPanel}>
        {selectedListing ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedCardHeader}>
              <Text style={styles.selectedTitle} numberOfLines={1}>
                {selectedListing.title}
              </Text>
              <Pressable onPress={() => setSelectedListing(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={C.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.selectedProvider}>{selectedListing.providerName}</Text>
            <View style={styles.selectedMeta}>
              <View style={styles.selectedRating}>
                <Ionicons name="star" size={13} color={C.rating} />
                <Text style={styles.selectedRatingText}>
                  {selectedListing.providerRating.toFixed(1)} ({selectedListing.reviewCount})
                </Text>
              </View>
              <View style={styles.selectedDist}>
                <Ionicons name="navigate" size={12} color={C.textSecondary} />
                <Text style={styles.selectedDistText}>
                  {haversineKm(center.latitude, center.longitude, selectedListing.latitude, selectedListing.longitude).toFixed(1)} km
                </Text>
              </View>
            </View>
            <View style={styles.selectedFooter}>
              <View style={styles.priceTag}>
                <Text style={styles.priceTagText}>
                  ₹{selectedListing.price}
                  {selectedListing.priceType === "hourly" ? "/hr" : ""}
                </Text>
              </View>
              <Pressable
                style={styles.viewBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: "/service/[id]", params: { id: selectedListing.id } });
                }}
              >
                <Text style={styles.viewBtnText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>
              {filtered.length} service{filtered.length !== 1 ? "s" : ""} within {radiusKm} km
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listScroll}
            >
              {filtered.length === 0 ? (
                <View style={styles.noResultsCard}>
                  <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                  <Text style={styles.noResultsText}>No services in this radius</Text>
                  <Text style={styles.noResultsSub}>Try increasing the radius</Text>
                </View>
              ) : (
                filtered.map((l) => {
                  const dist = haversineKm(center.latitude, center.longitude, l.latitude, l.longitude);
                  return (
                    <Pressable
                      key={l.id}
                      style={styles.miniCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedListing(l);
                      }}
                    >
                      <View style={[styles.miniIcon, { backgroundColor: (CATEGORY_COLORS[l.category] ?? C.primary) + "20" }]}>
                        <Ionicons name="briefcase-outline" size={18} color={CATEGORY_COLORS[l.category] ?? C.primary} />
                      </View>
                      <Text style={styles.miniTitle} numberOfLines={2}>{l.title}</Text>
                      <Text style={styles.miniProvider} numberOfLines={1}>{l.providerName}</Text>
                      <View style={styles.miniFooter}>
                        <Text style={styles.miniPrice}>₹{l.price}{l.priceType === "hourly" ? "/hr" : ""}</Text>
                        <Text style={styles.miniDist}>{dist.toFixed(1)} km</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerBubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPrice: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 4,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipActive: { backgroundColor: C.primary },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  filterLabelActive: { color: "#fff" },
  radiusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    fontFamily: "Inter_600SemiBold",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  radiusChip: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  radiusChipActive: { backgroundColor: "#FF6B47" },
  radiusChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  radiusChipTextActive: { color: "#fff" },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 100,
  },
  selectedCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  selectedTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: { padding: 4 },
  selectedProvider: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  selectedMeta: { flexDirection: "row", gap: 12, marginBottom: 12 },
  selectedRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectedRatingText: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  selectedDist: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectedDistText: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  selectedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceTag: {
    backgroundColor: "#EBF0FA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceTagText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.primary,
    fontFamily: "Inter_700Bold",
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  viewBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  listSection: { paddingHorizontal: 16 },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  listScroll: { gap: 10, paddingBottom: 8 },
  noResultsCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  noResultsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
  },
  noResultsSub: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  miniCard: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  miniProvider: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  miniFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
    fontFamily: "Inter_700Bold",
  },
  miniDist: {
    fontSize: 10,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
});
