import { StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";
import type { Role } from "@/lib/profiles";

type Tone = "admin" | "teacher" | "student" | "active" | "inactive" | "live" | "upcoming" | "ended";

type Props = {
  label: string;
  tone?: Tone;
};

const TONES: Record<Tone, { background: string; color: string }> = {
  admin: { background: ADMIN_COLORS.header, color: ADMIN_COLORS.white },
  teacher: { background: ADMIN_COLORS.accentSoft, color: ADMIN_COLORS.accentStrong },
  student: { background: "#EDF1F7", color: "#41506B" },
  active: { background: ADMIN_COLORS.successSoft, color: ADMIN_COLORS.success },
  inactive: { background: ADMIN_COLORS.dangerSoft, color: ADMIN_COLORS.danger },
  live: { background: ADMIN_COLORS.successSoft, color: ADMIN_COLORS.success },
  upcoming: { background: ADMIN_COLORS.warningSoft, color: ADMIN_COLORS.warning },
  ended: { background: "#EEECEA", color: ADMIN_COLORS.textMuted },
};

export function roleTone(role: Role): Tone {
  return role;
}

export default function AdminBadge({ label, tone = "student" }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
