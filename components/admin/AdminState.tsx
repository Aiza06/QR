import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import InteractivePressable from "./InteractivePressable";
import { adminStyles } from "./styles";

type LoadingProps = { label?: string; compact?: boolean };

export function AdminLoading({ label = "Loading…", compact }: LoadingProps) {
  return (
    <View style={[styles.state, compact && styles.compact]}>
      <ActivityIndicator size="small" color={ADMIN_COLORS.accent} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

type ErrorProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function AdminError({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorProps) {
  return (
    <View style={styles.state}>
      <View style={[styles.iconWrap, styles.errorIcon]}>
        <Ionicons
          name="alert-circle-outline"
          size={24}
          color={ADMIN_COLORS.danger}
        />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry ? (
        <InteractivePressable
          onPress={onRetry}
          style={[
            adminStyles.button,
            adminStyles.buttonSecondary,
            styles.action,
          ]}
          hoverStyle={styles.buttonSecondaryHover}
          pressedStyle={styles.buttonPressed}
          hoverScale={1.03}
          hoverTranslateY={-1}
          pressScale={0.97}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={ADMIN_COLORS.text}
          />
          <Text style={adminStyles.buttonSecondaryText}>Try again</Text>
        </InteractivePressable>
      ) : null}
    </View>
  );
}

type EmptyProps = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function AdminEmpty({
  title,
  message,
  icon = "file-tray-outline",
  actionLabel,
  onAction,
}: EmptyProps) {
  return (
    <View style={styles.state}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={ADMIN_COLORS.accentStrong} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
      {actionLabel && onAction ? (
        <InteractivePressable
          onPress={onAction}
          style={[adminStyles.button, adminStyles.buttonPrimary, styles.action]}
          hoverStyle={styles.buttonPrimaryHover}
          pressedStyle={styles.buttonPressed}
          hoverScale={1.03}
          hoverTranslateY={-1}
          pressScale={0.97}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Ionicons name="add" size={17} color={ADMIN_COLORS.white} />
          <Text style={adminStyles.buttonPrimaryText}>{actionLabel}</Text>
        </InteractivePressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  compact: {
    paddingVertical: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  errorIcon: {
    backgroundColor: ADMIN_COLORS.dangerSoft,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    textAlign: "center",
    marginBottom: 5,
  },
  stateText: {
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
  action: {
    marginTop: 14,
    paddingHorizontal: 18,
  },
  buttonPrimaryHover: {
    backgroundColor: ADMIN_COLORS.headerRaised,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonSecondaryHover: {
    backgroundColor: ADMIN_COLORS.mintSoft,
    borderColor: "#CFE4D8",
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
