import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";

type Tone = "mint" | "slate" | "sage" | "cream";

type Props = {
  label: string;
  value: number | null;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
  tone?: Tone;
};

const TONES: Record<Tone, { background: string; ink: string }> = {
  mint: {
    background: ADMIN_COLORS.statMint,
    ink: ADMIN_COLORS.statMintInk,
  },
  slate: {
    background: ADMIN_COLORS.statSlate,
    ink: ADMIN_COLORS.statSlateInk,
  },
  sage: {
    background: ADMIN_COLORS.statSage,
    ink: ADMIN_COLORS.statSageInk,
  },
  cream: {
    background: ADMIN_COLORS.statCream,
    ink: ADMIN_COLORS.statCreamInk,
  },
};

export default function AdminStatCard({
  label,
  value,
  icon,
  onPress,
  loading = false,
  tone = "mint",
}: Props) {
  const palette = TONES[tone];

  return (
    <InteractivePressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: palette.background }]}
      hoverStyle={styles.cardHover}
      pressedStyle={styles.pressed}
      hoverScale={1.01}
      hoverTranslateY={-3}
      pressScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value ?? 0}. Open management screen.`}
    >
      <Ionicons name={icon} size={20} color={palette.ink} />

      <Text style={[styles.label, { color: palette.ink }]} numberOfLines={1}>
        {label}
      </Text>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={palette.ink}
          style={styles.loader}
        />
      ) : (
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {(value ?? 0).toLocaleString()}
        </Text>
      )}
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 140,
    minHeight: 112,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  cardHover: {
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    marginTop: 5,
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
  },
  value: {
    marginTop: 7,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: ADMIN_COLORS.text,
  },
  loader: {
    marginTop: 7,
  },
});
