import { format, isValid } from "date-fns";

/**
 * Avoids crashes when DB has null/invalid dates (date-fns `format` throws on Invalid Date).
 * Safe for server components, client components, and APIs.
 */
export function formatDateSafe(
  value: string | Date | null | undefined,
  fmt: string,
  fallback = "—"
): string {
  try {
    if (value == null || value === "") return fallback;
    const d = value instanceof Date ? value : new Date(value);
    if (!isValid(d)) return fallback;
    return format(d, fmt);
  } catch {
    return fallback;
  }
}
