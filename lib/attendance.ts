import { parseQRPayload } from "./qr";
import { supabase } from "./supabase";

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
  details?: string;
};

type RegisterAttendanceRpcResult = {
  success: boolean;
  message: string;
  event_title?: string | null;
};

/**
 * Record attendance through the server-side validation function.
 *
 * The database checks the signed event token, the event time window, the
 * student's active account, and the unique (student, event) constraint. The
 * student identity always comes from the authenticated session, never from the
 * QR payload.
 */
export async function registerAttendance(
  rawPayload: string,
  _studentId: string,
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);
  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }
  const payload = parsed.payload;

  const { data, error } = await supabase.rpc("register_attendance_qr", {
    p_event_code: payload.event,
    p_token: payload.token ?? null,
  });

  if (error) {
    const message =
      error.code === "42883"
        ? "Attendance validation is not set up yet. Ask an administrator to run supabase/admin_setup.sql."
        : error.message || "Could not record attendance.";
    return { success: false, message };
  }

  const result = data as RegisterAttendanceRpcResult | null;
  if (!result) {
    return { success: false, message: "Could not record attendance." };
  }

  return {
    success: Boolean(result.success),
    message: result.message || "Could not record attendance.",
    eventTitle: result.event_title ?? undefined,
    details: "Validated securely on the server.",
  };
}

export async function getAttendanceHistory(
  studentId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, scanned_at, events ( event_code, title )")
    .eq("student_id", studentId)
    .order("scanned_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? "",
    eventTitle: row.events?.title ?? "",
    scannedAt: row.scanned_at,
  }));
}

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    studentName: string | null;
    scannedAt: string;
  }[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export async function getTeacherEventAttendance(
  teacherId: string,
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from("events")
    .select("id, event_code, title, start_time, end_time")
    .or(`created_by.eq.${teacherId},created_by.is.null`)
    .order("created_at", { ascending: false });

  if (eventError || !events) return [];

  const eventIds = events.map((e: any) => e.id);
  if (eventIds.length === 0) return [];

  const { data: attendance, error: attError } = await supabase
    .from("attendance")
    .select("student_id, scanned_at, event_id")
    .in("event_id", eventIds)
    .order("scanned_at", { ascending: false });

  if (attError || !attendance) return [];

  const studentIds = [...new Set(attendance.map((a: any) => a.student_id))];
  const { data: profilesData } =
    studentIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds)
      : { data: null };
  const profilesById = new Map((profilesData ?? []).map((p: any) => [p.id, p]));

  return events.map((e: any) => {
    const rows = attendance.filter((a: any) => a.event_id === e.id);
    return {
      eventId: e.id,
      eventCode: e.event_code,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
      attendeeCount: rows.length,
      attendees: rows.map((a: any) => ({
        studentId: a.student_id,
        studentName: profilesById.get(a.student_id)?.full_name ?? null,
        scannedAt: a.scanned_at,
      })),
    };
  });
}

export async function getTeacherEventSummary(
  teacherId: string,
): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from("events")
    .select("id, event_code, title")
    .or(`created_by.eq.${teacherId},created_by.is.null`)
    .order("created_at", { ascending: false });

  if (eventError || !events) return [];

  const eventIds = events.map((e: any) => e.id);
  if (eventIds.length === 0) return [];

  const { data: attRows, error: attError } = await supabase
    .from("attendance")
    .select("event_id")
    .in("event_id", eventIds);

  if (attError || !attRows) return [];

  const counts: Record<string, number> = {};
  attRows.forEach((r: any) => {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  });

  return events.map((e: any) => ({
    eventId: e.id,
    eventCode: e.event_code,
    title: e.title,
    attendeeCount: counts[e.id] ?? 0,
  }));
}
