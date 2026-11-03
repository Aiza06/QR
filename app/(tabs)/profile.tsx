import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppButton from "@/components/AppButton";
import ScreenBackground from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { signOut, useAuth } from "@/lib/auth";
import { showAlert } from "@/lib/confirm";
import { getProfile, updateProfile, type Profile } from "@/lib/profiles";

const webInputReset =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined;

export default function ProfileScreen() {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editing, setEditing] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const p = await getProfile(user);

    // Administrators go straight to the dashboard. The dashboard performs
    // its own server-verified role check before showing privileged data.
    if (p?.role === "admin" && p.is_active !== false) {
      router.replace("/admin");
      return;
    }

    setProfile(p);
    setDraftName(p?.full_name ?? "");
  }, [user, router]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });
    setSaving(false);
    if (error) {
      showAlert("Error", error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: draftName.trim() } : prev,
      );
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err: any) {
      showAlert("Error", err?.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const avatarInitial = (profile?.full_name?.trim() || profile?.email || "?")
    .charAt(0)
    .toUpperCase();

  const isAdmin = profile?.role === "admin";
  const isTeacher = profile?.role === "teacher";
  const roleLabel = isAdmin
    ? "Administrator"
    : isTeacher
      ? "Teacher"
      : "Student";
  const roleBadgeStyle = isAdmin
    ? styles.roleBadgeAdmin
    : isTeacher
      ? styles.roleBadgeTeacher
      : styles.roleBadgeStudent;
  const roleTextStyle = isAdmin
    ? styles.roleBadgeAdminText
    : isTeacher
      ? styles.roleBadgeTeacherText
      : styles.roleBadgeStudentText;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>My Profile</Text>

          {!profile ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.teal} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
                </View>
                <View style={[styles.roleBadge, roleBadgeStyle]}>
                  <Text style={[styles.roleBadgeText, roleTextStyle]}>
                    {roleLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.label}>Name</Text>
              {editing ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={[
                      styles.input,
                      nameFocused && styles.inputFocused,
                      webInputReset,
                    ]}
                    value={draftName}
                    onChangeText={setDraftName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholder="Your name"
                    placeholderTextColor={COLORS.textSecondary}
                    autoFocus
                  />
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.saveButton,
                      pressed && styles.saveButtonPressed,
                      Platform.OS === "web" && styles.webPointer,
                    ]}
                    onPress={handleSaveName}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.textOnPrimary}
                      />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setNameFocused(true);
                    setEditing(true);
                  }}
                  style={({ pressed }) => [
                    styles.nameRow,
                    pressed && styles.nameRowPressed,
                    Platform.OS === "web" && styles.webPointer,
                  ]}
                >
                  <Text style={styles.nameValue}>
                    {profile.full_name || "Tap to add your name"}
                  </Text>
                  <View style={styles.editHint}>
                    <Ionicons
                      name="pencil-outline"
                      size={14}
                      color={COLORS.teal}
                    />
                    <Text style={styles.editHintText}>Edit</Text>
                  </View>
                </Pressable>
              )}

              <Text style={styles.label}>Email</Text>
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={17} color={COLORS.teal} />
                <Text style={styles.detailText}>{profile.email}</Text>
              </View>

              <Text style={styles.label}>User ID</Text>
              <View style={styles.detailRow}>
                <Ionicons
                  name="finger-print-outline"
                  size={17}
                  color={COLORS.teal}
                />
                <Text style={styles.detailTextSmall}>{profile.id}</Text>
              </View>
            </View>
          )}

          <View style={styles.signOut}>
            <AppButton
              title="Sign Out"
              icon="log-out-outline"
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
  },
  content: {
    width: "100%",
    maxWidth: 720,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  loadingCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.teal,
  },
  roleBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  roleBadgeAdmin: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleBadgeTeacher: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentSoft,
  },
  roleBadgeStudent: {
    backgroundColor: COLORS.studentSoft,
    borderColor: COLORS.border,
  },
  roleBadgeText: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  roleBadgeAdminText: {
    color: COLORS.textOnPrimary,
  },
  roleBadgeTeacherText: {
    color: COLORS.accent,
  },
  roleBadgeStudentText: {
    color: COLORS.studentStrong,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.tealBorder,
    marginTop: 14,
    marginBottom: 4,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: COLORS.textSecondary,
  },
  nameRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: "#F7FBF9",
  },
  nameRowPressed: {
    backgroundColor: COLORS.tealSoft,
  },
  nameValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editHintText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.teal,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputFocused: {
    borderColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  saveButton: {
    minWidth: 68,
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.teal,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textOnPrimary,
  },
  detailRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: "#F7FBF9",
  },
  detailText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    color: COLORS.textPrimary,
  },
  detailTextSmall: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  signOut: {
    marginTop: 16,
  },
  webPointer: {
    cursor: "pointer",
  },
});
