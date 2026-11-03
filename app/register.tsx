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
import { signUp } from "@/lib/auth";

const webInputReset =
  Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined;

type FocusedField =
  "fullName" | "email" | "password" | "confirmPassword" | null;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const contentWidth = Math.min(width * 0.88, 1450);

  const reveal = useRef(new Animated.Value(0)).current;
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const handleRegister = async () => {
    if (loading) return;

    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(email.trim(), password, {
        full_name: fullName.trim(),
        role,
      });

      if (authError) {
        setError(authError.message);
      } else if (!data.session) {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
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
              paddingTop: insets.top + (isDesktop ? 28 : 20),
              paddingBottom: insets.bottom + 28,
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
                  size={isDesktop ? 38 : 34}
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

            {success ? (
              <View style={styles.successBlock}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="mail-unread-outline"
                    size={28}
                    color={COLORS.teal}
                  />
                </View>
                <Text style={styles.successTitle}>Check your email!</Text>
                <Text style={styles.successText}>
                  We sent a confirmation link to {email}. Click the link to
                  verify your account, then come back and sign in.
                </Text>
                <Link href="/login" style={styles.successLink}>
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <View style={styles.formBlock}>
                <Text style={[styles.title, !isDesktop && styles.titleMobile]}>
                  Create Account
                </Text>
                <Text
                  style={[styles.subtitle, !isDesktop && styles.subtitleMobile]}
                >
                  Register to start recording attendance
                </Text>

                <View style={styles.form}>
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[styles.label, !isDesktop && styles.labelMobile]}
                    >
                      Full Name
                    </Text>
                    <View
                      style={[
                        styles.inputWrap,
                        !isDesktop && styles.inputWrapMobile,
                        focusedField === "fullName" && styles.inputWrapFocused,
                      ]}
                    >
                      <TextInput
                        style={[styles.input, webInputReset]}
                        value={fullName}
                        onChangeText={(value) => {
                          setFullName(value);
                          if (error) setError(null);
                        }}
                        onFocus={() => setFocusedField("fullName")}
                        onBlur={() => setFocusedField(null)}
                        onSubmitEditing={() => emailRef.current?.focus()}
                        placeholder="Enter your full name"
                        placeholderTextColor={COLORS.textSecondary}
                        autoComplete="name"
                        returnKeyType="next"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text
                      style={[styles.label, !isDesktop && styles.labelMobile]}
                    >
                      I am a...
                    </Text>
                    <View style={styles.roleRow}>
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: role === "student",
                          disabled: loading,
                        }}
                        disabled={loading}
                        onPress={() => setRole("student")}
                        style={({ pressed }) => [
                          styles.roleChip,
                          !isDesktop && styles.roleChipMobile,
                          role === "student" && styles.roleChipActive,
                          pressed && styles.roleChipPressed,
                          Platform.OS === "web" && styles.webPointer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleChipText,
                            !isDesktop && styles.roleChipTextMobile,
                            role === "student" && styles.roleChipTextActive,
                          ]}
                        >
                          Student
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: role === "teacher",
                          disabled: loading,
                        }}
                        disabled={loading}
                        onPress={() => setRole("teacher")}
                        style={({ pressed }) => [
                          styles.roleChip,
                          !isDesktop && styles.roleChipMobile,
                          role === "teacher" && styles.roleChipActive,
                          pressed && styles.roleChipPressed,
                          Platform.OS === "web" && styles.webPointer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleChipText,
                            !isDesktop && styles.roleChipTextMobile,
                            role === "teacher" && styles.roleChipTextActive,
                          ]}
                        >
                          Teacher
                        </Text>
                      </Pressable>
                    </View>
                  </View>

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
                      <TextInput
                        ref={emailRef}
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
                        onSubmitEditing={() => confirmRef.current?.focus()}
                        placeholder="At least 6 characters"
                        placeholderTextColor={COLORS.textSecondary}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        returnKeyType="next"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text
                      style={[styles.label, !isDesktop && styles.labelMobile]}
                    >
                      Confirm Password
                    </Text>
                    <View
                      style={[
                        styles.inputWrap,
                        !isDesktop && styles.inputWrapMobile,
                        focusedField === "confirmPassword" &&
                          styles.inputWrapFocused,
                      ]}
                    >
                      <TextInput
                        ref={confirmRef}
                        style={[styles.input, webInputReset]}
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          if (error) setError(null);
                        }}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        onSubmitEditing={handleRegister}
                        placeholder="Re-enter your password"
                        placeholderTextColor={COLORS.textSecondary}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
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
                    onPress={handleRegister}
                    onHoverIn={() => setButtonHovered(true)}
                    onHoverOut={() => setButtonHovered(false)}
                    style={({ pressed }) => [
                      styles.signUpButton,
                      !isDesktop && styles.signUpButtonMobile,
                      buttonHovered && styles.signUpButtonHover,
                      pressed && styles.signUpButtonPressed,
                      loading && styles.signUpButtonDisabled,
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
                            styles.signUpText,
                            !isDesktop && styles.signUpTextMobile,
                          ]}
                        >
                          Signing up…
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
                            styles.signUpText,
                            !isDesktop && styles.signUpTextMobile,
                          ]}
                        >
                          Sign Up
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <View style={styles.loginRow}>
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                  </Text>
                  <Link href="/login" style={styles.loginLink}>
                    Sign In
                  </Link>
                </View>
              </View>
            )}
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
    marginBottom: 52,
  },
  brandBlockMobile: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
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
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  brandTitle: {
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  brandTitleMobile: {
    marginTop: 11,
    fontSize: 26,
    lineHeight: 33,
  },
  formBlock: {
    width: "100%",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 38,
    lineHeight: 47,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  titleMobile: {
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 3,
    marginBottom: 26,
  },
  subtitleMobile: {
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 4,
    marginBottom: 20,
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
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 14,
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
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  roleRow: {
    flexDirection: "row",
    gap: 16,
  },
  roleChip: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
  },
  roleChipMobile: {
    minHeight: 52,
    borderRadius: 12,
  },
  roleChipActive: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.tealSoft,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.08,
  },
  roleChipPressed: {
    opacity: 0.9,
  },
  roleChipText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  roleChipTextMobile: {
    fontSize: 14.5,
  },
  roleChipTextActive: {
    color: COLORS.teal,
    fontWeight: "800",
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
  signUpButton: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 4,
  },
  signUpButtonMobile: {
    minHeight: 54,
    borderRadius: 12,
  },
  signUpButtonHover: {
    backgroundColor: COLORS.tealDark,
  },
  signUpButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  signUpButtonDisabled: {
    opacity: 0.68,
  },
  signUpText: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  signUpTextMobile: {
    fontSize: 16,
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 24,
  },
  loginText: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "600",
  },
  loginLink: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "800",
  },
  successBlock: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    alignItems: "center",
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  successIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
    marginBottom: 18,
  },
  successTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "800",
    textAlign: "center",
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  successLink: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "800",
  },
  webPointer: {
    cursor: "pointer",
  },
});
