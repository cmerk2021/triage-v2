/// <reference path="../pb_data/types.d.ts" />

/**
 * Triage — Web Push subscriptions.
 *
 * Stores each browser's Push API endpoint so the standalone push worker
 * (see /push-server) can deliver study reminders even when the app is closed.
 * One row per browser/device; ownership is scoped to the subscribing user.
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id";
    const createRule =
      "@request.auth.id != '' && @request.body.owner = @request.auth.id";

    const subscriptions = new Collection({
      type: "base",
      name: "push_subscriptions",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      indexes: [
        "CREATE UNIQUE INDEX idx_push_endpoint ON push_subscriptions (endpoint)",
      ],
      fields: [
        {
          name: "owner",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { name: "endpoint", type: "text", required: true, max: 2000 },
        { name: "p256dh", type: "text", required: true, max: 400 },
        { name: "auth", type: "text", required: true, max: 400 },
        { name: "userAgent", type: "text", max: 500 },
        { name: "platform", type: "text", max: 40 },
        { name: "timezone", type: "text", max: 80 },
        { name: "enabled", type: "bool" },
        // Per-day de-duplication bookkeeping owned by the push worker.
        { name: "lastMorning", type: "text", max: 20 },
        { name: "lastEvening", type: "text", max: 20 },
        { name: "lastStudyKey", type: "text", max: 60 },
        { name: "lastError", type: "text", max: 500 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(subscriptions);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("push_subscriptions"));
    } catch (_) {
      // already removed
    }
  },
);
