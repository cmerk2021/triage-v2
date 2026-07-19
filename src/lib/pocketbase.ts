import PocketBase from "pocketbase";

/**
 * Single shared PocketBase client.
 *
 * In development the frontend runs on Vite (5173) and talks to PocketBase on
 * 8090 directly. In production the built SPA is served *by* PocketBase, so the
 * same origin is used.
 */
const baseUrl = import.meta.env.DEV
  ? "http://127.0.0.1:8090"
  : window.location.origin;

export const pb = new PocketBase(baseUrl);

// We manage request lifecycles at the store level; disable the SDK's automatic
// cancellation so parallel reads from different features don't cancel each other.
pb.autoCancellation(false);

/** Build a stable URL for a stored file (works same-origin in production). */
export function fileUrl(
  collection: string,
  recordId: string,
  filename: string,
): string {
  return `${baseUrl}/api/files/${collection}/${recordId}/${encodeURIComponent(filename)}`;
}
