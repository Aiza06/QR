import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ADMIN_COLORS } from "@/constants/colors";

import { adminStyles } from "./styles";

export type AdminSelectOption = {
  label: string;
  value: string;
  hint?: string;
};

type Props = {
  label: string;
  value: string | null;
  options: AdminSelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function AdminSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <Text style={adminStyles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          pressed && styles.fieldPressed,
          disabled && { opacity: 0.55 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
      >
        <Text
          style={[styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={17}
          color={ADMIN_COLORS.textMuted}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={ADMIN_COLORS.textMuted}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                    onPress={() => {
                      onSelect(option.value);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.optionCopy}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.hint ? (
                        <Text style={styles.optionHint}>{option.hint}</Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={19}
                        color={ADMIN_COLORS.accentStrong}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

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
    gap: 8,
  },
  fieldPressed: {
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: ADMIN_COLORS.text,
  },
  placeholder: {
    color: ADMIN_COLORS.textSoft,
  },
  overlay: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: ADMIN_COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 18,
    maxHeight: "72%",
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.borderStrong,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  list: {
    marginTop: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: ADMIN_COLORS.card,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: ADMIN_COLORS.accent,
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  optionPressed: {
    opacity: 0.75,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  optionLabelSelected: {
    fontWeight: "800",
  },
  optionHint: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
});
