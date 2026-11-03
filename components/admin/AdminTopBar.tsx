import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ADMIN_COLORS } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

import InteractivePressable from "./InteractivePressable";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

type Props = {
  isMobile: boolean;
  onMenuPress: () => void;
};

type SearchResult = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

type ProfileSearchRow = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type EventSearchRow = {
  id: string;
  title: string;
  event_code: string;
};

export default function AdminTopBar({ isMobile, onMenuPress }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!searchOpen) return;
    searchAnim.setValue(0);
    const animation = Animated.timing(searchAnim, {
      toValue: 1,
      duration: 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [searchAnim, searchOpen]);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchOpen(false);
      return;
    }

    setSearching(true);
    setSearchOpen(true);
    const safe = trimmed.replace(/[,()%]/g, " ").trim();
    if (!safe) {
      setSearching(false);
      setSearchOpen(false);
      return;
    }
    let nextResults: SearchResult[] = [];

    try {
      const [profilesResult, eventsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(5),
        supabase
          .from("events")
          .select("id, title, event_code")
          .or(`title.ilike.%${safe}%,event_code.ilike.%${safe}%`)
          .limit(5),
      ]);

      ((profilesResult.data ?? []) as ProfileSearchRow[]).forEach((row) => {
        const route =
          row.role === "admin"
            ? "/admin/users"
            : row.role === "teacher"
              ? "/admin/teachers"
              : "/admin/students";
        nextResults.push({
          key: `profile-${row.id}`,
          title: row.full_name?.trim() || row.email,
          subtitle: `${row.role} · ${row.email}`,
          icon:
            row.role === "admin"
              ? "shield-checkmark-outline"
              : row.role === "teacher"
                ? "school-outline"
                : "person-outline",
          route,
        });
      });

      ((eventsResult.data ?? []) as EventSearchRow[]).forEach((row) => {
        nextResults.push({
          key: `event-${row.id}`,
          title: row.title,
          subtitle: `Event · ${row.event_code}`,
          icon: "calendar-outline",
          route: "/admin/events",
        });
      });

      const lower = trimmed.toLowerCase();
      if (lower.includes("attendance") || lower.includes("record")) {
        nextResults.push({
          key: "shortcut-attendance",
          title: "Attendance Records",
          subtitle: "Browse and audit every attendance entry",
          icon: "checkbox-outline",
          route: "/admin/attendance",
        });
      }
    } catch {
      nextResults = [];
    } finally {
      setResults(nextResults);
      setSearching(false);
      setSearchOpen(true);
    }
  };

  const openResult = (result: SearchResult) => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.route as any);
  };

  return (
    <View style={[styles.topBar, { paddingTop: insets.top }]}>
      <View style={styles.topBarRow}>
        <InteractivePressable
          onPress={onMenuPress}
          style={styles.iconButton}
          hoverStyle={styles.iconButtonHover}
          pressedStyle={styles.pressed}
          hoverScale={1.06}
          hoverTranslateY={-1}
          pressScale={0.96}
          accessibilityRole="button"
          accessibilityLabel="Toggle navigation menu"
        >
          <Ionicons name="menu-outline" size={22} color={ADMIN_COLORS.text} />
        </InteractivePressable>

        {isMobile ? (
          <Text style={styles.mobileTitle} numberOfLines={1}>
            Admin Dashboard
          </Text>
        ) : (
          <View style={styles.searchWrap}>
            <View
              style={[
                styles.searchBox,
                searchFocused && styles.searchBoxFocused,
              ]}
            >
              <InteractivePressable
                onPress={runSearch}
                style={styles.searchIcon}
                hoverStyle={styles.searchIconHover}
                hoverScale={1.1}
                pressScale={0.94}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Ionicons
                  name="search-outline"
                  size={17}
                  color={ADMIN_COLORS.textMuted}
                />
              </InteractivePressable>
              <TextInput
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  setSearchOpen(false);
                  setResults([]);
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onSubmitEditing={runSearch}
                placeholder="Search users, events, or records..."
                placeholderTextColor={ADMIN_COLORS.textSoft}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <InteractivePressable
                  onPress={() => {
                    setQuery("");
                    setResults([]);
                    setSearchOpen(false);
                  }}
                  style={styles.clearSearch}
                  hoverStyle={styles.clearSearchHover}
                  hoverScale={1.12}
                  pressScale={0.92}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={ADMIN_COLORS.textSoft}
                  />
                </InteractivePressable>
              ) : null}
            </View>

            {searchOpen ? (
              <Animated.View
                style={[
                  styles.searchResults,
                  {
                    opacity: searchAnim,
                    transform: [
                      {
                        translateY: searchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-6, 0],
                        }),
                      },
                      {
                        scale: searchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {searching ? (
                  <View style={styles.searchState}>
                    <ActivityIndicator
                      size="small"
                      color={ADMIN_COLORS.mintStrong}
                    />
                    <Text style={styles.searchStateText}>Searching…</Text>
                  </View>
                ) : results.length > 0 ? (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    style={styles.resultList}
                    showsVerticalScrollIndicator={false}
                  >
                    {results.map((result) => (
                      <InteractivePressable
                        key={result.key}
                        onPress={() => openResult(result)}
                        style={styles.resultRow}
                        hoverStyle={styles.resultRowHover}
                        pressedStyle={styles.resultRowPressed}
                        hoverScale={1}
                        hoverTranslateX={2}
                        pressScale={0.985}
                      >
                        <View style={styles.resultIcon}>
                          <Ionicons
                            name={result.icon}
                            size={16}
                            color={ADMIN_COLORS.mintStrong}
                          />
                        </View>
                        <View style={styles.resultCopy}>
                          <Text style={styles.resultTitle} numberOfLines={1}>
                            {result.title}
                          </Text>
                          <Text style={styles.resultSubtitle} numberOfLines={1}>
                            {result.subtitle}
                          </Text>
                        </View>
                        <Ionicons
                          name="arrow-forward"
                          size={13}
                          color={ADMIN_COLORS.textSoft}
                        />
                      </InteractivePressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.searchState}>
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color={ADMIN_COLORS.textSoft}
                    />
                    <Text style={styles.searchStateText}>
                      No users or events matched “{query.trim()}”.
                    </Text>
                    <InteractivePressable
                      onPress={() => {
                        setSearchOpen(false);
                        router.push("/admin/attendance");
                      }}
                      style={styles.searchShortcut}
                      hoverStyle={styles.searchShortcutHover}
                      hoverScale={1.03}
                      hoverTranslateX={1}
                      pressScale={0.97}
                    >
                      <Text style={styles.searchShortcutText}>
                        Browse attendance records
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={ADMIN_COLORS.mintStrong}
                      />
                    </InteractivePressable>
                  </View>
                )}
              </Animated.View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: ADMIN_COLORS.background,
    zIndex: 40,
    elevation: 2,
  },
  topBarRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    position: "relative",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  iconButtonHover: {
    backgroundColor: ADMIN_COLORS.mintSoft,
    borderColor: "#CFE4D8",
  },
  pressed: {
    opacity: 0.65,
  },
  mobileTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  searchWrap: {
    flex: 1,
    maxWidth: 520,
    position: "relative",
    zIndex: 30,
  },
  searchBox: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingHorizontal: 5,
  },
  searchBoxFocused: {
    backgroundColor: ADMIN_COLORS.card,
    borderColor: ADMIN_COLORS.mintStrong,
    shadowColor: ADMIN_COLORS.mintStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconHover: {
    backgroundColor: ADMIN_COLORS.mintSoft,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: ADMIN_COLORS.text,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  clearSearch: {
    width: 30,
    height: 32,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchHover: {
    backgroundColor: "#EEF2EE",
  },
  searchResults: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 6,
    shadowColor: ADMIN_COLORS.sidebar,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  resultList: {
    maxHeight: 310,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  resultRowHover: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
  },
  resultRowPressed: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    opacity: 0.84,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.mintSoft,
  },
  resultCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  resultSubtitle: {
    marginTop: 1,
    fontSize: 10.5,
    color: ADMIN_COLORS.textMuted,
  },
  searchState: {
    alignItems: "center",
    gap: 7,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  searchStateText: {
    fontSize: 11.5,
    color: ADMIN_COLORS.textMuted,
    textAlign: "center",
  },
  searchShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: ADMIN_COLORS.mintSoft,
  },
  searchShortcutHover: {
    backgroundColor: "#DDF0E7",
  },
  searchShortcutText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: ADMIN_COLORS.mintStrong,
  },
});
