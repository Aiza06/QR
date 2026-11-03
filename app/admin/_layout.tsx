import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";
import { signOut, useAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profiles";

type Access = "checking" | "allowed" | "denied";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [access, setAccess] = useState<Access>("checking");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setAccess("denied");
      router.replace("/login");
      return;
    }

    let active = true;
    setAccess("checking");

    getProfile(user)
      .then(async (profile) => {
        if (!active) return;

        if (profile.role === "admin" && profile.is_active !== false) {
          setAccess("allowed");
          return;
        }

        setAccess("denied");
        if (profile.is_active === false) {
          await signOut();
          router.replace("/login");
        } else {
          router.replace("/(tabs)");
        }
      })
      .catch(() => {
        if (!active) return;
        setAccess("denied");
        router.replace("/(tabs)");
      });

    return () => {
      active = false;
    };
  }, [user, loading, router]);

  // Re-verify privileged access whenever the admin navigates to another
  // screen, so a revoked role does not leave an open dashboard session.
  useEffect(() => {
    if (access !== "allowed" || !user) return;

    let active = true;
    getProfile(user)
      .then(async (profile) => {
        if (!active) return;
        if (profile.role === "admin" && profile.is_active !== false) return;

        setAccess("denied");
        if (profile.is_active === false) {
          await signOut();
          router.replace("/login");
        } else {
          router.replace("/(tabs)");
        }
      })
      .catch(() => {
        if (!active) return;
        setAccess("denied");
        router.replace("/(tabs)");
      });

    return () => {
      active = false;
    };
  }, [access, pathname, router, user]);

  if (access !== "allowed") {
    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="shield-checkmark-outline"
            size={28}
            color={ADMIN_COLORS.accentStrong}
          />
        </View>
        <ActivityIndicator size="small" color={ADMIN_COLORS.accent} />
        <Text style={styles.label}>
          {access === "denied"
            ? "Checking your access…"
            : "Verifying administrator access…"}
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ADMIN_COLORS.background },
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: ADMIN_COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    color: ADMIN_COLORS.textMuted,
    textAlign: "center",
  },
});
