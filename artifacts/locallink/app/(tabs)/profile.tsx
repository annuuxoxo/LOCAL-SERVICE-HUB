import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const C = Colors.light;
  const { currentUser, isAuthenticated, logout, updateProfile, listings } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [location, setLocation] = useState(currentUser?.location ?? "");
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={styles.authPrompt}>
        <View style={styles.bigAvatar}>
          <Ionicons name="person-outline" size={40} color={C.textTertiary} />
        </View>
        <Text style={styles.authTitle}>Your Profile</Text>
        <Text style={styles.authDesc}>
          Sign in to access your profile, listings, and history
        </Text>
        <Pressable
          style={styles.authBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.authBtnText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.authLink}>Create Account</Text>
        </Pressable>
      </View>
    );
  }

  const myListings = listings.filter((l) => l.providerId === currentUser?.id);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name, bio, location });
    setSaving(false);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {(currentUser?.name ?? "U").charAt(0)}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={C.textTertiary}
            />
          ) : (
            <Text style={styles.profileName}>{currentUser?.name}</Text>
          )}
          <View style={styles.roleBadge}>
            <Ionicons
              name={currentUser?.role === "provider" ? "briefcase" : "search"}
              size={12}
              color={C.primary}
            />
            <Text style={styles.roleText}>
              {currentUser?.role === "provider" ? "Service Provider" : "Service Seeker"}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            if (editing) {
              handleSave();
            } else {
              setEditing(true);
              setName(currentUser?.name ?? "");
            }
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Feather
              name={editing ? "check" : "edit-2"}
              size={18}
              color={C.primary}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentUser?.completedJobs ?? 0}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {currentUser?.rating.toFixed(1) ?? "—"}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentUser?.reviewCount ?? 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        {currentUser?.role === "provider" && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{currentUser?.earnings?.toFixed(0) ?? 0}
              </Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </>
        )}
      </View>

      {editing && (
        <View style={styles.editSection}>
          <Text style={styles.editLabel}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about yourself..."
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.editLabel}>Location</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={16} color={C.textTertiary} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.editInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Your city or neighborhood"
              placeholderTextColor={C.textTertiary}
            />
          </View>
        </View>
      )}

      {!editing && (currentUser?.bio || currentUser?.location) && (
        <View style={styles.infoSection}>
          {currentUser?.bio && (
            <Text style={styles.bio}>{currentUser.bio}</Text>
          )}
          {currentUser?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={C.textSecondary} />
              <Text style={styles.locationText}>{currentUser.location}</Text>
            </View>
          )}
        </View>
      )}

      {currentUser?.role === "provider" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <Pressable onPress={() => router.push("/create-listing")}>
              <View style={styles.addListingBtn}>
                <Ionicons name="add" size={16} color={C.primary} />
                <Text style={styles.addListingText}>Add</Text>
              </View>
            </Pressable>
          </View>

          {myListings.length === 0 ? (
            <Pressable
              style={styles.emptyListings}
              onPress={() => router.push("/create-listing")}
            >
              <Ionicons name="add-circle-outline" size={32} color={C.textTertiary} />
              <Text style={styles.emptyListingsText}>Create your first listing</Text>
            </Pressable>
          ) : (
            myListings.map((l) => (
              <View key={l.id} style={styles.myListingCard}>
                <View style={styles.myListingInfo}>
                  <Text style={styles.myListingTitle} numberOfLines={1}>
                    {l.title}
                  </Text>
                  <Text style={styles.myListingMeta}>
                    ₹{l.price}{l.priceType === "hourly" ? "/hr" : ""} · {l.reviewCount} reviews
                  </Text>
                </View>
                <View style={[styles.activeIndicator, { backgroundColor: l.isActive ? C.success : C.textTertiary }]} />
              </View>
            ))
          )}
        </>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          { icon: "bell-outline", label: "Notifications" },
          { icon: "shield-checkmark-outline", label: "Privacy & Security" },
          { icon: "help-circle-outline", label: "Help & Support" },
        ].map((item) => (
          <Pressable key={item.label} style={styles.menuRow}>
            <Ionicons name={item.icon as any} size={20} color={C.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={C.textTertiary} />
          </Pressable>
        ))}

        <Pressable style={[styles.menuRow, styles.logoutRow]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={[styles.menuLabel, { color: C.error }]}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const C = Colors.light;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: 100 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    borderBottomWidth: 1.5,
    borderBottomColor: C.primary,
    paddingBottom: 2,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF0FA",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.primary,
    fontFamily: "Inter_600SemiBold",
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EBF0FA",
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 16,
  },
  statCard: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: C.primary,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.borderLight,
    marginVertical: 4,
  },
  editSection: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  bioInput: {
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  editInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  bio: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  addListingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF0FA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addListingText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.primary,
    fontFamily: "Inter_600SemiBold",
  },
  emptyListings: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    marginHorizontal: 16,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    marginBottom: 16,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  emptyListingsText: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  myListingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  myListingInfo: { flex: 1 },
  myListingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  myListingMeta: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  menuSection: { paddingHorizontal: 16, marginTop: 8 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  logoutRow: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    backgroundColor: C.background,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  authDesc: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  authBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  authBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  authLink: {
    color: C.primary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
