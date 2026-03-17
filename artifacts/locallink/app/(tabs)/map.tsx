import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { ServiceCard } from "@/components/ServiceCard";
import { useApp } from "@/context/AppContext";
import { ServiceCategory, ServiceListing } from "@/context/AppContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
];

export default function MapScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { listings } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<ServiceCategory | "all">("all");
  const [selectedListing, setSelectedListing] = useState<ServiceListing | null>(null);
  const [region] = useState<Region>({
    latitude: 40.7282,
    longitude: -73.9442,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  const filtered = listings.filter(
    (l) => (selectedFilter === "all" || l.category === selectedFilter) && l.isActive
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filtered.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: listing.latitude,
              longitude: listing.longitude,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedListing(listing);
            }}
          >
            <View
              style={[
                styles.markerBubble,
                {
                  backgroundColor:
                    CATEGORY_COLORS[listing.category] ?? C.primary,
                  borderColor:
                    selectedListing?.id === listing.id ? "#fff" : "transparent",
                  borderWidth: selectedListing?.id === listing.id ? 2 : 0,
                  transform: [
                    { scale: selectedListing?.id === listing.id ? 1.15 : 1 },
                  ],
                },
              ]}
            >
              <Text style={styles.markerPrice}>${listing.price}</Text>
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
              style={[
                styles.filterChip,
                selectedFilter === f.id && styles.filterChipActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(f.id);
                setSelectedListing(null);
              }}
            >
              <Text
                style={[
                  styles.filterLabel,
                  selectedFilter === f.id && styles.filterLabelActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottomPanel}>
        {selectedListing ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedCardHeader}>
              <Text style={styles.selectedTitle} numberOfLines={1}>
                {selectedListing.title}
              </Text>
              <Pressable
                onPress={() => setSelectedListing(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color={C.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.selectedProvider}>
              {selectedListing.providerName}
            </Text>
            <View style={styles.selectedMeta}>
              <View style={styles.selectedRating}>
                <Ionicons name="star" size={13} color={C.rating} />
                <Text style={styles.selectedRatingText}>
                  {selectedListing.providerRating.toFixed(1)} ({selectedListing.reviewCount})
                </Text>
              </View>
              {selectedListing.distance !== undefined && (
                <View style={styles.selectedDist}>
                  <Ionicons name="navigate" size={12} color={C.textSecondary} />
                  <Text style={styles.selectedDistText}>
                    {selectedListing.distance.toFixed(1)} mi
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.selectedFooter}>
              <View style={styles.priceTag}>
                <Text style={styles.priceTagText}>
                  ${selectedListing.price}
                  {selectedListing.priceType === "hourly" ? "/hr" : ""}
                </Text>
              </View>
              <Pressable
                style={styles.viewBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: "/service/[id]",
                    params: { id: selectedListing.id },
                  });
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
              {filtered.length} service{filtered.length !== 1 ? "s" : ""} nearby
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listScroll}
            >
              {filtered.map((l) => (
                <Pressable
                  key={l.id}
                  style={styles.miniCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedListing(l);
                  }}
                >
                  <View
                    style={[
                      styles.miniIcon,
                      { backgroundColor: (CATEGORY_COLORS[l.category] ?? C.primary) + "20" },
                    ]}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color={CATEGORY_COLORS[l.category] ?? C.primary}
                    />
                  </View>
                  <Text style={styles.miniTitle} numberOfLines={2}>
                    {l.title}
                  </Text>
                  <Text style={styles.miniProvider} numberOfLines={1}>
                    {l.providerName}
                  </Text>
                  <View style={styles.miniFooter}>
                    <Text style={styles.miniPrice}>
                      ${l.price}{l.priceType === "hourly" ? "/hr" : ""}
                    </Text>
                    {l.distance !== undefined && (
                      <Text style={styles.miniDist}>{l.distance.toFixed(1)} mi</Text>
                    )}
                  </View>
                </Pressable>
              ))}
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
    paddingBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
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
  filterChipActive: {
    backgroundColor: C.primary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  filterLabelActive: { color: "#fff" },
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
