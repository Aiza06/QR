import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AdminBadge from "@/components/admin/AdminBadge";
import AdminDateTimeField from "@/components/admin/AdminDateTimeField";
import AdminField from "@/components/admin/AdminField";
import AdminFormModal from "@/components/admin/AdminFormModal";
import AdminScreenHeader from "@/components/admin/AdminScreenHeader";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { adminStyles } from "@/components/admin/styles";
import { ADMIN_COLORS } from "@/constants/colors";
import {
  deleteAdminEvent,
  listEvents,
  updateAdminEvent,
  type AdminEvent,
} from "@/lib/admin";
import {
  formatDate,
  formatTime,
  getEventStatus,
} from "@/lib/datetime";
import { confirmAction } from "@/lib/confirm";

type EventForm = {
  title: string;
  event_code: string;
  description: string;
  start: Date;
  end: Date;
};

function defaultForm(): EventForm {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    event_code: "",
    description: "",
    start,
    end,
  };
}

function parseDateOr(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export default function ManageEventsScreen() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<EventForm>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await listEvents();
    if (result.error) setError(result.error);
    else setEvents(result.data);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) =>
      [
        event.title,
        event.event_code,
        event.description,
        event.creator_name,
        event.creator_email,
        getEventStatus(event.start_time, event.end_time),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [events, search]);

  const openEdit = (event: AdminEvent) => {
    const fallbackStart = new Date();
    const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000);
    setEditing(event);
    setForm({
      title: event.title,
      event_code: event.event_code,
      description: event.description ?? "",
      start: parseDateOr(event.start_time, fallbackStart),
      end: parseDateOr(event.end_time, fallbackEnd),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const update = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
  };

  const handleStartChange = (date: Date) => {
    setForm((current) => {
      const end =
        current.end.getTime() <= date.getTime()
          ? new Date(date.getTime() + 60 * 60 * 1000)
          : current.end;
      return { ...current, start: date, end };
    });
    setFormError(null);
  };

  const validate = () => {
    if (!form.title.trim()) return "Event title is required.";
    if (!form.event_code.trim()) return "Event code is required.";
    if (!/^[A-Za-z0-9._-]{3,40}$/.test(form.event_code.trim())) {
      return "Event code must be 3–40 characters using letters, numbers, dots, dashes, or underscores.";
    }
    if (Number.isNaN(form.start.getTime()) || Number.isNaN(form.end.getTime())) {
      return "Enter valid start and end date/times.";
    }
    if (form.end.getTime() <= form.start.getTime()) {
      return "End time must be after the start time.";
    }
    return null;
  };

  const handleSave = async () => {
    if (saving || !editing) return;

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      event_code: form.event_code.trim().toUpperCase(),
      description: form.description.trim() || null,
      start_time: form.start.toISOString(),
      end_time: form.end.toISOString(),
    };

    const result = await updateAdminEvent(editing.id, payload);
    if (result.error) {
      setFormError(result.error);
    } else {
      setModalOpen(false);
      setEditing(null);
      setNotice("Event updated.");
      await load();
    }

    setSaving(false);
  };

  const handleDelete = (event: AdminEvent) => {
    confirmAction({
      title: "Delete event?",
      message: `"${event.title}" and all of its attendance records will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete Event",
      destructive: true,
      onConfirm: async () => {
        const result = await deleteAdminEvent(event.id);
        if (result.error) {
          setError(result.error);
        } else {
          setNotice("Event deleted.");
          await load();
        }
      },
    });
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Manage Events"
        subtitle="Review, edit, and remove the events that students scan into."
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
            placeholder="Search events, codes, or creators…"
          />
          <Text style={styles.countText}>
            {filtered.length} of {events.length} events
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
          <AdminLoading label="Loading events…" />
        ) : error ? (
          <AdminError
            title="Could not load events"
            message={error}
            onRetry={() => load()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={events.length === 0 ? "No events yet" : "No matching events"}
            message={
              events.length === 0
                ? "Events created by teachers will appear here."
                : "Try a different search term."
            }
            icon="calendar-outline"
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => openEdit(event)}
                onDelete={() => handleDelete(event)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminFormModal
        visible={modalOpen}
        title="Edit event"
        subtitle="Update this event. Students can only record attendance during the event window (plus a 24-hour grace period after it ends)."
        onClose={closeModal}
        footer={
          <View style={styles.footerRow}>
            <Pressable
              onPress={closeModal}
              disabled={saving}
              style={({ pressed }) => [
                adminStyles.button,
                adminStyles.buttonSecondary,
                styles.footerButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={adminStyles.buttonSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                adminStyles.button,
                adminStyles.buttonPrimary,
                styles.footerButton,
                pressed && { opacity: 0.78 },
                saving && adminStyles.buttonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={ADMIN_COLORS.white} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={17}
                  color={ADMIN_COLORS.white}
                />
              )}
              <Text style={adminStyles.buttonPrimaryText}>
                {saving ? "Saving…" : "Save Changes"}
              </Text>
            </Pressable>
          </View>
        }
      >
        <AdminField
          label="Event title"
          value={form.title}
          onChangeText={(value) => update("title", value)}
          placeholder="e.g. Founders Day Assembly"
          editable={!saving}
        />

        <AdminField
          label="Event code"
          value={form.event_code}
          onChangeText={(value) => update("event_code", value)}
          placeholder="e.g. EVT-2026-0002"
          autoCapitalize="characters"
          editable={!saving}
          hint="Unique code included in the QR payload."
        />

        <AdminField
          label="Description"
          value={form.description}
          onChangeText={(value) => update("description", value)}
          placeholder="Optional details about the event"
          multiline
          editable={!saving}
        />

        <AdminDateTimeField
          label="Starts"
          value={form.start}
          onChange={handleStartChange}
          mode="datetime"
        />
        <AdminDateTimeField
          label="Ends"
          value={form.end}
          onChange={(date) => update("end", date)}
          mode="datetime"
          minimumDate={form.start}
          hint="The QR scanner rejects scans before the start or more than 24 hours after the end."
        />

        <View style={styles.previewRow}>
          <Ionicons
            name="information-circle-outline"
            size={15}
            color={ADMIN_COLORS.textMuted}
          />
          <Text style={styles.previewText}>
            Starts {formatDate(form.start.toISOString())} at{" "}
            {formatTime(form.start.toISOString())} · ends{" "}
            {formatDate(form.end.toISOString())} at{" "}
            {formatTime(form.end.toISOString())}
          </Text>
        </View>

        {formError ? (
          <Text style={adminStyles.formError}>{formError}</Text>
        ) : null}
      </AdminFormModal>
    </View>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: AdminEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getEventStatus(event.start_time, event.end_time);
  const statusLabel =
    status === "live" ? "Live" : status === "upcoming" ? "Upcoming" : "Ended";

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventTop}>
        <View style={styles.eventIcon}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={ADMIN_COLORS.accentStrong}
          />
        </View>
        <View style={styles.eventCopy}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.eventCode}>{event.event_code}</Text>
        </View>
        <AdminBadge label={statusLabel} tone={status} />
      </View>

      {event.description ? (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>
      ) : null}

      <View style={styles.eventMetaList}>
        <View style={styles.eventMetaRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={ADMIN_COLORS.textMuted}
          />
          <Text style={styles.eventMeta}>
            {formatDate(event.start_time)} · {formatTime(event.start_time)} to{" "}
            {formatTime(event.end_time)}
          </Text>
        </View>
        <View style={styles.eventMetaRow}>
          <Ionicons
            name="person-outline"
            size={14}
            color={ADMIN_COLORS.textMuted}
          />
          <Text style={styles.eventMeta}>
            {event.creator_name || event.creator_email || "No creator recorded"}
          </Text>
        </View>
        <View style={styles.eventMetaRow}>
          <Ionicons
            name="checkbox-outline"
            size={14}
            color={ADMIN_COLORS.textMuted}
          />
          <Text style={styles.eventMeta}>
            {event.attendance_count} attendance record
            {event.attendance_count === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={styles.eventActions}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons
            name="create-outline"
            size={15}
            color={ADMIN_COLORS.text}
          />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${event.title}`}
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={ADMIN_COLORS.danger}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingTop: 16,
    gap: 12,
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
    gap: 11,
  },
  eventCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
  },
  eventTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  eventCopy: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
    lineHeight: 20,
  },
  eventCode: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: ADMIN_COLORS.accentStrong,
    marginTop: 3,
  },
  eventDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.textMuted,
    marginTop: 10,
  },
  eventMetaList: {
    gap: 6,
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  eventMeta: {
    flex: 1,
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    lineHeight: 16,
  },
  eventActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  iconButton: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ADMIN_COLORS.dangerSoft,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 14,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 10,
  },
  previewText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: ADMIN_COLORS.textMuted,
  },
});
