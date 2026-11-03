import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { COLORS } from "@/constants/colors";
import { signOut, useAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profiles";

function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const path = segments?.[0];
    const inAuthGroup = path === "login" || path === "register";
    const inTabsGroup = path === "(tabs)";
    const inAdminGroup = path === "admin";

    if (!session) {
      if (inTabsGroup || inAdminGroup) {
        router.replace("/login");
      }
      return;
    }

    if (!inAuthGroup) return;

    // Send administrators straight to the dashboard after sign-in instead
    // of making them go through Home or Profile first.
    let active = true;
    getProfile(session.user)
      .then((profile) => {
        if (!active) return;
        const isAdmin = profile.role === "admin" && profile.is_active !== false;
        router.replace(isAdmin ? "/admin" : "/(tabs)");
      })
      .catch(() => {
        if (active) router.replace("/(tabs)");
      });

    return () => {
      active = false;
    };
  }, [session, loading, segments, router]);
}

export default function RootLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useProtectedRoute();

  useEffect(() => {
    if (loading || !user) return;

    let active = true;
    getProfile(user)
      .then(async (profile) => {
        if (!active || profile.is_active !== false) return;
        await signOut();
        router.replace("/login");
      })
      .catch(() => {
        // A profile read failure is handled by the individual screens.
      });

    return () => {
      active = false;
    };
  }, [user, loading, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});
