export type EventStatus = "upcoming" | "live" | "ended";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Format a Date for <input type="datetime-local"> on web. */
export function toInputDateTimeValue(date: Date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Format a Date for <input type="date"> on web. */
export function toInputDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

/**
 * Parse a yyyy-mm-dd value from <input type="date"> as a local date.
 * `new Date("2026-10-20")` is parsed as UTC and can shift a day in
 * time zones behind UTC, so build the date from its parts instead.
 */
export function parseDateInputValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "No date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return `${formatDate(iso)} at ${formatTime(iso)}`;
}

export function formatDateTimeInput(date: Date) {
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function formatDateInput(date: Date) {
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()}`;
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function getEventStatus(
  start: string | null | undefined,
  end: string | null | undefined,
): EventStatus {
  const now = Date.now();
  const startTime = start ? new Date(start).getTime() : null;
  const endTime = end ? new Date(end).getTime() : null;

  if (startTime && now < startTime) return "upcoming";
  if (endTime && now > endTime) return "ended";
  if (startTime && endTime) return "live";
  if (startTime && now >= startTime) return "live";
  return "upcoming";
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
