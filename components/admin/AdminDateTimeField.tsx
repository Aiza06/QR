import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";
import {
  formatDateInput,
  formatDateTimeInput,
  parseDateInputValue,
  toInputDateValue,
  toInputDateTimeValue,
} from "@/lib/datetime";

import { adminStyles } from "./styles";

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "datetime";
  minimumDate?: Date;
  error?: string | null;
  hint?: string;
};

export default function AdminDateTimeField({
  label,
  value,
  onChange,
  mode = "datetime",
  minimumDate,
  error,
  hint,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [androidPart, setAndroidPart] = useState<"date" | "time">("date");

  const displayValue =
    mode === "date" ? formatDateInput(value) : formatDateTimeInput(value);

  const openPicker = () => {
    setAndroidPart("date");
    setShowPicker(true);
  };

  const handleNativeChange = (
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (event.type === "dismissed" || !selected) {
      setShowPicker(false);
      setAndroidPart("date");
      return;
    }

    if (Platform.OS === "android" && mode === "datetime") {
      if (androidPart === "date") {
        const next = new Date(value);
        next.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
        );
        onChange(next);
        setAndroidPart("time");
        return;
      }

      const next = new Date(value);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(next);
      setShowPicker(false);
      setAndroidPart("date");
      return;
    }

    const next = new Date(selected);
    if (mode === "date") next.setHours(0, 0, 0, 0);
    onChange(next);
    setShowPicker(false);
  };

  return (
    <View>
      <Text style={adminStyles.label}>{label}</Text>

      {Platform.OS === "web" ? (
        <View
          style={[styles.field, error ? styles.fieldError : null]}
        >
          <Ionicons
            name={mode === "date" ? "calendar-outline" : "time-outline"}
            size={18}
            color={ADMIN_COLORS.accentStrong}
          />
          <input
            type={mode === "date" ? "date" : "datetime-local"}
            value={
              mode === "date"
                ? toInputDateValue(value)
                : toInputDateTimeValue(value)
            }
            min={
              minimumDate
                ? mode === "date"
                  ? toInputDateValue(minimumDate)
                  : toInputDateTimeValue(minimumDate)
                : undefined
            }
            onChange={(event) => {
              const next =
                mode === "date"
                  ? parseDateInputValue(event.target.value)
                  : new Date(event.target.value);
              if (next && !Number.isNaN(next.getTime())) onChange(next);
            }}
            style={webInputStyle}
          />
        </View>
      ) : (
        <Pressable
          onPress={openPicker}
          style={({ pressed }) => [
            styles.field,
            error ? styles.fieldError : null,
            pressed && styles.fieldPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${displayValue}`}
        >
          <Ionicons
            name={mode === "date" ? "calendar-outline" : "time-outline"}
            size={18}
            color={ADMIN_COLORS.accentStrong}
          />
          <Text style={styles.value}>{displayValue}</Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={ADMIN_COLORS.textMuted}
          />
        </Pressable>
      )}

      {showPicker && Platform.OS !== "web" ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value}
            mode={
              Platform.OS === "android" && mode === "datetime"
                ? androidPart
                : mode
            }
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={minimumDate}
            onChange={handleNativeChange}
          />
        </View>
      ) : null}

      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const webInputStyle: any = {
  flex: 1,
  marginLeft: 10,
  fontSize: 15,
  color: ADMIN_COLORS.text,
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  fontFamily: "inherit",
};

const styles = StyleSheet.create({
  field: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  fieldPressed: {
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  fieldError: {
    borderColor: ADMIN_COLORS.danger,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: ADMIN_COLORS.text,
  },
  pickerWrap: {
    marginTop: 8,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    overflow: "hidden",
  },
  hint: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 5,
  },
  error: {
    fontSize: 11,
    color: ADMIN_COLORS.danger,
    marginTop: 5,
  },
});
