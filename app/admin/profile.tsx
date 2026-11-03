import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdminScreenHeader from "@/components/admin/AdminScreenHeader";
import InteractivePressable from "@/components/admin/InteractivePressable";
import { ADMIN_COLORS } from "@/constants/colors";
import { signOut, useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { formatDate } from "@/lib/datetime";
import { getProfile, initials, type Profile } from "@/lib/profiles";

export default function AdminProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) return;

      setLoading(true);
      getProfile(user)
        .then((next) => {
          if (active) setProfile(next);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [user]),
  );

  const name = profile?.full_name?.trim() || profile?.email || "Administrator";
  const avatarText = initials(name) || "A";

  const handleSignOut = () => {
    confirmAction({
      title: "Log out?",
      message: "You will need to sign in again to access the admin dashboard.",
      confirmLabel: "Logout",
      destructive: true,
      onConfirm: async () => {
        setSigningOut(true);
        await signOut();
        setSigningOut(false);
        router.replace("/login");
      },
    });
  };

  return (
    <View style={styles.screen}>
      <AdminScreenHeader
        title="Profile"
        subtitle="Your administrator account details."
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={ADMIN_COLORS.accent} />
            <Text style={styles.loadingText}>Loading your profile…</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.identity}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{avatarText}</Text>
                </View>
                <View style={styles.identityCopy}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {profile?.email || "Administrator account"}
                  </Text>
                </View>
                <View style={styles.roleChip}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={12}
                    color={ADMIN_COLORS.accentStrong}
                  />
                  <Text style={styles.roleText}>Administrator</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={ADMIN_COLORS.accentStrong}
                  />
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Email address</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {profile?.email || "Not set"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={ADMIN_COLORS.accentStrong}
                  />
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Account status</Text>
                  <Text style={styles.detailValue}>
                    {profile?.is_active === false ? "Inactive" : "Active"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={ADMIN_COLORS.accentStrong}
                  />
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Member since</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(profile?.created_at)}
                  </Text>
                </View>
              </View>
            </View>

            <InteractivePressable
              onPress={handleSignOut}
              disabled={signingOut}
              style={[styles.logout, signingOut && styles.logoutDisabled]}
              hoverStyle={styles.logoutHover}
              pressedStyle={styles.logoutPressed}
              hoverScale={1.01}
              hoverTranslateY={-1}
              pressScale={0.99}
              accessibilityRole="button"
              accessibilityLabel="Log out of the admin dashboard"
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={ADMIN_COLORS.danger}
              />
              <Text style={styles.logoutText}>
                {signingOut ? "Logging out…" : "Logout"}
              </Text>
            </InteractivePressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  loadingCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingVertical: 36,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
  },
  card: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 18,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    flexWrap: "wrap",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accent,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: ADMIN_COLORS.white,
    letterSpacing: 0.4,
  },
  identityCopy: {
    flex: 1,
    minWidth: 140,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  email: {
    marginTop: 2,
    fontSize: 11.5,
    color: ADMIN_COLORS.textMuted,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: ADMIN_COLORS.accentSoft,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
    color: ADMIN_COLORS.accentStrong,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_COLORS.border,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 9,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: ADMIN_COLORS.textSoft,
  },
  detailValue: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  logout: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: ADMIN_COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "#F0CED3",
  },
  logoutHover: {
    backgroundColor: "#F5D7DB",
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutDisabled: {
    opacity: 0.55,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "700",
    color: ADMIN_COLORS.danger,
  },
});
