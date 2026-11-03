import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";

type Props = {
  onSignOut: () => void;
  onNavigate?: () => void;
  signingOut?: boolean;
};

const NAV_ITEMS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  { label: "Dashboard", icon: "grid-outline", route: "/admin" },
  { label: "Manage Users", icon: "people-outline", route: "/admin/users" },
  {
    label: "Manage Students",
    icon: "school-outline",
    route: "/admin/students",
  },
  {
    label: "Manage Teachers",
    icon: "person-outline",
    route: "/admin/teachers",
  },
  { label: "Manage Events", icon: "calendar-outline", route: "/admin/events" },
  {
    label: "Attendance Records",
    icon: "checkbox-outline",
    route: "/admin/attendance",
  },
];

export default function AdminSidebar({
  onSignOut,
  onNavigate,
  signingOut = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname().replace(/\/+$/, "") || "/";

  const open = (route: string) => {
    router.push(route as any);
    onNavigate?.();
  };

  const isActive = (route: string) =>
    pathname === route || (route === "/admin" && pathname === "/admin/index");

  return (
    <View style={styles.sidebar}>
      <InteractivePressable
        onPress={() => open("/admin")}
        style={styles.brand}
        hoverStyle={styles.brandHover}
        hoverScale={1.01}
        hoverTranslateX={2}
        pressScale={0.99}
        accessibilityRole="button"
        accessibilityLabel="Go to dashboard"
      >
        <View style={styles.brandMark}>
          <Ionicons name="qr-code" size={19} color={ADMIN_COLORS.accentStrong} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandTitle}>QR Attendance</Text>
          <Text style={styles.brandSubtitle}>Admin Panel</Text>
        </View>
      </InteractivePressable>

      <ScrollView
        style={styles.navScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.navContent}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.route);
          return (
            <InteractivePressable
              key={item.route}
              onPress={() => open(item.route)}
              style={[styles.navItem, active && styles.navItemActive]}
              hoverStyle={
                active ? styles.navItemActiveHover : styles.navItemHover
              }
              pressedStyle={!active ? styles.navItemPressed : undefined}
              hoverScale={1}
              hoverTranslateX={active ? 0 : 2}
              pressScale={0.99}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <Ionicons
                name={item.icon}
                size={17}
                color={
                  active ? ADMIN_COLORS.sidebarActiveText : ADMIN_COLORS.sidebarText
                }
              />
              <Text
                style={[styles.navLabel, active && styles.navLabelActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </InteractivePressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerDivider} />

        <InteractivePressable
          onPress={() => open("/admin/profile")}
          style={styles.footerItem}
          hoverStyle={styles.navItemHover}
          pressedStyle={styles.navItemPressed}
          hoverScale={1}
          hoverTranslateX={2}
          pressScale={0.99}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
        >
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={ADMIN_COLORS.sidebarText}
          />
          <Text style={styles.footerItemText}>Profile</Text>
        </InteractivePressable>

        <InteractivePressable
          onPress={onSignOut}
          disabled={signingOut}
          style={[styles.footerItem, signingOut && styles.signOutDisabled]}
          hoverStyle={styles.navItemHover}
          pressedStyle={styles.navItemPressed}
          hoverScale={1}
          hoverTranslateX={2}
          pressScale={0.99}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={ADMIN_COLORS.sidebarText}
          />
          <Text style={styles.footerItemText}>
            {signingOut ? "Logging out…" : "Logout"}
          </Text>
        </InteractivePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.sidebarSurface,
    paddingTop: 20,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 26,
    borderRadius: 10,
  },
  brandHover: {
    backgroundColor: "rgba(11, 27, 43, 0.08)",
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accentSoft,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: ADMIN_COLORS.sidebarMuted,
    marginTop: 2,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingBottom: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 7,
    marginBottom: 3,
  },
  navItemActive: {
    backgroundColor: ADMIN_COLORS.sidebarActive,
  },
  navItemHover: {
    backgroundColor: "rgba(11, 27, 43, 0.08)",
  },
  navItemActiveHover: {
    backgroundColor: ADMIN_COLORS.sidebarActiveSoft,
  },
  navItemPressed: {
    backgroundColor: "rgba(11, 27, 43, 0.14)",
  },
  navLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "500",
    color: ADMIN_COLORS.sidebarText,
  },
  navLabelActive: {
    color: ADMIN_COLORS.sidebarActiveText,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 2,
    paddingBottom: 14,
  },
  footerDivider: {
    height: 1,
    backgroundColor: "rgba(11, 27, 43, 0.18)",
    marginBottom: 10,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 7,
    marginBottom: 2,
  },
  footerItemText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: ADMIN_COLORS.sidebarText,
  },
  signOutDisabled: {
    opacity: 0.55,
  },
});
