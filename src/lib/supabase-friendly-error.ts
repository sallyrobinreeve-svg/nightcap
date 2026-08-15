/**
 * Map raw Supabase/Postgres messages to safe, user-facing strings (no stack traces).
 */
export function toFriendlySupabaseMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("jwt") || m.includes("invalid refresh") || m.includes("session")) {
    return "Your session expired. Please sign in again.";
  }
  if (
    m.includes("permission denied") ||
    m.includes("row-level security") ||
    m.includes("rls")
  ) {
    return "You don’t have permission to do that.";
  }
  if (m.includes("relation") && m.includes("does not exist")) {
    return "Service is temporarily unavailable. Please try again later.";
  }
  if (m.includes("foreign key") || m.includes("violates")) {
    return "That action can’t be completed.";
  }
  if (m.includes("duplicate") || m.includes("unique")) {
    return "That already exists.";
  }
  if (m.includes("bucket") || m.includes("storage") || m.includes("object not found")) {
    return "Couldn’t upload the file. Try again or use a different photo.";
  }
  if (m.includes("expired") && (m.includes("otp") || m.includes("token") || m.includes("code"))) {
    return "That code expired. Request a new one.";
  }
  if (m.includes("invalid") && m.includes("phone")) {
    return "Enter a valid mobile number.";
  }
  if (m.includes("invalid") && (m.includes("otp") || m.includes("token") || m.includes("code"))) {
    return "That code doesn’t look right. Try again.";
  }
  if (
    m.includes("sms") ||
    m.includes("twilio") ||
    (m.includes("phone") &&
      (m.includes("send") || m.includes("provider") || m.includes("unsupported")))
  ) {
    return "We couldn’t send a text right now. Check the number and try again in a moment.";
  }
  if (m.includes("rate") && m.includes("limit")) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  return "Something went wrong. Please try again.";
}
