import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import AppButton from "@/components/AppButton";
import ScreenBackground from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/lib/auth";
import { createEvent, getEventQrToken } from "@/lib/events";
import { getProfile, type Role } from "@/lib/profiles";
import { buildQRPayload } from "@/lib/qr";

const webInputReset =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined;

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toInputDateTimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const QUICK_END_OPTIONS = [
  { label: "+30 min", ms: 30 * 60 * 1000 },
  { label: "+1 hour", ms: 60 * 60 * 1000 },
  { label: "+2 hours", ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = "start" | "end";
type FocusedField = "title" | "eventId" | null;

export default function TeacherScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<"date" | "time">("date");
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const isAndroid = Platform.OS === "android";

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }
      getProfile(user).then((profile) => {
        if (!active) return;
        setRole(profile?.role ?? "student");
        setRoleLoading(false);
      });
      return () => {
        active = false;
      };
    }, [user]),
  );

  if (roleLoading) {
    return (
      <ScreenBackground>
        <View style={styles.centerContainer}>
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={COLORS.teal} />
            <Text style={styles.checkingText}>Checking your account...</Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  if (role !== "teacher") {
    return (
      <ScreenBackground>
        <View style={styles.centerContainer}>
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={28}
                color={COLORS.teal}
              />
            </View>
            <Text style={styles.lockTitle}>Teachers Only</Text>
            <Text style={styles.lockSubtitle}>
              Only teacher accounts can create events.
            </Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart("date");
  };

  const renderDateTimeField = (target: EditTarget) => {
    const value = target === "start" ? startDate : endDate;
    const icon = target === "start" ? "sunny-outline" : "moon-outline";
    const handleChange = (next: Date) => {
      setMessage(null);
      if (target === "start") setStartDate(next);
      else setEndDate(next);
    };

    if (Platform.OS === "web") {
      return (
        <WebDateTimeField value={value} icon={icon} onChange={handleChange} />
      );
    }

    return (
      <PickerField
        value={formatDateTime(value)}
        icon={icon}
        onPress={() => openPicker(target)}
      />
    );
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!editTarget) return;
    if (event.type === "dismissed" || !selected) {
      setEditTarget(null);
      setEditingPart("date");
      return;
    }

    const current = editTarget === "start" ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
    );
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === "start") setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === "date") {
      setEditingPart("time");
    } else {
      setEditTarget(null);
      setEditingPart("date");
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleCreateEvent = () => {
    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    if (!event.eventId || !event.title) {
      setMessage("Event title and code are required.");
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage("End time must be after start time.");
      return;
    }

    createEvent(event, user?.id).then(async ({ data: savedEvent, error }) => {
      if (error || !savedEvent) {
        setMessage("Could not save the event. Please try again.");
        return;
      }

      const { token } = await getEventQrToken(savedEvent.id);
      setMessage(
        token
          ? "Event saved! Scan the QR with the Scan tab to test it."
          : "Event saved, but its secure QR token could not be created. Run the admin setup SQL, then try again.",
      );
      setPayload(
        buildQRPayload({
          ...event,
          title: savedEvent.title,
          start: savedEvent.start_time,
          end: savedEvent.end_time,
          token,
        }),
      );
    });
  };

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.title}>Create Event QR</Text>
            <Text style={styles.subtitle}>
              Fill in the event details, then scan the generated QR with the
              Scan tab.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Event Title</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "title" && styles.inputFocused,
                  webInputReset,
                ]}
                value={title}
                onChangeText={setTitle}
                onFocus={() => setFocusedField("title")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Founders Day Assembly"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Event Code</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === "eventId" && styles.inputFocused,
                  webInputReset,
                ]}
                value={eventId}
                onChangeText={setEventId}
                onFocus={() => setFocusedField("eventId")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. EVT-2026-0002"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Starts</Text>
              {renderDateTimeField("start")}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ends</Text>
              {renderDateTimeField("end")}
            </View>

            <View style={styles.chipRow}>
              {QUICK_END_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => handleQuickEnd(option.ms)}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && styles.chipPressed,
                    Platform.OS === "web" && styles.webPointer,
                  ]}
                >
                  <Text style={styles.chipText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>
              Tap a chip to set the end time from start.
            </Text>

            {message ? (
              <View style={styles.messageBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color={COLORS.teal}
                />
                <Text style={styles.message}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.submit}>
              <AppButton
                theme="primary"
                title="Create Event"
                icon="add-circle-outline"
                onPress={handleCreateEvent}
              />
            </View>
          </View>

          {editTarget && Platform.OS !== "web" ? (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={editTarget === "start" ? startDate : endDate}
                mode={isAndroid ? editingPart : "datetime"}
                display={isAndroid ? "default" : "spinner"}
                onChange={onPickerChange}
              />
            </View>
          ) : null}

          {payload ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                Scan this QR code with the Scan tab:
              </Text>
              <View style={styles.qrBox}>
                <QRCode value={payload} size={200} />
              </View>
              <Text style={styles.payloadText} selectable>
                {payload}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pickerField,
        pressed && styles.pickerFieldPressed,
        Platform.OS === "web" && styles.webPointer,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={COLORS.teal} />
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons
        name="calendar-outline"
        size={18}
        color={COLORS.textSecondary}
      />
    </Pressable>
  );
}

type WebDateTimeFieldProps = {
  value: Date;
  icon: keyof typeof Ionicons.glyphMap;
  onChange: (date: Date) => void;
};

function WebDateTimeField({ value, icon, onChange }: WebDateTimeFieldProps) {
  return (
    <View style={styles.pickerField}>
      <Ionicons name={icon} size={20} color={COLORS.teal} />
      <input
        type="datetime-local"
        value={toInputDateTimeValue(value)}
        onChange={(event) => {
          const next = new Date(event.target.value);
          if (!Number.isNaN(next.getTime())) onChange(next);
        }}
        onClick={(event) => {
          try {
            event.currentTarget.showPicker();
          } catch {
            // Fall back to the browser's native datetime-local input behavior.
          }
        }}
        style={webInputStyle}
      />
    </View>
  );
}

const webInputStyle = {
  flex: 1,
  minWidth: 0,
  marginLeft: 10,
  marginRight: 10,
  fontSize: 15,
  fontWeight: 500,
  color: COLORS.textPrimary,
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  fontFamily: "inherit",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  stateCard: {
    width: "100%",
    maxWidth: 520,
    alignItems: "center",
    padding: 28,
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
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
    marginBottom: 16,
  },
  checkingText: {
    marginTop: 12,
    fontSize: 14.5,
    color: COLORS.textSecondary,
  },
  lockTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  lockSubtitle: {
    marginTop: 6,
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
  },
  content: {
    width: "100%",
    maxWidth: 760,
  },
  intro: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: "#F7FBF9",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputFocused: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  pickerField: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: "#F7FBF9",
    flexDirection: "row",
    alignItems: "center",
  },
  pickerFieldPressed: {
    backgroundColor: COLORS.tealSoft,
  },
  pickerValue: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.tealSoft,
  },
  chipPressed: {
    backgroundColor: "#CDEEE2",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.teal,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: "#F7FBF9",
  },
  message: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textPrimary,
  },
  submit: {
    marginTop: 2,
  },
  pickerContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  resultCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  resultTitle: {
    marginBottom: 14,
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  qrBox: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
  },
  payloadText: {
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F7FBF9",
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  webPointer: {
    cursor: "pointer",
  },
});
