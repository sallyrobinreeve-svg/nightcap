/**
 * Content filter for UGC (App Store Guideline 1.2).
 * Rejects objectionable content. Uses word-boundary matching to reduce false positives.
 */
const BLOCKED_PATTERNS: RegExp[] = [
  /\b(fuck|shit|faggot|nigger|nigga|retard|rape|pedo|kill\s+yourself|kys)\b/i,
];

export function containsObjectionableContent(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return BLOCKED_PATTERNS.some((p) => p.test(text));
}

/** Check all text values in an object (e.g. prompts, notes). */
export function containsObjectionableContentInObject(obj: unknown): boolean {
  if (obj == null) return false;
  if (typeof obj === "string") return containsObjectionableContent(obj);
  if (Array.isArray(obj)) return obj.some(containsObjectionableContentInObject);
  if (typeof obj === "object") {
    return Object.values(obj).some(containsObjectionableContentInObject);
  }
  return false;
}
