import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import AppButton from "@/components/AppButton";
import ScreenBackground from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { registerAttendance } from "@/lib/attendance";
import { useAuth } from "@/lib/auth";
import { ensureProfile } from "@/lib/profiles";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingData, setPendingData] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!pendingData || !user) return;
    const data = pendingData;
    setPendingData(null);
    ensureProfile(user).catch(() => {});
    registerAttendance(data, user.id).then((result) => {
      setMessage(result.message);
      setSuccess(result.success);
      setDetails(result.details ?? null);
    });
  }, [pendingData, user]);

  if (!permission) {
    return (
      <ScreenBackground>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </ScreenBackground>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenBackground>
        <View style={styles.centerWrap}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Ionicons name="camera-outline" size={28} color={COLORS.teal} />
            </View>
            <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
            <Text style={styles.permissionSubtitle}>
              We need access to your camera to scan QR codes.
            </Text>
            <AppButton
              theme="primary"
              title="Grant Permission"
              icon="camera"
              onPress={requestPermission}
            />
          </View>
        </View>
      </ScreenBackground>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setLastData(data);
    setMessage(null);
    setDetails(null);
    if (!user) {
      setMessage("Still signing in... try scanning again.");
    }
    setPendingData(data);
  };
  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setDetails(null);
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {!scanned ? (
        <View pointerEvents="none" style={styles.frameWrap}>
          <View style={styles.scanFrame} />
        </View>
      ) : null}

      <View style={styles.overlay}>
        <View style={styles.overlayCard}>
          <View style={styles.overlayTitleRow}>
            <Ionicons
              name={scanned ? "checkmark-circle" : "qr-code-outline"}
              size={20}
              color={COLORS.teal}
            />
            <Text style={styles.overlayText}>
              {scanned ? "QR Code detected!" : "Point your camera at a QR code"}
            </Text>
          </View>

          {scanned && !message ? (
            <ActivityIndicator
              size="small"
              color={COLORS.teal}
              style={styles.scanning}
            />
          ) : null}

          {scanned && message ? (
            <Text
              style={[
                styles.scanResult,
                success ? styles.success : styles.error,
              ]}
            >
              {message}
            </Text>
          ) : null}

          {scanned && details ? (
            <Text style={styles.scanDetails}>{details}</Text>
          ) : null}

          {scanned && lastData ? (
            <Text style={styles.scanData}>{lastData}</Text>
          ) : null}

          {scanned ? (
            <AppButton
              theme="primary"
              title="Scan Again"
              icon="refresh"
              onPress={handleScanAgain}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  permissionCard: {
    width: "100%",
    maxWidth: 520,
    alignItems: "center",
    padding: 26,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  permissionSubtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  camera: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  frameWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 230,
    height: 230,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  overlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    alignItems: "center",
  },
  overlayCard: {
    width: "100%",
    maxWidth: 640,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  overlayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  overlayText: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  scanning: {
    marginVertical: 8,
  },
  scanResult: {
    marginBottom: 8,
    fontSize: 14.5,
    fontWeight: "700",
    textAlign: "center",
  },
  success: {
    color: COLORS.success,
  },
  error: {
    color: COLORS.danger,
  },
  scanDetails: {
    marginBottom: 6,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  scanData: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F7FBF9",
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
