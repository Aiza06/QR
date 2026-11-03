import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";
import type { DashboardActivityItem, DashboardActivityKind } from "@/lib/admin";

type Props = {
  items: DashboardActivityItem[];
  loading?: boolean;
  error?: string | null;
  onViewAll: () => void;
};

const ACTIVITY_STYLES: Record<
  DashboardActivityKind,
  { icon: keyof typeof Ionicons.glyphMap; soft: string; strong: string }
> = {
  attendance: {
    icon: "checkmark-circle-outline",
    soft: ADMIN_COLORS.mintSoft,
    strong: ADMIN_COLORS.mintStrong,
  },
  event: {
    icon: "calendar-outline",
    soft: ADMIN_COLORS.blueSoft,
    strong: ADMIN_COLORS.blueStrong,
  },
  student: {
    icon: "person-add-outline",
    soft: ADMIN_COLORS.lavenderSoft,
    strong: ADMIN_COLORS.lavenderStrong,
  },
  teacher: {
    icon: "school-outline",
    soft: ADMIN_COLORS.pinkSoft,
    strong: ADMIN_COLORS.pinkStrong,
  },
  admin: {
    icon: "shield-checkmark-outline",
    soft: ADMIN_COLORS.amberSoft,
    strong: ADMIN_COLORS.amberStrong,
  },
};

function relativeTime(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AdminRecentActivity({
  items,
  loading = false,
  error = null,
  onViewAll,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="time-outline" size={17} color={ADMIN_COLORS.white} />
          </View>
          <Text style={styles.title}>Recent Activities</Text>
        </View>
        <InteractivePressable
          onPress={onViewAll}
          style={styles.viewAll}
          hoverStyle={styles.viewAllHover}
          pressedStyle={styles.viewAllPressed}
          hoverScale={1.04}
          hoverTranslateX={1}
          pressScale={0.97}
          accessibilityRole="button"
          accessibilityLabel="View all attendance records"
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons
            name="arrow-forward"
            size={12}
            color={ADMIN_COLORS.accentStrong}
          />
        </InteractivePressable>
      </View>

      <View style={styles.card}>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator size="small" color={ADMIN_COLORS.accent} />
          </View>
        ) : error ? (
          <View style={styles.state}>
            <Ionicons
              name="alert-circle-outline"
              size={19}
              color={ADMIN_COLORS.textSoft}
            />
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.state}>
            <Ionicons
              name="time-outline"
              size={21}
              color={ADMIN_COLORS.textSoft}
            />
            <Text style={styles.stateText}>
              No recent activity yet. New accounts, events, and attendance scans
              will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => {
              const palette = ACTIVITY_STYLES[item.kind];
              return (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    index === items.length - 1 && styles.rowLast,
                  ]}
                >
                  <View
                    style={[styles.rowIcon, { backgroundColor: palette.soft }]}
                  >
                    <Ionicons
                      name={palette.icon}
                      size={16}
                      color={palette.strong}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <View style={styles.rowTitleLine}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.rowTime}>
                        {relativeTime(item.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.rowDetail} numberOfLines={2}>
                      {item.detail}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    marginTop: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accent,
  },
  title: {
    fontSize: 14.5,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    letterSpacing: -0.1,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: ADMIN_COLORS.accentSoft,
  },
  viewAllHover: {
    backgroundColor: "#CBEBDD",
  },
  viewAllPressed: {
    opacity: 0.72,
  },
  viewAllText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: ADMIN_COLORS.accentStrong,
  },
  card: {
    width: "100%",
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  list: {
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF5F1",
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  rowTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  rowTime: {
    fontSize: 8.5,
    color: ADMIN_COLORS.textSoft,
    flexShrink: 0,
  },
  rowDetail: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    color: ADMIN_COLORS.textMuted,
  },
  state: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
  },
  stateText: {
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
    color: ADMIN_COLORS.textMuted,
  },
});
