import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { ADMIN_COLORS } from "@/constants/colors";
import type { DashboardBreakdownItem } from "@/lib/admin";

type Props = {
  items: DashboardBreakdownItem[];
  total: number;
  loading?: boolean;
  error?: string | null;
};

const SIZE = 132;
const STROKE = 17;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_COLORS = [
  ADMIN_COLORS.accent,
  "#E2B93B",
  ADMIN_COLORS.pinkStrong,
  ADMIN_COLORS.lavenderStrong,
];

export default function AdminAttendanceBreakdown({
  items,
  total,
  loading = false,
  error = null,
}: Props) {
  let runningOffset = 0;
  const segments = items.map((item, index) => {
    const length = total > 0 ? (item.value / total) * CIRCUMFERENCE : 0;
    const segment = {
      ...item,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      length,
      offset: runningOffset,
      percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
    };
    runningOffset += length;
    return segment;
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="pie-chart-outline"
            size={16}
            color={ADMIN_COLORS.pinkStrong}
          />
        </View>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>Attendance by Event</Text>
          <Text style={styles.subtitle}>
            Top events from the last 7 days
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="small" color={ADMIN_COLORS.pinkStrong} />
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
      ) : (
        <View style={styles.body}>
          <View style={styles.donutWrap}>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="#EDF2F9"
                strokeWidth={STROKE}
                fill="none"
              />
              {segments.map((segment) => (
                <Circle
                  key={segment.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={segment.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${segment.length} ${
                    CIRCUMFERENCE - segment.length
                  }`}
                  strokeDashoffset={-segment.offset}
                  fill="none"
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              ))}
            </Svg>
            <View pointerEvents="none" style={styles.donutCenter}>
              <Text style={styles.donutValue}>{total.toLocaleString()}</Text>
              <Text style={styles.donutLabel}>Total scans</Text>
            </View>
          </View>

          <View style={styles.legend}>
            {segments.length > 0 ? (
              segments.map((segment) => (
                <View key={segment.label} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: segment.color },
                    ]}
                  />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {segment.label}
                  </Text>
                  <Text style={styles.legendValue}>
                    {segment.value} · {segment.percent}%
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.legendEmpty}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={ADMIN_COLORS.textSoft}
                />
                <Text style={styles.legendEmptyText}>
                  No attendance records in this period.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 16,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.pinkSoft,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 2,
    minHeight: 168,
  },
  donutWrap: {
    width: SIZE,
    height: SIZE,
    position: "relative",
    flexShrink: 0,
  },
  donutCenter: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  donutValue: {
    fontSize: 21,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    letterSpacing: -0.5,
  },
  donutLabel: {
    marginTop: 1,
    fontSize: 8.5,
    fontWeight: "600",
    color: ADMIN_COLORS.textMuted,
  },
  legend: {
    flex: 1,
    minWidth: 0,
    gap: 9,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: "600",
    color: ADMIN_COLORS.textMuted,
  },
  legendValue: {
    fontSize: 9,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
    flexShrink: 0,
  },
  legendEmpty: {
    alignItems: "flex-start",
    gap: 7,
  },
  legendEmptyText: {
    fontSize: 10,
    lineHeight: 15,
    color: ADMIN_COLORS.textMuted,
  },
  state: {
    minHeight: 168,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  stateText: {
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
    color: ADMIN_COLORS.textMuted,
  },
});
