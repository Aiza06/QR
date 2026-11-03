import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export default function AdminSearchBar({
  value,
  onChangeText,
  placeholder = "Search…",
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color={ADMIN_COLORS.textSoft} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ADMIN_COLORS.textSoft}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={ADMIN_COLORS.textSoft}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 3,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: ADMIN_COLORS.text,
    paddingVertical: 10,
  },
});
