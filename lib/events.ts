import { supabase } from "./supabase";

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
};

export type CloudEvent = {
  id: string;
  event_code: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
};

export async function createEvent(
  event: Event,
  createdBy?: string,
): Promise<{ data: CloudEvent | null; error: string | null }> {
  let teacherId: string | null = createdBy ?? null;
  if (!teacherId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    teacherId = user?.id ?? null;
  }

  const { data, error } = await supabase
    .from("events")
    .upsert(
      {
        event_code: event.eventId,
        title: event.title,
        start_time: event.start || null,
        end_time: event.end || null,
        created_by: teacherId ?? null,
      },
      { onConflict: "event_code" },
    )
    .select("*")
    .single();

  return {
    data: (data as CloudEvent | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function getEventsByTeacher(
  teacherId: string,
): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("created_by", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as CloudEvent[];
}

export async function getEventByCode(code: string): Promise<CloudEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("event_code", code)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CloudEvent;
}

/**
 * Ask the database for the event's QR token. The SECURITY DEFINER function
 * only returns it to an administrator or to the teacher who created the event.
 */
export async function getEventQrToken(
  eventId: string,
): Promise<{ token: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("get_event_qr_token", {
    p_event_id: eventId,
  });

  return {
    token: typeof data === "string" ? data : null,
    error: error?.message ?? null,
  };
}
