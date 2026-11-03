import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";
import type { DashboardUpcomingEvent } from "@/lib/admin";
import { formatTime } from "@/lib/datetime";

type Props = {
  items: DashboardUpcomingEvent[];
  loading?: boolean;
  error?: string | null;
  onViewAll: () => void;
};

function getDateParts(iso: string | null) {
  if (!iso) return { month: "—", day: "--" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { month: "—", day: "--" };
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
  };
}

export default function AdminUpcomingEvents({
  items,
  loading = false,
  error = null,
  onViewAll,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={ADMIN_COLORS.lavenderStrong}
            />
          </View>
          <View>
            <Text style={styles.title}>Upcoming Events</Text>
            <Text style={styles.subtitle}>
              Next scheduled attendance events
            </Text>
          </View>
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
          accessibilityLabel="View all events"
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons
            name="arrow-forward"
            size={12}
            color={ADMIN_COLORS.lavenderStrong}
          />
        </InteractivePressable>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="small" color={ADMIN_COLORS.lavenderStrong} />
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
            name="calendar-clear-outline"
            size={21}
            color={ADMIN_COLORS.textSoft}
          />
          <Text style={styles.stateText}>
            No upcoming events. Create an event to schedule attendance.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((event) => {
            const date = getDateParts(event.start_time);
            const start = formatTime(event.start_time);
            const end = formatTime(event.end_time);
            return (
              <InteractivePressable
                key={event.id}
                onPress={onViewAll}
                style={styles.row}
                hoverStyle={styles.rowHover}
                pressedStyle={styles.rowPressed}
                hoverScale={1.005}
                hoverTranslateX={2}
                pressScale={0.985}
                accessibilityRole="button"
                accessibilityLabel={`${event.title}. ${start}`}
              >
                <View style={styles.dateBadge}>
                  <Text style={styles.dateMonth}>{date.month}</Text>
                  <Text style={styles.dateDay}>{date.day}</Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventMeta} numberOfLines={1}>
                    {start}
                    {end ? ` – ${end}` : ""} · {event.event_code}
                  </Text>
                </View>
                <View style={styles.upcomingPill}>
                  <Text style={styles.upcomingText}>Upcoming</Text>
                </View>
              </InteractivePressable>
            );
          })}
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
    padding: 14,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 14,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.lavenderSoft,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: ADMIN_COLORS.lavenderSoft,
  },
  viewAllHover: {
    backgroundColor: "#E7DDF7",
  },
  viewAllPressed: {
    opacity: 0.72,
  },
  viewAllText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: ADMIN_COLORS.lavenderStrong,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  rowHover: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
  },
  rowPressed: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    opacity: 0.86,
  },
  dateBadge: {
    width: 42,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.lavenderSoft,
    borderWidth: 1,
    borderColor: "#E5DAF5",
    flexShrink: 0,
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: ADMIN_COLORS.lavenderStrong,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: ADMIN_COLORS.text,
    marginTop: -1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  eventMeta: {
    marginTop: 2,
    fontSize: 8.5,
    color: ADMIN_COLORS.textMuted,
  },
  upcomingPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.mintSoft,
    flexShrink: 0,
  },
  upcomingText: {
    fontSize: 7.5,
    fontWeight: "800",
    color: ADMIN_COLORS.mintStrong,
  },
  state: {
    minHeight: 130,
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
