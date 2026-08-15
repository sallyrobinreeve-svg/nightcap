/**
 * Browser fetch helpers: network/offline failures and API errors get stable, user-facing messages.
 */

export const MSG_OFFLINE =
  "You're offline. Check your connection and try again.";
export const MSG_NETWORK =
  "Network error. Check your connection and try again.";
export const MSG_GENERIC = "Something went wrong. Please try again.";
export const MSG_SESSION = "Your session expired. Please sign in again.";
export const MSG_SERVER = "Server error. Please try again in a moment.";

function isOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

export type FetchJsonResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

/**
 * JSON API call with friendly errors for offline, network, and HTTP failures.
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<FetchJsonResult<T>> {
  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    let data: unknown = undefined;
    if (isJson) {
      try {
        data = await response.json();
      } catch {
        data = undefined;
      }
    }

    if (!response.ok) {
      let message = MSG_GENERIC;
      if (data && typeof data === "object" && data !== null && "error" in data) {
        const err = (data as { error?: unknown }).error;
        if (typeof err === "string" && err.trim()) message = err;
      }
      if (response.status === 401) message = MSG_SESSION;
      else if (response.status === 403 || response.status === 404) {
        if (message === MSG_GENERIC) message = "That action isn’t available.";
      } else if (response.status >= 500) {
        if (message === MSG_GENERIC) message = MSG_SERVER;
      }
      return { ok: false, status: response.status, message };
    }

    return { ok: true, status: response.status, data: data as T };
  } catch {
    if (isOffline()) return { ok: false, status: 0, message: MSG_OFFLINE };
    return { ok: false, status: 0, message: MSG_NETWORK };
  }
}

/** Same as fetchJson but for responses with no JSON body (e.g. DELETE). */
export async function fetchOk(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: true; status: number } | { ok: false; status: number; message: string }> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      let message = MSG_GENERIC;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          const data = await response.json();
          if (data && typeof data === "object" && data !== null && "error" in data) {
            const err = (data as { error?: unknown }).error;
            if (typeof err === "string" && err.trim()) message = err;
          }
        } catch {
          // ignore
        }
      }
      if (response.status === 401) message = MSG_SESSION;
      else if (response.status >= 500 && message === MSG_GENERIC) message = MSG_SERVER;
      return { ok: false, status: response.status, message };
    }
    return { ok: true, status: response.status };
  } catch {
    if (isOffline()) return { ok: false, status: 0, message: MSG_OFFLINE };
    return { ok: false, status: 0, message: MSG_NETWORK };
  }
}
