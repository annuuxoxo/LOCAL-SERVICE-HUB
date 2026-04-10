import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function CreateListingScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { currentUser, addListing } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("tutoring");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"hourly" | "fixed" | "negotiable">("hourly");
  const [location, setLocation] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert("Availability Required", "Select at least one available day.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const listing: ServiceListing = {
      id: "l_" + Date.now(),
      providerId: currentUser!.id,
      providerName: currentUser!.name,
      providerRating: 0,
      title: title.trim(),
      description: description.trim(),
      category,
      price: parseFloat(price),
      priceType,
      location: location.trim(),
      latitude: 40.7128 + (Math.random() - 0.5) * 0.3,
      longitude: -74.006 + (Math.random() - 0.5) * 0.3,
      availability: selectedDays,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      isActive: true,
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      distance: Math.round(Math.random() * 50) / 10,
    };

    await addListing(listing);
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Create a Listing</Text>
        <Text style={styles.pageSubtitle}>
          Share your skills with the community
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryOption,
                  category === cat.id && styles.categoryOptionActive,
                ]}
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
                <Text
                  style={[
                    styles.categoryOptionLabel,
                    category === cat.id && styles.categoryOptionLabelActive,
                  ]}
                >
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
            placeholder="e.g., Math & Science Tutoring"
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
              <Text style={styles.dollarSign}>₹</Text>
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
                  style={[
                    styles.priceTypeBtn,
                    priceType === type && styles.priceTypeBtnActive,
                  ]}
                  onPress={() => setPriceType(type)}
                >
                  <Text
                    style={[
                      styles.priceTypeText,
                      priceType === type && styles.priceTypeTextActive,
                    ]}
                  >
                    {type === "hourly" ? "/hr" : type === "fixed" ? "fixed" : "neg."}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={16} color={C.textTertiary} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Your neighborhood or city"
              placeholderTextColor={C.textTertiary}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Availability *</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => (
              <Pressable
                key={day}
                style={[
                  styles.dayChip,
                  selectedDays.includes(day) && styles.dayChipActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleDay(day);
                }}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    selectedDays.includes(day) && styles.dayLabelActive,
                  ]}
                >
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
            placeholder="math, algebra, calculus (comma-separated)"
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
  section: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
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
  categoryOptionActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
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
    width: 100,
  },
  dollarSign: {
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
  priceTypeBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  priceTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  priceTypeTextActive: { color: "#fff" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputWithIcon: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
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
  dayChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
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
