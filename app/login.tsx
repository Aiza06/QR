import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/constants/colors";
import { signIn } from "@/lib/auth";

const webInputReset =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined;

type FocusedField = "email" | "password" | null;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(width * 0.88, 1450);

  const passwordRef = useRef<TextInput>(null);
  const reveal = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  useEffect(() => {
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });

    animation.start();
    return () => animation.stop();
  }, [reveal]);

  const handleLogin = async () => {
    if (loading) return;

    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#E7F8F2", "#FBFEFD", "#E3F6EF"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        style={[styles.blobTopLeft, !isDesktop && styles.blobTopLeftMobile]}
      />
      {isDesktop ? (
        <>
          <View pointerEvents="none" style={styles.blobTopRight} />
          <View pointerEvents="none" style={styles.blobBottomLeft} />
        </>
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.blobBottomRight,
          !isDesktop && styles.blobBottomRightMobile,
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { width: contentWidth },
              {
                opacity: reveal,
                transform: [
                  {
                    translateY: reveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.brandBlock,
                isDesktop ? styles.brandBlockDesktop : styles.brandBlockMobile,
              ]}
            >
              <View
                style={[
                  styles.logoCircle,
                  !isDesktop && styles.logoCircleMobile,
                ]}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={isDesktop ? 44 : 36}
                  color={COLORS.teal}
                />
              </View>
              <Text
                style={[
                  styles.brandTitle,
                  !isDesktop && styles.brandTitleMobile,
                ]}
              >
                QR Attendance
              </Text>
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.title, !isDesktop && styles.titleMobile]}>
                Welcome Back
              </Text>
              <Text
                style={[styles.subtitle, !isDesktop && styles.subtitleMobile]}
              >
                Sign in to record your attendance
              </Text>

              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text
                    style={[styles.label, !isDesktop && styles.labelMobile]}
                  >
                    Email
                  </Text>
                  <View
                    style={[
                      styles.inputWrap,
                      !isDesktop && styles.inputWrapMobile,
                      focusedField === "email" && styles.inputWrapFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={
                        focusedField === "email"
                          ? COLORS.teal
                          : COLORS.textSecondary
                      }
                    />
                    <TextInput
                      style={[styles.input, webInputReset]}
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      placeholder="your.email@school.edu"
                      placeholderTextColor={COLORS.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      keyboardType="email-address"
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[styles.label, !isDesktop && styles.labelMobile]}
                  >
                    Password
                  </Text>
                  <View
                    style={[
                      styles.inputWrap,
                      !isDesktop && styles.inputWrapMobile,
                      focusedField === "password" && styles.inputWrapFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        focusedField === "password"
                          ? COLORS.teal
                          : COLORS.textSecondary
                      }
                    />
                    <TextInput
                      ref={passwordRef}
                      style={[styles.input, webInputReset]}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      onSubmitEditing={handleLogin}
                      placeholder="Enter your password"
                      placeholderTextColor={COLORS.textSecondary}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="current-password"
                      returnKeyType="done"
                      editable={!loading}
                    />
                  </View>
                </View>

                {error ? (
                  <View
                    style={styles.errorRow}
                    accessibilityLiveRegion="polite"
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={17}
                      color={COLORS.danger}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: loading,
                    busy: loading,
                  }}
                  disabled={loading}
                  onPress={handleLogin}
                  onHoverIn={() => setButtonHovered(true)}
                  onHoverOut={() => setButtonHovered(false)}
                  style={({ pressed }) => [
                    styles.signInButton,
                    !isDesktop && styles.signInButtonMobile,
                    buttonHovered && styles.signInButtonHover,
                    pressed && styles.signInButtonPressed,
                    loading && styles.signInButtonDisabled,
                    Platform.OS === "web" && styles.webPointer,
                  ]}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color={COLORS.textOnPrimary}
                      />
                      <Text
                        style={[
                          styles.signInText,
                          !isDesktop && styles.signInTextMobile,
                        ]}
                      >
                        Signing in…
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="log-in-outline"
                        size={isDesktop ? 22 : 20}
                        color={COLORS.textOnPrimary}
                      />
                      <Text
                        style={[
                          styles.signInText,
                          !isDesktop && styles.signInTextMobile,
                        ]}
                      >
                        Sign In
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>
                  Don&apos;t have an account?{" "}
                </Text>
                <Link href="/register" style={styles.signupLink}>
                  Sign Up
                </Link>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EDF9F5",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    maxWidth: 1450,
  },
  blobTopLeft: {
    position: "absolute",
    top: -150,
    left: -150,
    width: 520,
    height: 430,
    borderRadius: 260,
    backgroundColor: "rgba(169, 232, 213, 0.3)",
    transform: [{ rotate: "-16deg" }],
  },
  blobTopLeftMobile: {
    top: -240,
    left: -260,
    width: 650,
    height: 500,
    borderRadius: 325,
  },
  blobTopRight: {
    position: "absolute",
    top: -190,
    right: -160,
    width: 540,
    height: 390,
    borderRadius: 270,
    backgroundColor: "rgba(205, 242, 231, 0.32)",
    transform: [{ rotate: "12deg" }],
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -200,
    left: -160,
    width: 520,
    height: 400,
    borderRadius: 260,
    backgroundColor: "rgba(200, 241, 230, 0.26)",
    transform: [{ rotate: "14deg" }],
  },
  blobBottomRight: {
    position: "absolute",
    bottom: -210,
    right: -150,
    width: 610,
    height: 470,
    borderRadius: 305,
    backgroundColor: "rgba(168, 231, 211, 0.28)",
    transform: [{ rotate: "-12deg" }],
  },
  blobBottomRightMobile: {
    bottom: -260,
    right: -300,
    width: 700,
    height: 520,
    borderRadius: 350,
  },
  brandBlock: {
    alignItems: "center",
  },
  brandBlockDesktop: {
    marginBottom: 110,
  },
  brandBlockMobile: {
    marginBottom: 44,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 3,
  },
  logoCircleMobile: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  brandTitle: {
    marginTop: 16,
    color: COLORS.textPrimary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  brandTitleMobile: {
    marginTop: 12,
    fontSize: 27,
    lineHeight: 34,
  },
  formBlock: {
    width: "100%",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 35,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  subtitleMobile: {
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 5,
    marginBottom: 22,
  },
  form: {
    width: "100%",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  labelMobile: {
    fontSize: 14,
    marginBottom: 7,
  },
  inputWrap: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  inputWrapMobile: {
    minHeight: 54,
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  inputWrapFocused: {
    borderColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2D3D7",
    backgroundColor: "#FBEAEC",
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  signInButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
    borderRadius: 18,
    backgroundColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 4,
  },
  signInButtonMobile: {
    minHeight: 56,
    borderRadius: 16,
  },
  signInButtonHover: {
    backgroundColor: COLORS.tealDark,
  },
  signInButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  signInButtonDisabled: {
    opacity: 0.68,
  },
  signInText: {
    color: COLORS.textOnPrimary,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  signInTextMobile: {
    fontSize: 16,
  },
  signupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 36,
  },
  signupText: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "600",
  },
  signupLink: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "800",
  },
  webPointer: {
    cursor: "pointer",
  },
});
