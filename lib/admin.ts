import { startOfDay, toInputDateValue } from "./datetime";
import type { CloudEvent } from "./events";
import type { Profile, Role } from "./profiles";
import { supabase } from "./supabase";

export type AdminProfile = Profile;

export type DashboardStats = {
  totalUsers: number;
  totalEvents: number;
  attendanceRecords: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
};

export type AdminEvent = CloudEvent & {
  creator_name: string | null;
  creator_email: string | null;
  attendance_count: number;
};

export type AdminAttendanceRow = {
  id: string;
  scanned_at: string;
  student_id: string;
  event_id: string;
  student_name: string | null;
  student_email: string;
  event_title: string;
  event_code: string;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  creator_name: string | null;
};

export type ManagedUserInput = {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  student_number?: string | null;
  employee_number?: string | null;
  grade_level?: string | null;
  section?: string | null;
  department?: string | null;
  phone?: string | null;
};

export type EventInput = {
  event_code: string;
  title: string;
  description?: string | null;
  start_time: string | null;
  end_time: string | null;
};

const PROFILE_COLUMNS =
  "id, email, full_name, role, is_active, student_number, employee_number, grade_level, section, department, phone, created_at, updated_at";

export function errorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function readFunctionError(error: any, fallback: string) {
  try {
    const context = error?.context;
    if (context && typeof context.json === "function") {
      const body = await context.json();
      if (typeof body?.error === "string" && body.error.trim()) {
        return body.error;
      }
      if (typeof body?.message === "string" && body.message.trim()) {
        return body.message;
      }
    }
  } catch {
    // Fall through to the generic message.
  }
  return errorMessage(error, fallback);
}

async function countRows(
  table: string,
  apply?: (query: any) => any,
): Promise<{ count: number; error: string | null }> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  return {
    count: count ?? 0,
    error: error ? error.message : null,
  };
}

export async function getDashboardStats(): Promise<{
  data: DashboardStats | null;
  error: string | null;
}> {
  const [users, events, attendance, students, teachers, admins] =
    await Promise.all([
      countRows("profiles"),
      countRows("events"),
      countRows("attendance"),
      countRows("profiles", (query) => query.eq("role", "student")),
      countRows("profiles", (query) => query.eq("role", "teacher")),
      countRows("profiles", (query) => query.eq("role", "admin")),
    ]);

  const failure =
    users.error ||
    events.error ||
    attendance.error ||
    students.error ||
    teachers.error ||
    admins.error;

  if (failure) {
    return { data: null, error: failure };
  }

  return {
    data: {
      totalUsers: users.count,
      totalEvents: events.count,
      attendanceRecords: attendance.count,
      totalStudents: students.count,
      totalTeachers: teachers.count,
      totalAdmins: admins.count,
    },
    error: null,
  };
}

export async function listProfiles(
  role?: Role,
): Promise<{ data: AdminProfile[]; error: string | null }> {
  let query = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false });

  if (role) query = query.eq("role", role);

  const { data, error } = await query;
  return {
    data: (data ?? []) as AdminProfile[],
    error: error ? error.message : null,
  };
}

export async function createManagedUser(
  input: ManagedUserInput,
): Promise<{ data: AdminProfile | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: input,
  });

  if (error) {
    return {
      data: null,
      error: await readFunctionError(
        error,
        "Could not create the account. Deploy the admin-create-user Edge Function and try again.",
      ),
    };
  }

  if (data?.error) {
    return { data: null, error: String(data.error) };
  }

  return {
    data: (data?.profile as AdminProfile | undefined) ?? null,
    error: null,
  };
}

export async function updateProfileDetails(
  userId: string,
  updates: Partial<
    Pick<
      AdminProfile,
      | "full_name"
      | "student_number"
      | "employee_number"
      | "grade_level"
      | "section"
      | "department"
      | "phone"
    >
  >,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error?.code === "23505") {
    return {
      error:
        "That student or employee number is already used by another account.",
    };
  }

  return { error: error ? error.message : null };
}

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
  });
  return { error: error ? error.message : null };
}

export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("admin_set_user_active", {
    p_user_id: userId,
    p_active: active,
  });
  return { error: error ? error.message : null };
}

