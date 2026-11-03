import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import AdminBadge from "@/components/admin/AdminBadge";
import AdminDateTimeField from "@/components/admin/AdminDateTimeField";
import AdminScreenHeader from "@/components/admin/AdminScreenHeader";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
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
  deleteAttendance,
  listAttendance,
  listEvents,
  type AdminAttendanceRow,
  type AdminEvent,
} from "@/lib/admin";
import { formatDate, formatTime, toInputDateValue } from "@/lib/datetime";
import { confirmAction } from "@/lib/confirm";

const ALL = "all";

export default function AttendanceRecordsScreen() {
  const [rows, setRows] = useState<AdminAttendanceRow[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState(ALL);
  const [studentId, setStudentId] = useState(ALL);
  const [teacherId, setTeacherId] = useState(ALL);
  const [dateEnabled, setDateEnabled] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => new Date());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [attendanceResult, eventResult] = await Promise.all([
      listAttendance(),
      listEvents(),
    ]);

    if (attendanceResult.error) setError(attendanceResult.error);
    else setRows(attendanceResult.data);

    if (!eventResult.error) setEvents(eventResult.data);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const eventOptions = useMemo<AdminSelectOption[]>(() => {
    const seen = new Set<string>();
    const options: AdminSelectOption[] = [{ label: "All events", value: ALL }];
    for (const event of events) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      options.push({
        label: `[${event.event_code}] ${event.title}`,
        value: event.id,
      });
    }
    return options;
  }, [events]);

  const studentOptions = useMemo<AdminSelectOption[]>(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (!seen.has(row.student_id)) {
        seen.set(
          row.student_id,
          row.student_name || row.student_email || "Unknown student",
        );
      }
    }
    return [
      { label: "All students", value: ALL },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ label, value })),
    ];
  }, [rows]);

  const teacherOptions = useMemo<AdminSelectOption[]>(() => {
    const seen = new Map<string, string>();
    for (const event of events) {
      if (event.created_by && !seen.has(event.created_by)) {
        seen.set(
          event.created_by,
          event.creator_name || event.creator_email || "Unknown creator",
        );
      }
    }
    return [
      { label: "All event creators", value: ALL },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ label, value })),
    ];
  }, [events]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedDate = dateEnabled ? toInputDateValue(dateFilter) : null;

    return rows.filter((row) => {
      if (eventId !== ALL && row.event_id !== eventId) return false;
      if (studentId !== ALL && row.student_id !== studentId) return false;
      if (teacherId !== ALL && row.created_by !== teacherId) return false;

      if (selectedDate) {
        const rowDate = toInputDateValue(new Date(row.scanned_at));
        if (rowDate !== selectedDate) return false;
      }

      if (!query) return true;
      return [
        row.student_name,
        row.student_email,
        row.event_title,
        row.event_code,
        row.creator_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [
    dateEnabled,
    dateFilter,
    eventId,
    rows,
    search,
    studentId,
    teacherId,
  ]);

  const clearFilters = () => {
    setSearch("");
    setEventId(ALL);
    setStudentId(ALL);
    setTeacherId(ALL);
    setDateEnabled(false);
  };

  const handleDelete = (row: AdminAttendanceRow) => {
    confirmAction({
      title: "Delete attendance record?",
      message: `Remove ${
        row.student_name || row.student_email || "this student"
      }'s attendance for "${row.event_title}"? They will be able to scan that event again.`,
      confirmLabel: "Delete Record",
      destructive: true,
      onConfirm: async () => {
        const result = await deleteAttendance(row.id);
        if (result.error) {
          setError(result.error);
        } else {
          setNotice("Attendance record deleted.");
          await load();
        }
      },
    });
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Attendance Records"
        subtitle="Audit every scan by student, event, creator, and date."
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
          <AdminSearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search student, event, or creator…"
          />

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
            <AdminSelect
              label="Teacher / creator"
              value={teacherId}
              options={teacherOptions}
              onSelect={setTeacherId}
            />

            <View style={styles.dateToggle}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateToggleTitle}>Filter by scan date</Text>
                <Text style={styles.dateToggleHint}>
                  Uses the device's local date.
                </Text>
              </View>
              <Switch
                value={dateEnabled}
                onValueChange={setDateEnabled}
                trackColor={{
                  false: ADMIN_COLORS.borderStrong,
                  true: ADMIN_COLORS.accent,
                }}
                thumbColor={ADMIN_COLORS.white}
              />
            </View>

            {dateEnabled ? (
              <AdminDateTimeField
                label="Scan date"
                value={dateFilter}
                onChange={setDateFilter}
                mode="date"
              />
            ) : null}

            <Pressable
              onPress={clearFilters}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && { opacity: 0.65 },
              ]}
            >
              <Ionicons
                name="funnel-outline"
                size={14}
                color={ADMIN_COLORS.textMuted}
              />
              <Text style={styles.clearText}>Reset filters</Text>
            </Pressable>
          </View>

          <Text style={styles.countText}>
            {filtered.length} of {rows.length} attendance records
          </Text>
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={ADMIN_COLORS.success}
            />
            <Text style={styles.noticeText}>{notice}</Text>
            <Pressable onPress={() => setNotice(null)} hitSlop={10}>
              <Ionicons name="close" size={15} color={ADMIN_COLORS.success} />
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <AdminLoading label="Loading attendance records…" />
        ) : error ? (
          <AdminError
            title="Could not load attendance"
            message={error}
            onRetry={() => load()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={rows.length === 0 ? "No attendance yet" : "No matching records"}
            message={
              rows.length === 0
                ? "Attendance appears here after students scan an event QR code."
                : "Adjust the search or filters to see more records."
            }
            icon="checkbox-outline"
            actionLabel={rows.length > 0 ? "Reset Filters" : undefined}
            onAction={rows.length > 0 ? clearFilters : undefined}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((row) => (
              <AttendanceCard
                key={row.id}
                row={row}
                onDelete={() => handleDelete(row)}
              />
            ))}
          </View>
        )}

        <View style={styles.noteCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={ADMIN_COLORS.success}
          />
          <Text style={styles.noteText}>
            Duplicate attendance is blocked by the database's unique
            (student, event) constraint. Students cannot insert records
            directly; every scan is validated by a server-side function.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function AttendanceCard({
  row,
  onDelete,
}: {
  row: AdminAttendanceRow;
  onDelete: () => void;
}) {
  const scanned = new Date(row.scanned_at);
  const month = scanned
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const day = String(scanned.getDate()).padStart(2, "0");

  return (
    <View style={styles.recordCard}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>

      <View style={styles.recordCopy}>
        <View style={styles.recordTop}>
          <Text style={styles.studentName} numberOfLines={1}>
            {row.student_name || row.student_email || "Unknown student"}
          </Text>
          <AdminBadge label="Present" tone="active" />
        </View>
        <Text style={styles.studentEmail} numberOfLines={1}>
          {row.student_email || row.student_id}
        </Text>

        <View style={styles.eventLine}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={ADMIN_COLORS.accentStrong}
          />
          <Text style={styles.eventText} numberOfLines={1}>
            {row.event_title} · {row.event_code}
          </Text>
        </View>

        <View style={styles.recordMetaRow}>
          <Text style={styles.recordMeta}>
            {formatDate(row.scanned_at)} at {formatTime(row.scanned_at)}
          </Text>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Delete attendance record"
          >
            <Ionicons
              name="trash-outline"
              size={14}
              color={ADMIN_COLORS.danger}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
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
  dateToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
  },
  dateToggleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  dateToggleHint: {
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 12,
    paddingVertical: 4,
  },
  clearText: {
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
    backgroundColor: ADMIN_COLORS.successSoft,
    borderRadius: 12,
    padding: 11,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: ADMIN_COLORS.success,
  },
  list: {
    marginTop: 14,
    gap: 10,
  },
  recordCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 13,
  },
  dateBadge: {
    width: 46,
    height: 52,
    borderRadius: 13,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: ADMIN_COLORS.accentStrong,
  },
  dateDay: {
    fontSize: 17,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    marginTop: 1,
  },
  recordCopy: {
    flex: 1,
  },
  recordTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  studentEmail: {
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  eventLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  eventText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: ADMIN_COLORS.accentStrong,
  },
  recordMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 7,
  },
  recordMeta: {
    flex: 1,
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.dangerSoft,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: ADMIN_COLORS.successSoft,
    borderRadius: 13,
    padding: 12,
    marginTop: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: ADMIN_COLORS.success,
  },
});
