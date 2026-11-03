import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

import { COLORS } from "@/constants/colors";

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: "primary";
  onPress: () => void;
};

export default function AppButton({ title, icon, theme, onPress }: Props) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = theme === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        hovered && (isPrimary ? styles.primaryHover : styles.secondaryHover),
        pressed && styles.pressed,
        Platform.OS === "web" && styles.webPointer,
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color={isPrimary ? COLORS.textOnPrimary : COLORS.teal}
        style={styles.icon}
      />
      <Text style={[styles.label, isPrimary && styles.primaryLabel]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 56,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  primary: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  secondary: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.tealBorder,
  },
  primaryHover: {
    backgroundColor: COLORS.tealDark,
    borderColor: COLORS.tealDark,
  },
  secondaryHover: {
    borderColor: COLORS.teal,
    backgroundColor: "#F8FCFA",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  icon: {
    paddingRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  primaryLabel: {
    color: COLORS.textOnPrimary,
  },
  webPointer: {
    cursor: "pointer",
  },
});
