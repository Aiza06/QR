import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";

type Props = {
  onNavigate: (route: string) => void;
};

type QuickAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  soft: string;
  strong: string;
};

const ACTIONS: QuickAction[] = [
  {
    title: "Create Event",
    subtitle: "Schedule a new attendance event",
    icon: "calendar-outline",
    route: "/admin/events",
    soft: ADMIN_COLORS.mintSoft,
    strong: ADMIN_COLORS.mintStrong,
  },
  {
    title: "Add Student",
    subtitle: "Register a new student account",
    icon: "person-add-outline",
    route: "/admin/students",
    soft: ADMIN_COLORS.lavenderSoft,
    strong: ADMIN_COLORS.lavenderStrong,
  },
  {
    title: "Add Teacher",
    subtitle: "Register a new teacher account",
    icon: "school-outline",
    route: "/admin/teachers",
    soft: ADMIN_COLORS.pinkSoft,
    strong: ADMIN_COLORS.pinkStrong,
  },
];

export default function AdminQuickActions({ onNavigate }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="flash-outline"
            size={16}
            color={ADMIN_COLORS.amberStrong}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Quick Actions</Text>
          <Text style={styles.subtitle}>Jump straight in</Text>
        </View>
      </View>

      <View style={styles.list}>
        {ACTIONS.map((action) => (
          <InteractivePressable
            key={action.route + action.title}
            onPress={() => onNavigate(action.route)}
            style={styles.row}
            hoverStyle={styles.rowHover}
            pressedStyle={styles.rowPressed}
            hoverScale={1.005}
            hoverTranslateX={3}
            pressScale={0.99}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}. ${action.subtitle}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: action.soft }]}>
              <Ionicons name={action.icon} size={17} color={action.strong} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>{action.title}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {action.subtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={ADMIN_COLORS.textSoft}
            />
          </InteractivePressable>
        ))}
      </View>
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
    gap: 9,
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.amberSoft,
  },
  headerCopy: {
    flex: 1,
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
  list: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  rowHover: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
  },
  rowPressed: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    opacity: 0.86,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  rowSubtitle: {
    marginTop: 1,
    fontSize: 9.5,
    color: ADMIN_COLORS.textMuted,
  },
});
