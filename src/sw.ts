/// <reference lib="webworker" />
/**
 * Triage service worker (injectManifest strategy).
 *
 * Handles offline precaching + API caching (via Workbox) and — the reason it's
 * hand-written — the Web Push `push` and `notificationclick` events so reminders
 * appear even when no Triage tab is open.
 */
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// Injected at build time by vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.skipWaiting();
clientsClaim();

// Keep API reads fresh but usable offline.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "triage-api",
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 })],
  }),
);

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

self.addEventListener("push", (event: PushEvent) => {
  const data: PushPayload = {
    title: "Triage",
    body: "Time to check in on your work.",
    url: "/",
    tag: "triage",
  };

  if (event.data) {
    try {
      Object.assign(data, event.data.json());
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: data.tag,
      data: { url: data.url },
      // Replace an existing same-tag notification rather than stacking.
      ...( { renotify: true } as NotificationOptions ),
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string } | null)?.url ?? "/";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ("focus" in client) {
          await (client as WindowClient).navigate?.(targetUrl).catch(() => {});
          return (client as WindowClient).focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })(),
  );
});