export async function listEvents(): Promise<{
  data: AdminEvent[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  const events = (data ?? []) as CloudEvent[];
  if (events.length === 0) return { data: [], error: null };

  const creatorIds = [
    ...new Set(events.map((event) => event.created_by).filter(Boolean)),
  ] as string[];
  const eventIds = events.map((event) => event.id);

  const [creators, attendance] = await Promise.all([
    creatorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", creatorIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("attendance").select("event_id").in("event_id", eventIds),
  ]);

  const creatorsById = new Map(
    ((creators.data ?? []) as { id: string; full_name: string | null; email: string }[]).map(
      (profile) => [profile.id, profile],
    ),
  );

  const counts = new Map<string, number>();
  ((attendance.data ?? []) as { event_id: string }[]).forEach((row) => {
    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
  });

  return {
    data: events.map((event) => {
      const creator = event.created_by
        ? creatorsById.get(event.created_by)
        : undefined;
      return {
        ...event,
        creator_name: creator?.full_name ?? null,
        creator_email: creator?.email ?? null,
        attendance_count: counts.get(event.id) ?? 0,
      };
    }),
    error: null,
  };
}

export async function createAdminEvent(
  input: EventInput,
): Promise<{ data: CloudEvent | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("events")
    .insert({
      event_code: input.event_code.trim().toUpperCase(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      start_time: input.start_time,
      end_time: input.end_time,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error?.code === "23505") {
    return {
      data: null,
      error: "An event with that code already exists. Choose a different code.",
    };
  }

  return {
    data: (data as CloudEvent | null) ?? null,
    error: error ? error.message : null,
  };
}

export async function updateAdminEvent(
  eventId: string,
  input: EventInput,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("events")
    .update({
      event_code: input.event_code.trim().toUpperCase(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      start_time: input.start_time,
      end_time: input.end_time,
    })
    .eq("id", eventId);

  if (error?.code === "23505") {
    return {
      error: "An event with that code already exists. Choose a different code.",
    };
  }

  return { error: error ? error.message : null };
}

export async function deleteAdminEvent(
  eventId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);
  return { error: error ? error.message : null };
}

type AttendanceJoinRow = {
  id: string;
  scanned_at: string;
  student_id: string;
  event_id: string;
  events:
    | {
        id: string;
        event_code: string;
        title: string;
        start_time: string | null;
        end_time: string | null;
        created_by: string | null;
      }
    | null;
};

export async function listAttendance(): Promise<{
  data: AdminAttendanceRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("attendance")
    .select(
      "id, scanned_at, student_id, event_id, events ( id, event_code, title, start_time, end_time, created_by )",
    )
    .order("scanned_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  const rows = (data ?? []) as unknown as AttendanceJoinRow[];
  if (rows.length === 0) return { data: [], error: null };

  const profileIds = [
    ...new Set([
      ...rows.map((row) => row.student_id),
      ...rows.map((row) => row.events?.created_by).filter(Boolean),
    ]),
  ] as string[];

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", profileIds);

  if (profilesError) {
    return { data: [], error: profilesError.message };
  }

  const profilesById = new Map(
    ((profilesData ?? []) as { id: string; full_name: string | null; email: string }[]).map(
      (profile) => [profile.id, profile],
    ),
  );

  return {
    data: rows.map((row) => {
      const student = profilesById.get(row.student_id);
      const creator = row.events?.created_by
        ? profilesById.get(row.events.created_by)
        : undefined;
      return {
        id: row.id,
        scanned_at: row.scanned_at,
        student_id: row.student_id,
        event_id: row.event_id,
        student_name: student?.full_name ?? null,
        student_email: student?.email ?? "",
        event_title: row.events?.title ?? "Deleted event",
        event_code: row.events?.event_code ?? "—",
        start_time: row.events?.start_time ?? null,
        end_time: row.events?.end_time ?? null,
        created_by: row.events?.created_by ?? null,
        creator_name: creator?.full_name ?? creator?.email ?? null,
      };
    }),
    error: null,
  };
}

export async function deleteAttendance(
  attendanceId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("id", attendanceId);
  return { error: error ? error.message : null };
}

export async function rotateEventQrToken(
  eventId: string,
): Promise<{ token: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("admin_rotate_event_qr_token", {
    p_event_id: eventId,
  });

  return {
    token: typeof data === "string" ? data : null,
    error: error ? error.message : null,
  };
}

export type DashboardTrendPoint = {
  date: string;
  label: string;
  count: number;
};

export type DashboardBreakdownItem = {
  label: string;
  value: number;
};

export type DashboardActivityKind =
  | "attendance"
  | "event"
  | "student"
  | "teacher"
  | "admin";

export type DashboardActivityItem = {
  id: string;
  kind: DashboardActivityKind;
  title: string;
  detail: string;
  timestamp: string;
};

export type DashboardUpcomingEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
};

export type DashboardExtras = {
  trend: DashboardTrendPoint[];
  breakdown: DashboardBreakdownItem[];
  totalScans: number;
  recentActivity: DashboardActivityItem[];
  upcomingEvents: DashboardUpcomingEvent[];
  recentAttendanceCount: number;
};

type DashboardAttendanceRow = {
  id: string;
  scanned_at: string;
  student_id: string;
  event_id: string;
  events: { title: string; event_code: string } | null;
};

type DashboardRecentEvent = {
  id: string;
  event_code: string;
  title: string;
  created_at: string;
};

type DashboardRecentProfile = {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
  created_at: string;
};

/**
 * Load the real data used by the dashboard charts, activity feed and
 * upcoming-events rail. This deliberately never invents trend percentages or
 * attendance categories: every number comes from attendance rows, events and
 * profiles the signed-in administrator is allowed to read.
 */
export async function getDashboardExtras(
  days = 7,
): Promise<{ data: DashboardExtras | null; error: string | null }> {
  const now = new Date();
  const rangeStart = startOfDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)),
  );
  const nowIso = now.toISOString();

  const [attendanceResult, recentEventsResult, recentProfilesResult, upcomingResult] =
    await Promise.all([
      supabase
        .from("attendance")
        .select("id, scanned_at, student_id, event_id, events ( title, event_code )")
        .gte("scanned_at", rangeStart.toISOString())
        .order("scanned_at", { ascending: false })
        .limit(1000),
      supabase
        .from("events")
        .select("id, event_code, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("events")
        .select("id, event_code, title, start_time, end_time")
        .gte("start_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(3),
    ]);

  if (attendanceResult.error) {
    return { data: null, error: attendanceResult.error.message };
  }

  const rows = (attendanceResult.data ?? []) as unknown as DashboardAttendanceRow[];

  const trend: DashboardTrendPoint[] = Array.from({ length: days }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + index);
    return {
      date: toInputDateValue(date),
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: 0,
    };
  });

  const trendByDate = new Map(trend.map((point) => [point.date, point]));
  rows.forEach((row) => {
    const key = toInputDateValue(new Date(row.scanned_at));
    const point = trendByDate.get(key);
    if (point) point.count += 1;
  });

  const eventCounts = new Map<string, DashboardBreakdownItem>();
  rows.forEach((row) => {
    const label = row.events?.title ?? "Deleted event";
    const existing = eventCounts.get(row.event_id);
    if (existing) {
      existing.value += 1;
    } else {
      eventCounts.set(row.event_id, { label, value: 1 });
    }
  });

  const sortedEventCounts = [...eventCounts.values()].sort(
    (left, right) => right.value - left.value,
  );
  const topEvents = sortedEventCounts.slice(0, 3);
  const otherCount = sortedEventCounts
    .slice(3)
    .reduce((total, item) => total + item.value, 0);
  const breakdown =
    otherCount > 0
      ? [...topEvents, { label: "Other events", value: otherCount }]
      : topEvents;

  const recentAttendance = rows.slice(0, 8);
  const recentStudentIds = [
    ...new Set(recentAttendance.map((row) => row.student_id)),
  ];

  const studentProfilesResult =
    recentStudentIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", recentStudentIds)
      : { data: [], error: null };

  const studentsById = new Map(
    (
      (studentProfilesResult.data ?? []) as {
        id: string;
        full_name: string | null;
        email: string;
      }[]
    ).map((student) => [student.id, student]),
  );

  const activity: DashboardActivityItem[] = [];

  recentAttendance.forEach((row) => {
    const student = studentsById.get(row.student_id);
    activity.push({
      id: `attendance-${row.id}`,
      kind: "attendance",
      title: "Attendance recorded",
      detail: `${
        student?.full_name?.trim() || student?.email || "A student"
      } checked in for ${row.events?.title ?? "an event"}.`,
      timestamp: row.scanned_at,
    });
  });

  ((recentEventsResult.data ?? []) as DashboardRecentEvent[]).forEach((event) => {
    activity.push({
      id: `event-${event.id}`,
      kind: "event",
      title: "New event created",
      detail: `${event.title} · ${event.event_code}`,
      timestamp: event.created_at,
    });
  });

  ((recentProfilesResult.data ?? []) as DashboardRecentProfile[]).forEach(
    (profile) => {
      const kind: DashboardActivityKind =
        profile.role === "teacher"
          ? "teacher"
          : profile.role === "admin"
            ? "admin"
            : "student";
      const title =
        kind === "teacher"
          ? "Teacher account added"
          : kind === "admin"
            ? "Administrator account added"
            : "Student account added";
      activity.push({
        id: `profile-${profile.id}`,
        kind,
        title,
        detail: profile.full_name?.trim() || profile.email,
        timestamp: profile.created_at,
      });
    },
  );

  activity.sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

  return {
    data: {
      trend,
      breakdown,
      totalScans: rows.length,
      recentActivity: activity.slice(0, 4),
      upcomingEvents: ((upcomingResult.data ?? []) as DashboardUpcomingEvent[]).slice(
        0,
        3,
      ),
      recentAttendanceCount: rows.length,
    },
    error: null,
  };
}
