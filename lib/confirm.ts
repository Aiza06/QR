import { Alert, Platform } from "react-native";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    const globalAny = globalThis as any;
    if (typeof globalAny.alert === "function") {
      globalAny.alert(`${title}\n\n${message}`);
    }
    return;
  }

  Alert.alert(title, message);
}

/**
 * Cross-platform confirmation dialog.
 *
 * React Native Web's Alert implementation is a no-op, so the admin screens
 * use the browser's confirm dialog on web and the native Alert on Android/iOS.
 */
export function confirmAction({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmOptions) {
  if (Platform.OS === "web") {
    const globalAny = globalThis as any;
    const accepted =
      typeof globalAny.confirm === "function"
        ? globalAny.confirm(`${title}\n\n${message}`)
        : false;
    if (accepted) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
