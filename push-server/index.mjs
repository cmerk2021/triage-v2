/**
 * Triage push worker.
 *
 * Polls PocketBase for enabled push subscriptions and, for each one, sends the
 * morning briefing, evening reminder and study-window nudges at the right local
 * time — even when no Triage tab is open. This is the piece a PocketBase JS hook
 * cannot be: Web Push requires ES256 (VAPID) signing that PocketBase's JSVM
 * doesn't expose, so we use the `web-push` library here instead.
 */
import "dotenv/config";
import PocketBase from "pocketbase";
import webpush from "web-push";
import { buildMessage, decideSends, localParts, summarize } from "./scheduler.mjs";

const {
  PB_URL = "http://127.0.0.1:8090",
  PB_ADMIN_EMAIL,
  PB_ADMIN_PASSWORD,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT = "mailto:admin@example.com",
  POLL_INTERVAL_MS = "60000",
} = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("[triage-push] Missing VAPID keys. Run `npm run generate-vapid`.");
  process.exit(1);
}
if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error("[triage-push] Missing PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD.");
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function ensureAuth() {
  if (pb.authStore.isValid) return;
  await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

async function summaryFor(ownerId, cache) {
  if (cache.has(ownerId)) return cache.get(ownerId);
  const list = await pb.collection("assignments").getFullList({
    filter: pb.filter('owner = {:o} && status != "done" && archived = false', {
      o: ownerId,
    }),
    fields: "title,dueDate",
    batch: 500,
  });
  const summary = summarize(list);
  cache.set(ownerId, summary);
  return summary;
}

async function processSubscription(record, prefs, cache) {
  const parts = localParts(new Date(), record.timezone || "UTC");
  const sends = decideSends(prefs, parts, record);
  if (sends.length === 0) return;

  const summary = await summaryFor(record.owner, cache);
  const subscription = {
    endpoint: record.endpoint,
    keys: { p256dh: record.p256dh, auth: record.auth },
  };

  const patch = {};
  for (const send of sends) {
    const msg = buildMessage(send.kind, summary);
    const payload = JSON.stringify({
      title: msg.title,
      body: msg.body,
      url: "/",
      tag: `triage-${send.kind}`,
    });
    try {
      await webpush.sendNotification(subscription, payload, {
        TTL: 3600,
        urgency: "normal",
      });
      Object.assign(patch, send.patch, { lastError: "" });
      console.log(`[triage-push] sent ${send.kind} to ${record.id}`);
    } catch (err) {
      const code = err?.statusCode;
      if (code === 404 || code === 410) {
        // Subscription is gone — stop targeting it.
        await pb
          .collection("push_subscriptions")
          .update(record.id, { enabled: false, lastError: "expired" })
          .catch(() => {});
        return;
      }
      patch.lastError = String(err?.body || err?.message || err).slice(0, 500);
      console.error(`[triage-push] send error for ${record.id}:`, patch.lastError);
    }
  }

  if (Object.keys(patch).length) {
    await pb.collection("push_subscriptions").update(record.id, patch).catch(() => {});
  }
}

async function tick() {
  await ensureAuth();
  const subs = await pb.collection("push_subscriptions").getFullList({
    filter: "enabled = true",
    expand: "owner",
    batch: 500,
  });

  const cache = new Map();
  for (const record of subs) {
    // Enablement is per-device (the subscription's `enabled` flag, already
    // filtered above). Preferences supply the per-user schedule/timezone.
    const prefs = record.expand?.owner?.preferences;
    if (!prefs) continue;
    await processSubscription(record, prefs, cache).catch((e) =>
      console.error("[triage-push] failed", record.id, e?.message || e),
    );
  }
}

async function main() {
  console.log(
    `[triage-push] starting — polling ${PB_URL} every ${POLL_INTERVAL_MS}ms`,
  );
  const run = async () => {
    try {
      await tick();
    } catch (e) {
      pb.authStore.clear(); // force re-auth next tick
      console.error("[triage-push] tick error:", e?.message || e);
    }
  };
  await run();
  setInterval(run, Number(POLL_INTERVAL_MS));
}

main();
