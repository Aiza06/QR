import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

import { adminStyles } from "./styles";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

export default function AdminField({
  label,
  error,
  hint,
  style,
  multiline,
  ...props
}: Props) {
  return (
    <View>
      <Text style={adminStyles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[
          adminStyles.input,
          multiline && adminStyles.inputMultiline,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={ADMIN_COLORS.textSoft}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputError: {
    borderColor: ADMIN_COLORS.danger,
  },
  hint: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },
  error: {
    fontSize: 11,
    color: ADMIN_COLORS.danger,
    marginTop: 5,
  },
});
