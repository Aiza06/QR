import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";

type Props = {
  onNavigate: (route: string) => void;
};

type NavItem = {
  title: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  soft: string;
  strong: string;
};

const ITEMS: NavItem[] = [
  {
    title: "Manage Users",
    caption: "All accounts",
    icon: "people-outline",
    route: "/admin/users",
    soft: ADMIN_COLORS.mintSoft,
    strong: ADMIN_COLORS.mintStrong,
  },
  {
    title: "Manage Students",
    caption: "Student records",
    icon: "school-outline",
    route: "/admin/students",
    soft: ADMIN_COLORS.blueSoft,
    strong: ADMIN_COLORS.blueStrong,
  },
  {
    title: "Manage Teachers",
    caption: "Teacher records",
    icon: "person-outline",
    route: "/admin/teachers",
    soft: ADMIN_COLORS.lavenderSoft,
    strong: ADMIN_COLORS.lavenderStrong,
  },
  {
    title: "Manage Events",
    caption: "Events list",
    icon: "calendar-outline",
    route: "/admin/events",
    soft: ADMIN_COLORS.amberSoft,
    strong: ADMIN_COLORS.amberStrong,
  },
  {
    title: "Attendance Records",
    caption: "All scan records",
    icon: "checkbox-outline",
    route: "/admin/attendance",
    soft: ADMIN_COLORS.mintSoft,
    strong: ADMIN_COLORS.mintStrong,
  },
];

export default function AdminQuickNavigation({ onNavigate }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="grid-outline"
            size={16}
            color={ADMIN_COLORS.blueStrong}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Quick Navigation</Text>
          <Text style={styles.subtitle}>Every admin tool in one place</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {ITEMS.map((item) => (
          <InteractivePressable
            key={item.route + item.title}
            onPress={() => onNavigate(item.route)}
            style={styles.item}
            hoverStyle={[
              styles.itemHover,
              { backgroundColor: item.soft, borderColor: item.strong },
            ]}
            pressedStyle={styles.itemPressed}
            hoverScale={1.01}
            hoverTranslateY={-2}
            pressScale={0.985}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.caption}`}
          >
            <View style={[styles.itemIcon, { backgroundColor: item.soft }]}>
              <Ionicons name={item.icon} size={16} color={item.strong} />
            </View>
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemCaption} numberOfLines={1}>
                {item.caption}
              </Text>
            </View>
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
    backgroundColor: ADMIN_COLORS.blueSoft,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  item: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 132,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    backgroundColor: "#FAFCFE",
  },
  itemHover: {
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  itemPressed: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    opacity: 0.86,
  },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  itemCaption: {
    marginTop: 1,
    fontSize: 8.5,
    color: ADMIN_COLORS.textMuted,
  },
});
