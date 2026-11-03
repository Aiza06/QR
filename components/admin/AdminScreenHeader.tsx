import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ADMIN_COLORS } from "@/constants/colors";

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: ReactNode;
};

export default function AdminScreenHeader({
  title,
  subtitle,
  eyebrow = "QR Attendance System",
  showBack = true,
  backTo = "/admin",
  rightAction,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(backTo as any);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={ADMIN_COLORS.white} />
          </Pressable>
        ) : (
          <View style={styles.logoMark}>
            <Ionicons
              name="qr-code-outline"
              size={18}
              color={ADMIN_COLORS.accentSoft}
            />
          </View>
        )}

        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
        <View style={styles.rightSlot}>{rightAction}</View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.headerRaised,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.headerRaised,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  eyebrow: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: ADMIN_COLORS.sidebarMuted,
  },
  rightSlot: {
    minWidth: 36,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: ADMIN_COLORS.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: ADMIN_COLORS.sidebarMuted,
    maxWidth: 360,
  },
});
