import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import AdminDateTimeField from "@/components/admin/AdminDateTimeField";
import AdminScreenHeader from "@/components/admin/AdminScreenHeader";
import AdminSelect, {
  type AdminSelectOption,
} from "@/components/admin/AdminSelect";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { adminStyles } from "@/components/admin/styles";
import { ADMIN_COLORS } from "@/constants/colors";
import {
  listAttendance,
  listEvents,
  listProfiles,
  type AdminAttendanceRow,
  type AdminEvent,
  type AdminProfile,
} from "@/lib/admin";
import {
  endOfDay,
  formatDate,
  startOfDay,
  toInputDateValue,
} from "@/lib/datetime";

const ALL = "all";

export default function ReportsScreen() {
  const [rows, setRows] = useState<AdminAttendanceRow[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [students, setStudents] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [eventId, setEventId] = useState(ALL);
  const [studentId, setStudentId] = useState(ALL);
  const [rangeEnabled, setRangeEnabled] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [toDate, setToDate] = useState(() => new Date());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [attendanceResult, eventResult, studentResult] = await Promise.all([
      listAttendance(),
      listEvents(),
      listProfiles("student"),
    ]);

    if (attendanceResult.error) setError(attendanceResult.error);
    else setRows(attendanceResult.data);

    if (!eventResult.error) setEvents(eventResult.data);
    if (!studentResult.error) setStudents(studentResult.data);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const eventOptions = useMemo<AdminSelectOption[]>(() => {
    return [
      { label: "All events", value: ALL },
      ...events.map((event) => ({
        label: `[${event.event_code}] ${event.title}`,
        value: event.id,
      })),
    ];
  }, [events]);

  const studentOptions = useMemo<AdminSelectOption[]>(() => {
    return [
      { label: "All students", value: ALL },
      ...[...students]
        .sort((a, b) =>
          (a.full_name || a.email).localeCompare(b.full_name || b.email),
        )
        .map((student) => ({
          label: `${student.full_name || student.email}${
            student.student_number ? ` · ${student.student_number}` : ""
          }`,
          value: student.id,
        })),
    ];
  }, [students]);

  const rangeInvalid = rangeEnabled && fromDate.getTime() > toDate.getTime();

  const filtered = useMemo(() => {
    if (rangeInvalid) return [];
    const from = rangeEnabled ? startOfDay(fromDate).getTime() : null;
    const to = rangeEnabled ? endOfDay(toDate).getTime() : null;

    return rows.filter((row) => {
      if (eventId !== ALL && row.event_id !== eventId) return false;
      if (studentId !== ALL && row.student_id !== studentId) return false;

      if (from !== null && to !== null) {
        const scanned = new Date(row.scanned_at).getTime();
        if (scanned < from || scanned > to) return false;
      }

      return true;
    });
  }, [
    eventId,
    fromDate,
    rangeEnabled,
    rangeInvalid,
    rows,
    studentId,
    toDate,
  ]);

  const eligibleStudents = useMemo(() => {
    let list = students.filter((student) => student.is_active);
    if (studentId !== ALL) {
      list = list.filter((student) => student.id === studentId);
    }
    return list;
  }, [studentId, students]);

  const metrics = useMemo(() => {
    const uniqueStudents = new Set(filtered.map((row) => row.student_id));
    const uniqueEvents = new Set(filtered.map((row) => row.event_id));
    const denominator = eligibleStudents.length * uniqueEvents.size;
    const rate =
      denominator > 0
        ? Math.min(100, (uniqueStudents.size / denominator) * 100)
        : 0;

    return {
      totalRecords: filtered.length,
      uniqueStudents: uniqueStudents.size,
      uniqueEvents: uniqueEvents.size,
      rate,
      denominator,
    };
  }, [eligibleStudents.length, filtered]);

  const byEvent = useMemo(() => {
    const buckets = new Map<
      string,
      { title: string; code: string; count: number; students: Set<string> }
    >();

    for (const row of filtered) {
      const current = buckets.get(row.event_id) ?? {
        title: row.event_title,
        code: row.event_code,
        count: 0,
        students: new Set<string>(),
      };
      current.count += 1;
      current.students.add(row.student_id);
      buckets.set(row.event_id, current);
    }

    return [...buckets.entries()]
      .map(([id, bucket]) => ({
        id,
        title: bucket.title,
        code: bucket.code,
        count: bucket.count,
        uniqueStudents: bucket.students.size,
        rate:
          eligibleStudents.length > 0
            ? Math.min(
                100,
                (bucket.students.size / eligibleStudents.length) * 100,
              )
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [eligibleStudents.length, filtered]);

  const handleExport = async () => {
    if (exporting) return;

    if (filtered.length === 0) {
      setNotice("There are no records to export with the current filters.");
      return;
    }

    setExporting(true);
    setNotice(null);

    const header = [
      "Student Name",
      "Student Email",
      "Student ID",
      "Event Title",
      "Event Code",
      "Scanned At",
      "Date",
      "Time",
      "Status",
      "Event Creator",
    ];

    const lines = filtered.map((row) =>
      [
        row.student_name ?? "",
        row.student_email,
        row.student_id,
        row.event_title,
        row.event_code,
        row.scanned_at,
        formatDate(row.scanned_at),
        new Date(row.scanned_at).toLocaleTimeString("en-US"),
        "Present",
        row.creator_name ?? "",
      ]
        .map(csvCell)
        .join(","),
    );

    const csv = [header.map(csvCell).join(","), ...lines].join("\r\n");
    const filename = `attendance-report-${toInputDateValue(new Date())}.csv`;

    try {
      if (Platform.OS === "web") {
        const globalAny = globalThis as any;
        const blob = new Blob([`\uFEFF${csv}`], {
          type: "text/csv;charset=utf-8;",
        });
        const url = globalAny.URL.createObjectURL(blob);
        const link = globalAny.document.createElement("a");
        link.href = url;
        link.download = filename;
        globalAny.document.body.appendChild(link);
        link.click();
        globalAny.document.body.removeChild(link);
        globalAny.URL.revokeObjectURL(url);
        setNotice("CSV report downloaded.");
      } else {
        await Share.share({
          title: filename,
          message: csv,
        });
        setNotice("CSV report prepared for sharing.");
      }
    } catch {
      setNotice("Could not export the CSV report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setEventId(ALL);
    setStudentId(ALL);
    setRangeEnabled(false);
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Reports"
        subtitle="Attendance totals, unique attendees, attendance rates, and CSV exports."
        eyebrow="Attendance & Events"
      />

      <ScrollView
        contentContainerStyle={adminStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={ADMIN_COLORS.accent}
            colors={[ADMIN_COLORS.accent]}
          />
        }
      >
        <View style={styles.toolbar}>
          <View style={styles.filterCard}>
            <AdminSelect
              label="Event"
              value={eventId}
              options={eventOptions}
              onSelect={setEventId}
            />
            <AdminSelect
              label="Student"
              value={studentId}
              options={studentOptions}
              onSelect={setStudentId}
            />

            <View style={styles.rangeToggle}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rangeTitle}>Filter by date range</Text>
                <Text style={styles.rangeHint}>
                  Based on when each QR code was scanned.
                </Text>
              </View>
              <Switch
                value={rangeEnabled}
                onValueChange={setRangeEnabled}
                trackColor={{
                  false: ADMIN_COLORS.borderStrong,
                  true: ADMIN_COLORS.accent,
                }}
                thumbColor={ADMIN_COLORS.white}
              />
            </View>

            {rangeEnabled ? (
              <>
                <AdminDateTimeField
                  label="From"
                  value={fromDate}
                  onChange={setFromDate}
                  mode="date"
                />
                <AdminDateTimeField
                  label="To"
                  value={toDate}
                  onChange={setToDate}
                  mode="date"
                  minimumDate={fromDate}
                />
                {rangeInvalid ? (
                  <Text style={adminStyles.formError}>
                    The start date must be on or before the end date.
                  </Text>
                ) : null}
              </>
            ) : null}

            <Pressable
              onPress={resetFilters}
              style={({ pressed }) => [
                styles.resetButton,
                pressed && { opacity: 0.65 },
              ]}
            >
              <Ionicons
                name="funnel-outline"
                size={14}
                color={ADMIN_COLORS.textMuted}
              />
              <Text style={styles.resetText}>Reset report filters</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [
              adminStyles.button,
              adminStyles.buttonPrimary,
              pressed && { opacity: 0.78 },
              exporting && adminStyles.buttonDisabled,
            ]}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={ADMIN_COLORS.white} />
            ) : (
              <Ionicons
                name="download-outline"
                size={18}
                color={ADMIN_COLORS.white}
              />
            )}
            <Text style={adminStyles.buttonPrimaryText}>
              {exporting ? "Preparing CSV…" : "Export CSV"}
            </Text>
          </Pressable>

          <Text style={styles.countText}>
            {filtered.length} records in the current report
          </Text>
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={ADMIN_COLORS.text}
            />
            <Text style={styles.noticeText}>{notice}</Text>
            <Pressable onPress={() => setNotice(null)} hitSlop={10}>
              <Ionicons name="close" size={15} color={ADMIN_COLORS.text} />
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <AdminLoading label="Building attendance report…" />
        ) : error ? (
          <AdminError
            title="Could not build the report"
            message={error}
            onRetry={() => load()}
          />
        ) : (
          <>
            <View style={styles.metricGrid}>
              <Metric
                label="Attendance records"
                value={String(metrics.totalRecords)}
                icon="checkbox-outline"
              />
              <Metric
                label="Unique students"
                value={String(metrics.uniqueStudents)}
                icon="people-outline"
              />
              <Metric
                label="Events with records"
                value={String(metrics.uniqueEvents)}
                icon="calendar-outline"
              />
              <Metric
                label="Attendance rate"
                value={`${metrics.rate.toFixed(1)}%`}
                icon="trending-up-outline"
              />
            </View>

            <View style={styles.rateCard}>
              <View style={styles.rateHeader}>
                <Text style={styles.rateTitle}>Attendance rate</Text>
                <Text style={styles.rateValue}>
                  {metrics.rate.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, metrics.rate)}%` },
                  ]}
                />
              </View>
              <Text style={styles.rateHint}>
                {metrics.denominator > 0
                  ? `${metrics.uniqueStudents} unique attendees ÷ (${eligibleStudents.length} eligible students × ${metrics.uniqueEvents} events with records).`
                  : "Not enough event and student data to calculate a rate."}
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Breakdown by event</Text>
              <Text style={styles.sectionHint}>
                {byEvent.length} event{byEvent.length === 1 ? "" : "s"}
              </Text>
            </View>

            {byEvent.length === 0 ? (
              <AdminEmpty
                title="No attendance in this report"
                message="Change the filters or wait for students to scan an event QR code."
                icon="bar-chart-outline"
              />
            ) : (
              <View style={styles.breakdownList}>
                {byEvent.map((event) => (
                  <View key={event.id} style={styles.breakdownCard}>
                    <View style={styles.breakdownTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.breakdownCode}>{event.code}</Text>
                      </View>
                      <Text style={styles.breakdownCount}>
                        {event.count} scan{event.count === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <View style={styles.smallTrack}>
                      <View
                        style={[
                          styles.smallFill,
                          { width: `${Math.min(100, event.rate)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.breakdownMeta}>
                      {event.uniqueStudents} unique student
                      {event.uniqueStudents === 1 ? "" : "s"} ·{" "}
                      {event.rate.toFixed(1)}% of eligible students
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.exportNote}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={ADMIN_COLORS.accentStrong}
              />
              <Text style={styles.exportNoteText}>
                CSV export includes the current filters and one row per
                attendance record, with student, event, timestamp, status, and
                event creator columns.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={17} color={ADMIN_COLORS.accentStrong} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function csvCell(value: string) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const styles = StyleSheet.create({
  toolbar: {
    paddingTop: 16,
    gap: 12,
  },
  filterCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 13,
  },
  rangeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
  },
  rangeTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  rangeHint: {
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 12,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 11,
    fontWeight: "700",
    color: ADMIN_COLORS.textMuted,
  },
  countText: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ADMIN_COLORS.accentFaint,
    borderRadius: 12,
    padding: 11,
    marginTop: 14,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: ADMIN_COLORS.text,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 18,
  },
  metricCard: {
    width: "48.2%",
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 13,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: ADMIN_COLORS.text,
  },
  metricLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.textMuted,
    marginTop: 3,
  },
  rateCard: {
    backgroundColor: ADMIN_COLORS.header,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  rateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rateTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ADMIN_COLORS.headerMuted,
  },
  rateValue: {
    fontSize: 22,
    fontWeight: "800",
    color: ADMIN_COLORS.white,
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.headerRaised,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.accent,
  },
  rateHint: {
    fontSize: 10,
    lineHeight: 16,
    color: ADMIN_COLORS.headerMuted,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  sectionHint: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
  },
  breakdownList: {
    gap: 9,
  },
  breakdownCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 13,
  },
  breakdownTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  breakdownCode: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: ADMIN_COLORS.accentStrong,
    marginTop: 2,
  },
  breakdownCount: {
    fontSize: 11,
    fontWeight: "700",
    color: ADMIN_COLORS.textMuted,
  },
  smallTrack: {
    height: 4,
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.background,
    overflow: "hidden",
    marginTop: 10,
  },
  smallFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: ADMIN_COLORS.accent,
  },
  breakdownMeta: {
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
    marginTop: 7,
  },
  exportNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: ADMIN_COLORS.accentFaint,
    borderRadius: 13,
    padding: 12,
    marginTop: 16,
  },
  exportNoteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: ADMIN_COLORS.textMuted,
  },
});
