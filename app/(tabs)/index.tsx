import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Header from "@/components/Header";
import ScreenBackground from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profiles";

type ActionCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

function ActionCard({
  title,
  icon,
  onPress,
  variant = "secondary",
}: ActionCardProps) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.actionCard,
        isPrimary ? styles.actionCardPrimary : styles.actionCardSecondary,
        hovered &&
          (isPrimary
            ? styles.actionCardPrimaryHover
            : styles.actionCardSecondaryHover),
        pressed && styles.actionCardPressed,
        Platform.OS === "web" && styles.webPointer,
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          isPrimary ? styles.actionIconPrimary : styles.actionIconSecondary,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={isPrimary ? COLORS.textOnPrimary : COLORS.teal}
        />
      </View>
      <Text
        style={[styles.actionTitle, isPrimary && styles.actionTitlePrimary]}
      >
        {title}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isPrimary ? "rgba(255, 255, 255, 0.78)" : COLORS.textSecondary}
      />
    </Pressable>
  );
}

export default function Index() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setIsAdmin(false);
        return () => {
          active = false;
        };
      }

      getProfile(user)
        .then((profile) => {
          if (active) setIsAdmin(profile.role === "admin");
        })
        .catch(() => {
          if (active) setIsAdmin(false);
        });

      return () => {
        active = false;
      };
    }, [user]),
  );

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Header title="QR Attendance" />

          <View style={styles.hero}>
            <Text style={styles.mainTitle}>School Event Attendance</Text>
            <Text style={styles.subtitle}>
              Scan QR Codes to record attendance during school activities.
            </Text>
          </View>

          <View style={styles.actions}>
            <ActionCard
              variant="primary"
              title="Scan QR Code"
              icon="qr-code-outline"
              onPress={() => router.push("/scan")}
            />
            <ActionCard
              title="Attendance History"
              icon="time-outline"
              onPress={() => router.push("/history")}
            />
            <ActionCard
              title="Profile"
              icon="person-outline"
              onPress={() => router.push("/profile")}
            />
            {isAdmin ? (
              <ActionCard
                title="Admin Dashboard"
                icon="shield-checkmark-outline"
                onPress={() => router.push("/admin")}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  content: {
    width: "100%",
    maxWidth: 620,
  },
  hero: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: 28,
  },
  mainTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 500,
    marginTop: 8,
    fontSize: 15.5,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  actionCard: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  actionCardPrimary: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  actionCardSecondary: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.tealBorder,
  },
  actionCardPrimaryHover: {
    backgroundColor: COLORS.tealDark,
    borderColor: COLORS.tealDark,
  },
  actionCardSecondaryHover: {
    borderColor: COLORS.teal,
    backgroundColor: "#F8FCFA",
  },
  actionCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  actionIconSecondary: {
    backgroundColor: COLORS.tealSoft,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  actionTitlePrimary: {
    color: COLORS.textOnPrimary,
  },
  webPointer: {
    cursor: "pointer",
  },
});
