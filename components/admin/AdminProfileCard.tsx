import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";
import { initials, type Profile } from "@/lib/profiles";

import AdminBadge from "./AdminBadge";

type Props = {
  profile: Profile | null;
  onSignOut: () => void;
  signingOut?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function AdminProfileCard({
  profile,
  onSignOut,
  signingOut = false,
  style,
}: Props) {
  const name = profile?.full_name?.trim() || profile?.email || "Administrator";
  const email = profile?.email || "Loading account…";

  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.accentBar} />

      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name) || "AD"}</Text>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
          <Text style={styles.caption}>Signed in as administrator</Text>
        </View>

        <AdminBadge label="Admin" tone="admin" />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.statusGroup}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: profile?.is_active === false
                  ? ADMIN_COLORS.danger
                  : ADMIN_COLORS.success,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {profile?.is_active === false ? "Account inactive" : "Account active"}
          </Text>
        </View>

        <Pressable
          onPress={onSignOut}
          disabled={signingOut}
          style={({ pressed }) => [
            styles.signOut,
            pressed && styles.signOutPressed,
            signingOut && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={ADMIN_COLORS.text} />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={16}
              color={ADMIN_COLORS.text}
            />
          )}
          <Text style={styles.signOutText}>
            {signingOut ? "Signing out…" : "Sign Out"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 18,
    shadowColor: ADMIN_COLORS.header,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ADMIN_COLORS.accent,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: ADMIN_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: ADMIN_COLORS.accentStrong,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  email: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  caption: {
    fontSize: 11,
    color: ADMIN_COLORS.textSoft,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_COLORS.border,
    marginVertical: 14,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: ADMIN_COLORS.textMuted,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  signOutPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
});
