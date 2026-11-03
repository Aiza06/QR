import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import AdminBadge from "@/components/admin/AdminBadge";
import AdminScreenHeader from "@/components/admin/AdminScreenHeader";
import AdminSelect, {
  type AdminSelectOption,
} from "@/components/admin/AdminSelect";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { adminStyles } from "@/components/admin/styles";
import { ADMIN_COLORS } from "@/constants/colors";
import { listEvents, rotateEventQrToken, type AdminEvent } from "@/lib/admin";
import {
  formatDate,
  formatTime,
  getEventStatus,
} from "@/lib/datetime";
import { getEventQrToken } from "@/lib/events";
import { confirmAction } from "@/lib/confirm";
import { buildQRPayload } from "@/lib/qr";

export default function QrCodeManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { width } = useWindowDimensions();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    typeof params.eventId === "string" ? params.eventId : null,
  );
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tokenAttempt, setTokenAttempt] = useState(0);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await listEvents();
      if (result.error) {
        setError(result.error);
      } else {
        setEvents(result.data);
        setSelectedId((current) => {
          if (current && result.data.some((event) => event.id === current)) {
            return current;
          }
          return result.data[0]?.id ?? null;
        });
      }

      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  useEffect(() => {
    let active = true;

    if (!selectedId) {
      setToken(null);
      setTokenError(null);
      return () => {
        active = false;
      };
    }

    setTokenLoading(true);
    setToken(null);
    setTokenError(null);

    getEventQrToken(selectedId)
      .then((result) => {
        if (!active) return;
        if (result.error) setTokenError(result.error);
        else setToken(result.token);
      })
      .catch((caught: any) => {
        if (!active) return;
        setTokenError(caught?.message || "Could not create the QR token.");
      })
      .finally(() => {
        if (active) setTokenLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId, tokenAttempt]);

  const payload = useMemo(() => {
    if (!selectedEvent || !token) return null;
    return buildQRPayload({
      eventId: selectedEvent.event_code,
      title: selectedEvent.title,
      start: selectedEvent.start_time,
      end: selectedEvent.end_time,
      token,
    });
  }, [selectedEvent, token]);

  const eventOptions = useMemo<AdminSelectOption[]>(
    () =>
      events.map((event) => ({
        label: `[${event.event_code}] ${event.title}`,
        value: event.id,
      })),
    [events],
  );

  const handleRotate = () => {
    if (!selectedEvent || rotating) return;

    confirmAction({
      title: "Replace this QR code?",
      message:
        "The current QR code will stop working immediately. Students already inside this event will need the new code to scan.",
      confirmLabel: "Replace QR",
      destructive: true,
      onConfirm: async () => {
        setRotating(true);
        setTokenError(null);
        setNotice(null);

        const result = await rotateEventQrToken(selectedEvent.id);
        if (result.error) {
          setTokenError(result.error);
        } else {
          setToken(result.token);
          setNotice("A new secure QR token was generated.");
        }

        setRotating(false);
      },
    });
  };

  const qrSize = Math.min(232, Math.max(176, width - 132));
  const status = selectedEvent
    ? getEventStatus(selectedEvent.start_time, selectedEvent.end_time)
    : null;
  const statusLabel =
    status === "live" ? "Live" : status === "upcoming" ? "Upcoming" : "Ended";

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="QR Code Management"
        subtitle="Issue a secure, per-event QR code and replace it if it is shared incorrectly."
        eyebrow="Attendance & Events"
      />

      <ScrollView
        contentContainerStyle={adminStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={ADMIN_COLORS.accent}
            colors={[ADMIN_COLORS.accent]}
          />
        }
      >
        {loading ? (
          <View style={styles.topGap}>
            <AdminLoading label="Loading events…" />
          </View>
        ) : error ? (
          <View style={styles.topGap}>
            <AdminError
              title="Could not load events"
              message={error}
              onRetry={() => load()}
            />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.topGap}>
            <AdminEmpty
              title="No events to generate QR codes for"
              message="A teacher needs to create an event first, then return here to issue its secure QR code."
              icon="qr-code-outline"
              actionLabel="Manage Events"
              onAction={() => router.push("/admin/events")}
            />
          </View>
        ) : (
          <>
            <View style={styles.toolbar}>
              <AdminSelect
                label="Event"
                value={selectedId}
                options={eventOptions}
                onSelect={setSelectedId}
              />
            </View>

            {notice ? (
              <View style={styles.notice}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={ADMIN_COLORS.success}
                />
                <Text style={styles.noticeText}>{notice}</Text>
                <Pressable onPress={() => setNotice(null)} hitSlop={10}>
                  <Ionicons
                    name="close"
                    size={15}
                    color={ADMIN_COLORS.success}
                  />
                </Pressable>
              </View>
            ) : null}

            {selectedEvent ? (
              <>
                <View style={styles.eventSummary}>
                  <View style={styles.eventTopRow}>
                    <View style={styles.eventIcon}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={ADMIN_COLORS.accentStrong}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>
                        {selectedEvent.title}
                      </Text>
                      <Text style={styles.eventCode}>
                        {selectedEvent.event_code}
                      </Text>
                    </View>
                    {status ? (
                      <AdminBadge label={statusLabel} tone={status} />
                    ) : null}
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={ADMIN_COLORS.textMuted}
                    />
                    <Text style={styles.metaText}>
                      {formatDate(selectedEvent.start_time)} ·{" "}
                      {formatTime(selectedEvent.start_time)} to{" "}
                      {formatTime(selectedEvent.end_time)}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={ADMIN_COLORS.textMuted}
                    />
                    <Text style={styles.metaText}>
                      {selectedEvent.attendance_count} attendance record
                      {selectedEvent.attendance_count === 1 ? "" : "s"} so far
                    </Text>
                  </View>
                </View>

                {tokenLoading ? (
                  <View style={styles.qrCard}>
                    <ActivityIndicator
                      size="small"
                      color={ADMIN_COLORS.accent}
                    />
                    <Text style={styles.qrLoadingText}>
                      Creating a secure event token…
                    </Text>
                  </View>
                ) : tokenError ? (
                  <AdminError
                    title="QR code unavailable"
                    message={tokenError}
                    onRetry={() => setTokenAttempt((value) => value + 1)}
                  />
                ) : payload ? (
                  <View style={styles.qrCard}>
                    <Text style={styles.qrTitle}>Scan to record attendance</Text>
                    <Text style={styles.qrSubtitle}>
                      Students open the Scan tab and point their camera at this
                      code.
                    </Text>
                    <View style={styles.qrBox}>
                      <QRCode value={payload} size={qrSize} />
                    </View>
                    <View style={styles.tokenStatus}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={14}
                        color={ADMIN_COLORS.success}
                      />
                      <Text style={styles.tokenStatusText}>
                        Secure token active · validated on the server
                      </Text>
                    </View>
                    <Text style={styles.qrHint}>
                      The QR payload contains the event code and a random event
                      token. It contains no passwords, service keys, or personal
                      data.
                    </Text>

                    <Pressable
                      onPress={handleRotate}
                      disabled={rotating}
                      style={({ pressed }) => [
                        styles.rotateButton,
                        pressed && { opacity: 0.7 },
                        rotating && { opacity: 0.6 },
                      ]}
                    >
                      {rotating ? (
                        <ActivityIndicator
                          size="small"
                          color={ADMIN_COLORS.danger}
                        />
                      ) : (
                        <Ionicons
                          name="refresh-outline"
                          size={16}
                          color={ADMIN_COLORS.danger}
                        />
                      )}
                      <Text style={styles.rotateText}>
                        {rotating ? "Replacing…" : "Replace QR Code"}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.securityCard}>
                  <View style={styles.securityIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={ADMIN_COLORS.success}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityTitle}>
                      Server-side validation
                    </Text>
                    <Text style={styles.securityText}>
                      The scanner sends the event code and token to a database
                      function. It verifies the token, event time window, active
                      account, and duplicate attendance before writing a record.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <AdminEmpty
                title="Select an event"
                message="Choose an event above to generate its QR code."
                icon="qr-code-outline"
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topGap: {
    paddingTop: 18,
  },
  toolbar: {
    paddingTop: 16,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ADMIN_COLORS.successSoft,
    borderRadius: 12,
    padding: 11,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: ADMIN_COLORS.success,
  },
  eventSummary: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
    marginTop: 14,
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  eventCode: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: ADMIN_COLORS.accentStrong,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: ADMIN_COLORS.textMuted,
  },
  qrCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 18,
    marginTop: 14,
    alignItems: "center",
  },
  qrLoadingText: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    marginTop: 10,
  },
  qrTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    textAlign: "center",
  },
  qrSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: ADMIN_COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },
  qrBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 16,
    marginTop: 16,
  },
  tokenStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: ADMIN_COLORS.successSoft,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  tokenStatusText: {
    fontSize: 10,
    fontWeight: "700",
    color: ADMIN_COLORS.success,
  },
  qrHint: {
    fontSize: 10,
    lineHeight: 16,
    color: ADMIN_COLORS.textMuted,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 300,
  },
  rotateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.dangerSoft,
    backgroundColor: ADMIN_COLORS.dangerSoft,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  rotateText: {
    fontSize: 11,
    fontWeight: "700",
    color: ADMIN_COLORS.danger,
  },
  securityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
    marginTop: 14,
  },
  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: ADMIN_COLORS.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  securityText: {
    fontSize: 10,
    lineHeight: 16,
    color: ADMIN_COLORS.textMuted,
    marginTop: 3,
  },
});
