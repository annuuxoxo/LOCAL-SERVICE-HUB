import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const MUMBAI_CENTER = { latitude: 19.1726, longitude: 72.9538 };

const MULUND_AREAS = [
  { name: "Mulund West", latitude: 19.1726, longitude: 72.9538 },
  { name: "Mulund East", latitude: 19.1700, longitude: 72.9580 },
  { name: "Mulund Colony", latitude: 19.1680, longitude: 72.9600 },
  { name: "Bhandup West", latitude: 19.1490, longitude: 72.9512 },
  { name: "Nahur", latitude: 19.1400, longitude: 72.9500 },
  { name: "Vikhroli", latitude: 19.1080, longitude: 72.9260 },
  { name: "Ghatkopar", latitude: 19.0860, longitude: 72.9080 },
  { name: "Powai", latitude: 19.1196, longitude: 72.9070 },
];

export default function SetLocationScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { setUserLocation } = useApp();
  const [pinned, setPinned] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: MUMBAI_CENTER.latitude,
    longitude: MUMBAI_CENTER.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please allow location access to use this feature.");
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setPinned({ latitude, longitude, name: "My Location" });
      setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Could not get your location. Please select manually.");
    }
    setLocating(false);
  };

  const handleSelectArea = (area: typeof MULUND_AREAS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinned({ ...area });
    setRegion({ latitude: area.latitude, longitude: area.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent?.coordinate;
    if (!coord) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPinned({ latitude: coord.latitude, longitude: coord.longitude, name: "Custom Pin" });
  };

  const handleConfirm = async () => {
    if (!pinned) {
      Alert.alert("No location selected", "Please tap on the map or pick an area to set your location.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setUserLocation(pinned);
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    const defaultLoc = { latitude: MUMBAI_CENTER.latitude, longitude: MUMBAI_CENTER.longitude, name: "Mumbai" };
    setUserLocation(defaultLoc);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Location</Text>
        <Text style={styles.subtitle}>Pin where you are to discover nearby services</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {pinned && (
            <Marker
              coordinate={{ latitude: pinned.latitude, longitude: pinned.longitude }}
              title={pinned.name}
            >
              <View style={styles.pinMarker}>
                <Ionicons name="location" size={36} color="#FF6B47" />
              </View>
            </Marker>
          )}
        </MapView>

        {Platform.OS === "web" && (
          <View style={styles.webMapOverlay}>
            <Ionicons name="map-outline" size={40} color="#6B7280" />
            <Text style={styles.webMapText}>Open on mobile to pin on the map</Text>
            <Text style={styles.webMapSub}>Select a neighbourhood below</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.gpsBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#1B3A6B" />
          ) : (
            <>
              <Ionicons name="navigate" size={18} color="#1B3A6B" />
              <Text style={styles.gpsBtnText}>Use my location</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.areasList}
        contentContainerStyle={styles.areasContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.areasTitle}>Or pick a neighbourhood in Mumbai</Text>
        <View style={styles.areasGrid}>
          {MULUND_AREAS.map((area) => (
            <Pressable
              key={area.name}
              style={({ pressed }) => [
                styles.areaChip,
                pinned?.name === area.name && styles.areaChipActive,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => handleSelectArea(area)}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={pinned?.name === area.name ? "#fff" : C.primary}
              />
              <Text style={[styles.areaLabel, pinned?.name === area.name && styles.areaLabelActive]}>
                {area.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {pinned && (
          <View style={styles.pinnedInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.pinnedText} numberOfLines={1}>
              {pinned.name === "Custom Pin"
                ? `${pinned.latitude.toFixed(4)}, ${pinned.longitude.toFixed(4)}`
                : pinned.name}
            </Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleConfirm}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
        </Pressable>
        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  mapContainer: {
    height: 260,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  map: { flex: 1 },
  webMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  webMapText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
  },
  webMapSub: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  pinMarker: { alignItems: "center" },
  gpsBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B3A6B",
    fontFamily: "Inter_600SemiBold",
  },
  areasList: { flex: 1 },
  areasContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  areasTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  areasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  areaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EBF0FA",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  areaChipActive: {
    backgroundColor: "#1B3A6B",
    borderColor: "#1B3A6B",
  },
  areaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B3A6B",
    fontFamily: "Inter_600SemiBold",
  },
  areaLabelActive: { color: "#fff" },
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  pinnedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pinnedText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1B3A6B",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#1B3A6B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipBtnText: {
    fontSize: 13,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
});
