import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { ADMIN_COLORS } from "@/constants/colors";
import { formatTime } from "@/lib/datetime";
import type { Profile } from "@/lib/profiles";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

type Props = {
  profile: Profile | null;
  now: Date;
  showArt: boolean;
};

export default function AdminHero({ profile, now, showArt }: Props) {
  const float = useRef(new Animated.Value(0)).current;
  const name = profile?.full_name?.trim() || "Administrator";
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const dateLabel = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = formatTime(now.toISOString());

  useEffect(() => {
    if (!showArt) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, showArt]);

  return (
    <View style={styles.hero}>
      <View pointerEvents="none" style={styles.orbLarge} />
      <View pointerEvents="none" style={styles.orbSmall} />
      <View pointerEvents="none" style={styles.heroLeafOne}>
        <Ionicons name="leaf-outline" size={34} color="#B8D6C1" />
      </View>
      <View pointerEvents="none" style={styles.heroLeafTwo}>
        <Ionicons name="leaf-outline" size={25} color="#C9DFD0" />
      </View>

      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowMark}>
            <Ionicons
              name="qr-code-outline"
              size={13}
              color={ADMIN_COLORS.mintStrong}
            />
          </View>
          <Text style={styles.eyebrow}>QR Attendance System</Text>
        </View>

        <Text style={styles.greeting}>
          {greeting}, <Text style={styles.name}>{name}</Text>
        </Text>
        <Text style={styles.subtitle}>
          Manage your school’s attendance, events, and users all in one place.
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-clear-outline"
              size={13}
              color={ADMIN_COLORS.textMuted}
            />
            <Text style={styles.metaText}>{dateLabel}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={13}
              color={ADMIN_COLORS.textMuted}
            />
            <Text style={styles.metaText}>{timeLabel}</Text>
          </View>
        </View>
      </View>

      {showArt ? (
        <View style={styles.art}>
          <View style={styles.quoteWrap}>
            <Text style={styles.quote}>
              Better{"\n"}attendance.{"\n"}Brighter{"\n"}future.
            </Text>
            <View style={styles.quoteLine} />
          </View>

          <Animated.View
            style={[
              styles.phoneWrap,
              {
                transform: [
                  {
                    translateY: float.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -6],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.phone}>
              <View style={styles.phoneNotch} />
              <View style={styles.phoneScreen}>
                <QRCode
                  value="QR ATTENDANCE SYSTEM"
                  size={76}
                  color="#153B2E"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <View style={styles.phoneBar} />
            </View>
            <View pointerEvents="none" style={styles.phoneLeaf}>
              <Ionicons name="leaf" size={26} color="#88B89A" />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: ADMIN_COLORS.hero,
    borderWidth: 1,
    borderColor: "#E2EFE5",
    paddingHorizontal: 24,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  orbLarge: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(209, 235, 218, 0.55)",
    right: -80,
    top: -140,
  },
  orbSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 18,
    borderColor: "rgba(255, 255, 255, 0.5)",
    right: 220,
    bottom: -90,
  },
  heroLeafOne: {
    position: "absolute",
    right: 300,
    top: 26,
    transform: [{ rotate: "-28deg" }],
    opacity: 0.75,
  },
  heroLeafTwo: {
    position: "absolute",
    right: 250,
    bottom: 22,
    transform: [{ rotate: "38deg" }],
    opacity: 0.6,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 11,
  },
  eyebrowMark: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: ADMIN_COLORS.textMuted,
  },
  greeting: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: ADMIN_COLORS.text,
  },
  name: {
    fontWeight: "800",
    color: "#173D2F",
  },
  subtitle: {
    marginTop: 7,
    maxWidth: 470,
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: ADMIN_COLORS.textMuted,
  },
  metaDivider: {
    width: 1,
    height: 11,
    backgroundColor: "#D3E5D8",
  },
  art: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexShrink: 0,
  },
  quoteWrap: {
    width: 112,
    alignItems: "flex-start",
  },
  quote: {
    fontSize: 16,
    lineHeight: 23,
    fontStyle: "italic",
    fontWeight: "600",
    color: "#18352B",
  },
  quoteLine: {
    width: 34,
    height: 2,
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.accent,
    marginTop: 7,
  },
  phoneWrap: {
    position: "relative",
  },
  phone: {
    width: 112,
    height: 178,
    borderRadius: 22,
    backgroundColor: "#173D2F",
    padding: 5,
    shadowColor: "#173D2F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  phoneNotch: {
    position: "absolute",
    top: 7,
    left: 39,
    width: 34,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    zIndex: 2,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: ADMIN_COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  phoneBar: {
    position: "absolute",
    bottom: 9,
    left: 42,
    width: 28,
    height: 3,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  phoneLeaf: {
    position: "absolute",
    right: -17,
    bottom: 22,
    transform: [{ rotate: "18deg" }],
  },
});
