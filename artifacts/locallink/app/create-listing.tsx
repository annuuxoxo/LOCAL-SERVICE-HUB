import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { ServiceCategory, ServiceListing } from "@/context/AppContext";

const CATEGORIES: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: "tutoring", label: "Tutoring", icon: "book" },
  { id: "tailoring", label: "Tailoring", icon: "cut" },
  { id: "homefood", label: "Home Food", icon: "restaurant" },
  { id: "repair", label: "Repair", icon: "construct" },
  { id: "cleaning", label: "Cleaning", icon: "sparkles" },
  { id: "beauty", label: "Beauty", icon: "flower" },
  { id: "gardening", label: "Gardening", icon: "leaf" },
  { id: "plumbing", label: "Plumbing", icon: "water" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MUMBAI_DEFAULT = { latitude: 19.1726, longitude: 72.9538 };

const MUMBAI_AREAS = [
  { name: "Mulund West", latitude: 19.1726, longitude: 72.9538 },
  { name: "Mulund East", latitude: 19.1700, longitude: 72.9580 },
  { name: "Mulund Colony", latitude: 19.1680, longitude: 72.9600 },
  { name: "Bhandup West", latitude: 19.1490, longitude: 72.9512 },
  { name: "Bhandup East", latitude: 19.1508, longitude: 72.9600 },
  { name: "Nahur", latitude: 19.1400, longitude: 72.9500 },
  { name: "Vikhroli", latitude: 19.1080, longitude: 72.9260 },
  { name: "Ghatkopar", latitude: 19.0860, longitude: 72.9080 },
  { name: "Powai", latitude: 19.1196, longitude: 72.9070 },
  { name: "Thane West", latitude: 19.2183, longitude: 72.9781 },
];

export default function CreateListingScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { currentUser, addListing, userLocation, refreshListings } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("tutoring");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"hourly" | "fixed" | "negotiable">("hourly");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const [pinCoord, setPinCoord] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: userLocation?.latitude ?? MUMBAI_DEFAULT.latitude,
    longitude: userLocation?.longitude ?? MUMBAI_DEFAULT.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    if (userLocation && !pinCoord) {
      const defaultName = userLocation.name ?? "My Location";
      setPinCoord({ latitude: userLocation.latitude, longitude: userLocation.longitude, name: defaultName });
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      });
    }
  }, [userLocation]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent?.coordinate;
    if (!coord) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinCoord({ latitude: coord.latitude, longitude: coord.longitude, name: "Custom Pin" });
  };

  const handleSelectArea = (area: typeof MUMBAI_AREAS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinCoord({ ...area });
    setRegion({ latitude: area.latitude, longitude: area.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price) {
      Alert.alert("Missing Fields", "Please fill in title, description, and price.");
      return;
    }
    if (!pinCoord) {
      Alert.alert("Location Required", "Please pin your service location on the map or pick a neighbourhood.");
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert("Availability Required", "Select at least one available day.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const listing: ServiceListing = {
      id: "l_" + Date.now(),
      providerId: currentUser!.id,
      providerName: currentUser!.name,
      providerRating: currentUser?.rating ?? 0,
      title: title.trim(),
      description: description.trim(),
      category,
      price: parseFloat(price),
      priceType,
      location: pinCoord.name === "Custom Pin"
        ? `${pinCoord.latitude.toFixed(4)}, ${pinCoord.longitude.toFixed(4)}`
        : pinCoord.name,
      latitude: pinCoord.latitude,
      longitude: pinCoord.longitude,
      availability: selectedDays,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      isActive: true,
      createdAt: new Date().toISOString(),
      reviewCount: 0,
    };

    await addListing(listing);
    await refreshListings();
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Published!", "Your listing is now live and visible on the map.", [
      { text: "View Map", onPress: () => router.replace("/(tabs)/map") },
      { text: "Done", onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Create a Listing</Text>
        <Text style={styles.pageSubtitle}>Share your skills with the community</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.categoryOption, category === cat.id && styles.categoryOptionActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat.id);
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.id ? "#fff" : C.textSecondary}
                />
                <Text style={[styles.categoryOptionLabel, category === cat.id && styles.categoryOptionLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Listing Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Maths & Science Tutoring"
            placeholderTextColor={C.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your service, experience, and what makes you unique..."
            placeholderTextColor={C.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Price *</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySign}>₹</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor={C.textTertiary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.priceTypeRow}>
              {(["hourly", "fixed", "negotiable"] as const).map((type) => (
                <Pressable
                  key={type}
                  style={[styles.priceTypeBtn, priceType === type && styles.priceTypeBtnActive]}
                  onPress={() => setPriceType(type)}
                >
                  <Text style={[styles.priceTypeText, priceType === type && styles.priceTypeTextActive]}>
                    {type === "hourly" ? "/hr" : type === "fixed" ? "fixed" : "neg."}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Service Location *</Text>
          <Text style={styles.sublabel}>
            Tap on the map to pin your location or choose a neighbourhood below
          </Text>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={region}
              onPress={handleMapPress}
              onRegionChangeComplete={setRegion}
            >
              {pinCoord && (
                <Marker coordinate={{ latitude: pinCoord.latitude, longitude: pinCoord.longitude }}>
                  <View style={styles.pinMarker}>
                    <Ionicons name="location" size={36} color="#FF6B47" />
                  </View>
                </Marker>
              )}
            </MapView>

            {Platform.OS === "web" && (
              <View style={styles.webOverlay}>
                <Ionicons name="map-outline" size={36} color="#6B7280" />
                <Text style={styles.webOverlayText}>Open on mobile to pin on the map</Text>
                <Text style={styles.webOverlaySub}>Select a neighbourhood below</Text>
              </View>
            )}
          </View>

          {pinCoord && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="checkmark-circle" size={15} color="#10B981" />
              <Text style={styles.pinnedBadgeText} numberOfLines={1}>
                {pinCoord.name === "Custom Pin"
                  ? `${pinCoord.latitude.toFixed(4)}, ${pinCoord.longitude.toFixed(4)}`
                  : pinCoord.name}
              </Text>
            </View>
          )}

          <Text style={styles.areaPickerLabel}>Quick-pick a neighbourhood</Text>
          <View style={styles.areasGrid}>
            {MUMBAI_AREAS.map((area) => (
              <Pressable
                key={area.name}
                style={[styles.areaChip, pinCoord?.name === area.name && styles.areaChipActive]}
                onPress={() => handleSelectArea(area)}
              >
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={pinCoord?.name === area.name ? "#fff" : C.primary}
                />
                <Text style={[styles.areaChipLabel, pinCoord?.name === area.name && styles.areaChipLabelActive]}>
                  {area.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Availability *</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => (
              <Pressable
                key={day}
                style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleDay(day);
                }}
              >
                <Text style={[styles.dayLabel, selectedDays.includes(day) && styles.dayLabelActive]}>
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tags (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="maths, algebra, cbse (comma-separated)"
            placeholderTextColor={C.textTertiary}
            value={tags}
            onChangeText={setTags}
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.submitBtn, { opacity: loading ? 0.8 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Publish Listing</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { padding: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  section: { marginBottom: 22 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
    lineHeight: 17,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryOptionActive: { backgroundColor: C.primary, borderColor: C.primary },
  categoryOptionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: C.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  categoryOptionLabelActive: { color: "#fff" },
  input: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  charCount: {
    fontSize: 11,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 4,
  },
  priceRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    width: 110,
  },
  currencySign: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textSecondary,
    fontFamily: "Inter_700Bold",
  },
  priceInput: {
    flex: 1,
    padding: 14,
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  priceTypeRow: { flexDirection: "row", gap: 6 },
  priceTypeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  priceTypeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  priceTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  priceTypeTextActive: { color: "#fff" },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    position: "relative",
    marginBottom: 10,
  },
  map: { flex: 1 },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  webOverlayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
  },
  webOverlaySub: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  pinMarker: { alignItems: "center" },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  pinnedBadgeText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  areaPickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  areasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF0FA",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  areaChipActive: { backgroundColor: "#1B3A6B", borderColor: "#1B3A6B" },
  areaChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B3A6B",
    fontFamily: "Inter_600SemiBold",
  },
  areaChipLabelActive: { color: "#fff" },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    width: 48,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  dayChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  dayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  dayLabelActive: { color: "#fff" },
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
  submitBtn: {
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
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
