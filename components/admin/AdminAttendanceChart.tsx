import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { ADMIN_COLORS } from "@/constants/colors";
import type { DashboardTrendPoint } from "@/lib/admin";

type Props = {
  points: DashboardTrendPoint[];
  loading?: boolean;
  error?: string | null;
};

const CHART_HEIGHT = 168;
const PAD_LEFT = 26;
const PAD_RIGHT = 6;
const PAD_TOP = 12;
const PAD_BOTTOM = 10;

export default function AdminAttendanceChart({
  points,
  loading = false,
  error = null,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const highest = Math.max(1, ...points.map((point) => point.count));
  const niceMax = Math.max(5, Math.ceil(highest / 5) * 5);
  const plotWidth = Math.max(1, chartWidth - PAD_LEFT - PAD_RIGHT);
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coordinates = points.map((point, index) => {
    const step = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
    return {
      ...point,
      x: PAD_LEFT + index * step,
      y: PAD_TOP + plotHeight - (point.count / niceMax) * plotHeight,
    };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    coordinates.length > 0
      ? `M ${coordinates[0].x} ${PAD_TOP + plotHeight} ${coordinates
          .map((point) => `L ${point.x} ${point.y}`)
          .join(" ")} L ${coordinates[coordinates.length - 1].x} ${
          PAD_TOP + plotHeight
        } Z`
      : "";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="stats-chart-outline"
              size={16}
              color={ADMIN_COLORS.accent}
            />
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Attendance Overview</Text>
            <Text style={styles.subtitle}>
              {loading
                ? "Loading attendance records…"
                : `${total.toLocaleString()} scan${
                    total === 1 ? "" : "s"
                  } over the last 7 days`}
            </Text>
          </View>
        </View>
        <View style={styles.rangePill}>
          <Ionicons
            name="calendar-clear-outline"
            size={11}
            color={ADMIN_COLORS.accent}
          />
          <Text style={styles.rangeText}>Last 7 days</Text>
        </View>
      </View>

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
      ) : (
        <>
          <View
            style={styles.chartWrap}
            onLayout={(event) =>
              setChartWidth(event.nativeEvent.layout.width)
            }
          >
            {chartWidth > 0 ? (
              <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Defs>
                  <LinearGradient
                    id="attendanceArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop
                      offset="0"
                      stopColor={ADMIN_COLORS.accent}
                      stopOpacity="0.2"
                    />
                    <Stop
                      offset="1"
                      stopColor={ADMIN_COLORS.accent}
                      stopOpacity="0.015"
                    />
                  </LinearGradient>
                </Defs>

                {[0, 0.5, 1].map((ratio) => {
                  const y = PAD_TOP + plotHeight - ratio * plotHeight;
                  return (
                    <Line
                      key={ratio}
                      x1={PAD_LEFT}
                      y1={y}
                      x2={chartWidth - PAD_RIGHT}
                      y2={y}
                      stroke="#E7EEF7"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 ? undefined : "3 4"}
                    />
                  );
                })}

                {[0, 0.5, 1].map((ratio) => {
                  const y = PAD_TOP + plotHeight - ratio * plotHeight;
                  return (
                    <SvgText
                      key={`label-${ratio}`}
                      x={0}
                      y={y + 3}
                      fill={ADMIN_COLORS.textSoft}
                      fontSize="8.5"
                      fontWeight="600"
                    >
                      {Math.round(niceMax * ratio)}
                    </SvgText>
                  );
                })}

                {areaPath ? (
                  <Path d={areaPath} fill="url(#attendanceArea)" />
                ) : null}
                {linePath ? (
                  <Path
                    d={linePath}
                    fill="none"
                    stroke={ADMIN_COLORS.accent}
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}

                {coordinates.map((point) => (
                  <Circle
                    key={point.date}
                    cx={point.x}
                    cy={point.y}
                    r="3.2"
                    fill={ADMIN_COLORS.white}
                    stroke={ADMIN_COLORS.accent}
                    strokeWidth="2"
                  />
                ))}
              </Svg>
            ) : null}
          </View>

          <View style={styles.xLabels}>
            {points.map((point) => (
              <Text key={point.date} style={styles.xLabel} numberOfLines={1}>
                {point.label}
              </Text>
            ))}
          </View>
        </>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accentSoft,
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
  rangePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: ADMIN_COLORS.accentSoft,
  },
  rangeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: ADMIN_COLORS.accent,
  },
  chartWrap: {
    height: CHART_HEIGHT,
    width: "100%",
  },
  xLabels: {
    flexDirection: "row",
    paddingLeft: PAD_LEFT,
    paddingRight: PAD_RIGHT,
    marginTop: 2,
  },
  xLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 8.5,
    color: ADMIN_COLORS.textSoft,
    fontWeight: "600",
  },
  state: {
    minHeight: CHART_HEIGHT,
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
