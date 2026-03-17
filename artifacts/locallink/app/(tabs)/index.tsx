import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { ServiceCard } from "@/components/ServiceCard";
import { useApp } from "@/context/AppContext";
import { ServiceCategory } from "@/context/AppContext";

const CATEGORIES: { id: ServiceCategory | "all"; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "grid" },
  { id: "tutoring", label: "Tutoring", icon: "book" },
  { id: "tailoring", label: "Tailoring", icon: "cut" },
  { id: "homefood", label: "Home Food", icon: "restaurant" },
  { id: "repair", label: "Repair", icon: "construct" },
  { id: "cleaning", label: "Cleaning", icon: "sparkles" },
  { id: "gardening", label: "Gardening", icon: "leaf" },
];

export default function HomeScreen() {
  const C = Colors.light;
  const insets = useSafeAreaInsets();
  const { listings, currentUser, isAuthenticated } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">("all");

  const filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.providerName.toLowerCase().includes(search.toLowerCase()) ||
      l.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === "all" || l.category === selectedCategory;
    return matchSearch && matchCat && l.isActive;
  });

  const sortedByDistance = [...filtered].sort(
    (a, b) => (a.distance ?? 99) - (b.distance ?? 99)
  );

  const nearby = sortedByDistance.slice(0, 3);
  const topRated = [...filtered].sort((a, b) => b.providerRating - a.providerRating).slice(0, 3);

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPaddingIOS = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.header, { paddingTop: topPaddingIOS + 8 }]}>
        <View>
          <Text style={styles.greeting}>
            {isAuthenticated
              ? `Hello, ${currentUser?.name.split(" ")[0]}`
              : "Welcome to LocalLink"}
          </Text>
          <Text style={styles.subGreeting}>Find trusted local services</Text>
        </View>
        {!isAuthenticated && (
          <Pressable
            style={styles.signInBtn}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        )}
        {isAuthenticated && currentUser?.role === "provider" && (
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/create-listing")}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color={C.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, providers..."
            placeholderTextColor={C.textTertiary}
            value={search}
            onChangeText={setSearch}
            onFocus={handleSearchPress}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={C.textTertiary} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.mapBtn}
          onPress={() => router.push("/(tabs)/map")}
        >
          <Ionicons name="map-outline" size={22} color={C.primary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat.id);
            }}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? "#fff" : C.textSecondary}
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {search.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
            </Text>
          </View>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={C.textTertiary} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyDesc}>
                Try different keywords or browse categories
              </Text>
            </View>
          ) : (
            filtered.map((l) => <ServiceCard key={l.id} listing={l} />)
          )}
        </>
      ) : (
        <>
          {nearby.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  <Feather name="navigation" size={14} color={C.text} /> Near You
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/map")}>
                  <Text style={styles.seeAll}>Map view</Text>
                </Pressable>
              </View>
              {nearby.map((l) => <ServiceCard key={l.id} listing={l} />)}
            </>
          )}

          {topRated.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="star" size={14} color={C.rating} /> Top Rated
                </Text>
              </View>
              {topRated.map((l) => <ServiceCard key={l.id} listing={l} />)}
            </>
          )}

          {listings.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="compass-outline" size={48} color={C.textTertiary} />
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyDesc}>
                Be the first to offer a service in your community!
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

import { Platform } from "react-native";
const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  subGreeting: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  signInBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  signInText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    padding: 13,
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: { padding: 12 },
  mapBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EBF0FA",
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  categoryLabelActive: { color: "#fff" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    color: C.primary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
