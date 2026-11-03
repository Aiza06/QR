import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdminRecentActivity from "@/components/admin/AdminRecentActivity";
import AdminReveal from "@/components/admin/AdminReveal";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { AdminError } from "@/components/admin/AdminState";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { ADMIN_COLORS } from "@/constants/colors";
import {
  getDashboardExtras,
  getDashboardStats,
  type DashboardExtras,
  type DashboardStats,
} from "@/lib/admin";
import { signOut, useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { getProfile, type Profile } from "@/lib/profiles";

const TABLET_BREAKPOINT = 900;
const SIDEBAR_WIDTH = 248;
const USE_NATIVE_DRIVER = Platform.OS !== "web";

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width >= TABLET_BREAKPOINT;
  const isMobile = !isTablet;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [extras, setExtras] = useState<DashboardExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(isTablet);
  const [mobileSidebarMounted, setMobileSidebarMounted] = useState(false);
  const mobileSidebarProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSidebarOpen(isTablet);
  }, [isTablet]);

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarMounted(false);
      mobileSidebarProgress.setValue(0);
      return;
    }

    if (sidebarOpen) {
      setMobileSidebarMounted(true);
      mobileSidebarProgress.setValue(0);
      const animation = Animated.timing(mobileSidebarProgress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      });
      animation.start();
      return () => animation.stop();
    }

    const animation = Animated.timing(mobileSidebarProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start(({ finished }) => {
      if (finished) setMobileSidebarMounted(false);
    });
    return () => animation.stop();
  }, [isMobile, mobileSidebarProgress, sidebarOpen]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setExtrasError(null);

      try {
        const [nextProfile, nextStats, nextExtras] = await Promise.all([
          getProfile(user),
          getDashboardStats(),
          getDashboardExtras(),
        ]);

        setProfile(nextProfile);

        if (nextStats.error) {
          setStats(null);
          setError(nextStats.error);
        } else {
          setStats(nextStats.data);
        }

        if (nextExtras.error) {
          setExtras(null);
          setExtrasError(nextExtras.error);
        } else {
          setExtras(nextExtras.data);
        }
      } catch (caught: any) {
        const message = caught?.message || "Could not load the dashboard.";
        setError(message);
        setExtrasError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

  const handleSidebarSignOut = () => {
    if (isMobile) setSidebarOpen(false);
    handleSignOut();
  };

  const navigate = (route: string) => {
    router.push(route as any);
  };

  const name = profile?.full_name?.trim() || profile?.email || "Administrator";
  const firstName = name.split(/\s+/)[0];
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const topBar = (
    <AdminTopBar
      isMobile={isMobile}
      onMenuPress={() => setSidebarOpen((open) => !open)}
    />
  );

  const sidebar = (
    <AdminSidebar
      onSignOut={handleSidebarSignOut}
      onNavigate={() => {
        if (isMobile) setSidebarOpen(false);
      }}
      signingOut={signingOut}
    />
  );

  return (
    <View style={styles.shell}>
      {isTablet && sidebarOpen ? (
        <View
          style={[
            styles.sidebarDesktop,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          {sidebar}
        </View>
      ) : null}

      <View style={styles.mainShell}>
        {topBar}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 30 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={ADMIN_COLORS.accent}
              colors={[ADMIN_COLORS.accent]}
              progressBackgroundColor={ADMIN_COLORS.card}
            />
          }
        >
          <View style={styles.page}>
            <AdminReveal delay={0} style={styles.reveal}>
              <View style={styles.pageHeader}>
                <View style={styles.pageIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={ADMIN_COLORS.white}
                  />
                </View>
                <View style={styles.pageHeaderCopy}>
                  <Text style={styles.pageTitle}>Dashboard</Text>
                  <Text style={styles.pageSubtitle} numberOfLines={1}>
                    Welcome back, {firstName} · {dateLabel}
                  </Text>
                </View>
              </View>
            </AdminReveal>

            <AdminReveal delay={70} style={styles.reveal}>
              {error ? (
                <View style={styles.statsError}>
                  <AdminError
                    title="Dashboard data unavailable"
                    message={error}
                    onRetry={() => load()}
                  />
                </View>
              ) : (
                <View style={styles.statsRow}>
                  <AdminStatCard
                    label="Total Users"
                    value={stats?.totalUsers ?? null}
                    icon="people-outline"
                    tone="mint"
                    loading={loading}
                    onPress={() => navigate("/admin/users")}
                  />
                  <AdminStatCard
                    label="Total Students"
                    value={stats?.totalStudents ?? null}
                    icon="school-outline"
                    tone="slate"
                    loading={loading}
                    onPress={() => navigate("/admin/students")}
                  />
                  <AdminStatCard
                    label="Total Teachers"
                    value={stats?.totalTeachers ?? null}
                    icon="person-outline"
                    tone="sage"
                    loading={loading}
                    onPress={() => navigate("/admin/teachers")}
                  />
                  <AdminStatCard
                    label="Attendance Records"
                    value={stats?.attendanceRecords ?? null}
                    icon="checkmark-done-outline"
                    tone="cream"
                    loading={loading}
                    onPress={() => navigate("/admin/attendance")}
                  />
                </View>
              )}
            </AdminReveal>

            <AdminReveal delay={140} style={styles.reveal}>
              <AdminRecentActivity
                items={extras?.recentActivity ?? []}
                loading={loading}
                error={extrasError}
                onViewAll={() => navigate("/admin/attendance")}
              />
            </AdminReveal>

            <AdminReveal delay={200} style={styles.reveal}>
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  QR Attendance System · Admin Panel
                </Text>
                <Text style={styles.footerQuote}>
                  Learn · Attend · Succeed
                </Text>
              </View>
            </AdminReveal>
          </View>
        </ScrollView>
      </View>

      {isMobile && (sidebarOpen || mobileSidebarMounted) ? (
        <Animated.View
          style={[styles.mobileOverlay, { opacity: mobileSidebarProgress }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={styles.scrim}
            onPress={() => setSidebarOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close navigation menu"
          />
          <Animated.View
            style={[
              styles.mobileSidebarPanel,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                transform: [
                  {
                    translateX: mobileSidebarProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-280, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {sidebar}
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: ADMIN_COLORS.background,
  },
  sidebarDesktop: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    backgroundColor: ADMIN_COLORS.sidebarSurface,
  },
  mainShell: {
    flex: 1,
    minWidth: 0,
  },
  scroll: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  page: {
    width: "100%",
    maxWidth: 1320,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  reveal: {
    width: "100%",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 16,
  },
  pageIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accent,
  },
  pageHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: ADMIN_COLORS.text,
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: ADMIN_COLORS.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statsError: {
    marginTop: 0,
  },
  footer: {
    marginTop: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  footerText: {
    fontSize: 10,
    color: ADMIN_COLORS.textSoft,
  },
  footerQuote: {
    fontSize: 10,
    fontStyle: "italic",
    fontWeight: "600",
    color: ADMIN_COLORS.textMuted,
  },
  mobileOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(11, 27, 43, 0.45)",
  },
  mobileSidebarPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 268,
    backgroundColor: ADMIN_COLORS.sidebarSurface,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 14,
  },
});
