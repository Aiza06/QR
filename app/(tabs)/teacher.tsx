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
import { COLORS } from "@/constants/colors";
import { useAuth } from "@/lib/auth";
import { createEvent } from "@/lib/events";
import { getProfile, type Role } from "@/lib/profiles";
import { buildQRPayload } from "@/lib/qr";

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.checkingText}>Checking your account...</Text>
      </View>
    );
  }

  if (role !== "teacher") {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={40}
          color={COLORS.textSecondary}
        />
        <Text style={styles.lockTitle}>Teachers Only</Text>
        <Text style={styles.lockSubtitle}>
          Only teacher accounts can create events.
        </Text>
      </View>
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
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    if (!event.eventId || !event.title) {
      setMessage("Event title and code are required.");
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage("End time must be after start time.");
      return;
    }

    createEvent(event, user?.id).then(({ error }) => {
      if (error) {
        setMessage("Could not save the event. Please try again.");
        return;
      }
      setMessage("Event saved! Scan the QR with the Scan tab to test it.");
      setPayload(buildQRPayload(event));
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create Event QR</Text>
      <Text style={styles.subtitle}>
        Fill in the event details, then scan the generated QR with the Scan tab.
      </Text>

      <Text style={styles.label}>Event Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Founders Day Assembly"
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>Event Code</Text>
      <TextInput
        style={styles.input}
        value={eventId}
        onChangeText={setEventId}
        placeholder="e.g. EVT-2026-0002"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Starts</Text>
      {renderDateTimeField("start")}

      <Text style={styles.label}>Ends</Text>
      {renderDateTimeField("end")}
      <View style={styles.chipRow}>
        {QUICK_END_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={styles.chip}
            onPress={() => handleQuickEnd(option.ms)}
          >
            <Text style={styles.chipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>
        Tap a chip to set the end time from start.
      </Text>

      {message && <Text style={styles.message}>{message}</Text>}

      <AppButton
        theme="primary"
        title="Create Event"
        icon="add-circle-outline"
        onPress={handleCreateEvent}
      />

      {editTarget && Platform.OS !== "web" && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={editTarget === "start" ? startDate : endDate}
            mode={isAndroid ? editingPart : "datetime"}
            display={isAndroid ? "default" : "spinner"}
            onChange={onPickerChange}
          />
        </View>
      )}

      {payload && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            Scan this QR code with the Scan tab:
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={payload} size={200} />
          </View>
          <Text style={styles.payloadText}>{payload}</Text>
        </View>
      )}
    </ScrollView>
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
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} />
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
      <Ionicons name={icon} size={20} color={COLORS.primary} />
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
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  checkingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  lockSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerField: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  pickerFieldPressed: {
    backgroundColor: COLORS.surface,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },
  chipRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  pickerContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  message: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 20,
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  payloadText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
});
