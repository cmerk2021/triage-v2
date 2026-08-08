/**
 * Client-side Web Push.
 *
 * Unlike the in-app `notifications.ts` helpers (which only fire while a tab is
 * open), this subscribes the browser to the Push API so the server-side push
 * worker can deliver reminders even when Triage is fully closed — the point of
 * a real PWA on mobile and Chromebooks.
 *
 * The VAPID public key is served at runtime by a PocketBase hook so keys can be
 * rotated without rebuilding the frontend.
 */
import { pb } from "./pocketbase";
import type { PushSubscriptionRecord } from "./types";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

let cachedKey: string | null = null;

/** Fetch (and cache) the server's VAPID public key. Empty string if unconfigured. */
export async function getVapidPublicKey(): Promise<string> {
  if (cachedKey !== null) return cachedKey;
  try {
    const res = await fetch("/api/push/config", { credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { publicKey?: string };
    cachedKey = data.publicKey ?? "";
  } catch {
    cachedKey = "";
  }
  return cachedKey;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function bufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready;
}

/** Persist a browser subscription to PocketBase (upsert by endpoint for the owner). */
async function saveSubscription(sub: PushSubscription): Promise<void> {
  const userId = pb.authStore.record?.id;
  if (!userId) return;

  const json = sub.toJSON();
  const payload = {
    owner: userId,
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? bufferToBase64Url(sub.getKey("p256dh")),
    auth: json.keys?.auth ?? bufferToBase64Url(sub.getKey("auth")),
    userAgent: navigator.userAgent.slice(0, 500),
    platform: navigator.userAgent.includes("CrOS")
      ? "chromebook"
      : /Android/i.test(navigator.userAgent)
        ? "android"
        : /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "ios"
          : "desktop",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    enabled: true,
  };

  const existing = await pb
    .collection("push_subscriptions")
    .getFirstListItem<PushSubscriptionRecord>(
      pb.filter("owner = {:owner} && endpoint = {:endpoint}", {
        owner: userId,
        endpoint: sub.endpoint,
      }),
    )
    .catch(() => null);

  if (existing) await pb.collection("push_subscriptions").update(existing.id, payload);
  else await pb.collection("push_subscriptions").create(payload);
}

/** Subscribe this browser to push and store it server-side. Returns true on success. */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;
  }

  const key = await getVapidPublicKey();
  if (!key) return false;

  const reg = await getRegistration();
  if (!reg) return false;

  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
    }));

  await saveSubscription(sub);
  return true;
}

/** Remove the browser subscription and disable its server record. */
export async function unsubscribeFromPush(): Promise<void> {
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;

  const userId = pb.authStore.record?.id;
  if (userId) {
    const existing = await pb
      .collection("push_subscriptions")
      .getFirstListItem<PushSubscriptionRecord>(
        pb.filter("owner = {:owner} && endpoint = {:endpoint}", {
          owner: userId,
          endpoint: sub.endpoint,
        }),
      )
      .catch(() => null);
    if (existing)
      await pb.collection("push_subscriptions").update(existing.id, { enabled: false });
  }

  await sub.unsubscribe();
}

/** Whether this browser currently holds a push subscription. */
export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await getRegistration();
  return !!(await reg?.pushManager.getSubscription());
}

/**
 * On app load, if the user opted into push and the browser is subscribed, make
 * sure the server has a fresh, enabled record (endpoints can silently rotate).
 */
export async function syncPushSubscription(): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await saveSubscription(sub).catch(() => {});
}
