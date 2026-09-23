import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import Header from "@/components/Header";
import { COLORS } from "@/constants/colors";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Header title="QR Attendance" />
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.mainTitle}>School Event Attendance</Text>
        <Text style={styles.subtitle}>
          Scan QR Codes to record attendance during school activities.
        </Text>
      </View>

      <View style={styles.footerContainer}>
        <AppButton
          theme="primary"
          title="Scan QR Code"
          icon="qr-code-outline"
          onPress={() => router.push("/scan")}
        />
        <AppButton
          title="Attendance History"
          icon="time-outline"
          onPress={() => router.push("/history")}
        />
        <AppButton
          title="Profile"
          icon="person-outline"
          onPress={() => router.push("/profile")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 150,
  },
  bodyContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 21,
    textAlign: "center",
  },
  footerContainer: {
    paddingHorizontal: 24,
    width: "100%",
    gap: 1,
  },
});
