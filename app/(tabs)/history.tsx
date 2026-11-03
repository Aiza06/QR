import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ScreenBackground from "@/components/ScreenBackground";
import { COLORS } from "@/constants/colors";
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from "@/lib/attendance";
import { useAuth } from "@/lib/auth";
import { getProfile, type Role } from "@/lib/profiles";

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
};

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={COLORS.teal} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>(
    [],
  );

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const profile = await getProfile(user);
    const currentRole = profile?.role ?? "student";
    setRole(currentRole);

    if (currentRole === "teacher") {
      const events = await getTeacherEventAttendance(user.id);
      setTeacherEvents(events);
      setStudentRecords([]);
    } else {
      const records = await getAttendanceHistory(user.id);
      setStudentRecords(records);
      setTeacherEvents([]);
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <ScreenBackground>
        <View style={styles.page}>
          <Text style={styles.title}>Attendance History</Text>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.teal} />
            <Text style={styles.loadingText}>Loading records...</Text>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  const isTeacher = role === "teacher";

  return (
    <ScreenBackground>
      <View style={styles.page}>
        <Text style={styles.title}>Attendance History</Text>

        {isTeacher ? (
          teacherEvents.length === 0 ? (
            <EmptyState
              icon="people-outline"
              message="No events yet. Create an event from the Teacher tab."
            />
          ) : (
            <FlatList
              data={teacherEvents}
              keyExtractor={(item) => item.eventId}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name="people-outline"
                        size={21}
                        color={COLORS.teal}
                      />
                    </View>
                    <View style={styles.eventHeaderBody}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons
                          name="pricetag-outline"
                          size={13}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.metaText}>{item.eventCode}</Text>
                      </View>
                      {item.startTime ? (
                        <View style={styles.metaRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color={COLORS.textSecondary}
                          />
                          <Text style={styles.metaText}>
                            {formatDate(item.startTime)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.countBadge}>
                      <Ionicons name="people" size={13} color={COLORS.teal} />
                      <Text style={styles.countText}>{item.attendeeCount}</Text>
                    </View>
                  </View>

                  {item.attendees.length === 0 ? (
                    <Text style={styles.attendeeEmpty}>No attendees yet.</Text>
                  ) : (
                    <View style={styles.attendeeList}>
                      {item.attendees.map((attendee) => (
                        <View
                          key={attendee.studentId}
                          style={styles.attendeeRow}
                        >
                          <View style={styles.attendeeAvatar}>
                            <Ionicons
                              name="person-outline"
                              size={14}
                              color={COLORS.teal}
                            />
                          </View>
                          <Text style={styles.attendeeName}>
                            {attendee.studentName ||
                              shortId(attendee.studentId)}
                          </Text>
                          <Text style={styles.attendeeDate}>
                            {formatDate(attendee.scannedAt)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            />
          )
        ) : studentRecords.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            message="No records yet. Scan a QR code to register your attendance."
          />
        ) : (
          <FlatList
            data={studentRecords}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.studentCard}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={COLORS.teal}
                  />
                </View>
                <View style={styles.studentBody}>
                  <Text style={styles.eventTitle}>{item.eventTitle}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="pricetag-outline"
                      size={13}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText}>{item.eventId}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.metaText}>
                      {formatDate(item.scannedAt)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScreenBackground>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function shortId(id: string) {
  return id ? `\u2026${id.slice(-8)}` : "unknown";
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 28,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 540,
    alignSelf: "flex-start",
    alignItems: "center",
    marginTop: 20,
    padding: 28,
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    width: "100%",
    maxWidth: 540,
    alignSelf: "flex-start",
    alignItems: "center",
    marginTop: 20,
    padding: 26,
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
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  eventCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eventHeaderBody: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
  },
  eventTitle: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.tealSoft,
  },
  countText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.teal,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  studentBody: {
    flex: 1,
    minWidth: 0,
  },
  attendeeList: {
    marginTop: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.tealBorder,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF6F2",
  },
  attendeeAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.tealSoft,
  },
  attendeeName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  attendeeDate: {
    marginLeft: 6,
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  attendeeEmpty: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
