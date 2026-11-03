export type QRPayload = {
  v: 1 | 2;
  event: string;
  token?: string;
  title?: string;
  start?: string;
  end?: string;
};

/**
 * Build the payload written into an event QR code.
 *
 * Version 2 payloads include the event token created by the database. The
 * scanner sends that token to a SECURITY DEFINER database function, which
 * checks it before writing attendance. Older version 1 payloads remain
 * readable for events that have not issued a token yet.
 */
export function buildQRPayload(event: {
  eventId: string;
  title: string;
  start?: string | null;
  end?: string | null;
  token?: string | null;
}): string {
  const payload: QRPayload = {
    v: event.token ? 2 : 1,
    event: event.eventId,
  };

  if (event.token) payload.token = event.token;
  if (event.title) payload.title = event.title;
  if (event.start) payload.start = event.start;
  if (event.end) payload.end = event.end;

  return JSON.stringify(payload);
}

export type ParseQRResult =
  | { ok: true; payload: QRPayload }
  | { ok: false; message: string };

const UUID_TOKEN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseQRPayload(raw: string): ParseQRResult {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Invalid QR code." };
  }

  if (
    (parsed.v !== 1 && parsed.v !== 2) ||
    typeof parsed.event !== "string" ||
    !parsed.event
  ) {
    return { ok: false, message: "Not an attendance QR code." };
  }

  if (parsed.token !== undefined) {
    if (
      typeof parsed.token !== "string" ||
      !UUID_TOKEN.test(parsed.token)
    ) {
      return { ok: false, message: "This event QR code is invalid." };
    }
  }

  if (parsed.v === 2 && typeof parsed.token !== "string") {
    return { ok: false, message: "This event QR code is incomplete." };
  }

  return { ok: true, payload: parsed as QRPayload };
}
