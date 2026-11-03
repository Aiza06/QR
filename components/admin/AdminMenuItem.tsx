import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

type Props = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export default function AdminMenuItem({
  title,
  description,
  icon,
  onPress,
  isFirst = false,
  isLast = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isFirst && styles.first,
        isLast && styles.last,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={19} color={ADMIN_COLORS.accentStrong} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      </View>

      <View style={styles.chevronWrap}>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={ADMIN_COLORS.textMuted}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: ADMIN_COLORS.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  first: {
    borderTopWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  last: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  pressed: {
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 16,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
});
