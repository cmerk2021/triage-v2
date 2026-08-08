/// <reference path="../pb_data/types.d.ts" />

/**
 * Exposes the VAPID public key to the frontend so browsers can subscribe to
 * Web Push. The key is public by design; the matching private key lives only
 * in the push worker's environment (see /push-server).
 *
 * Configure with the VAPID_PUBLIC_KEY environment variable on the PocketBase
 * process. Returns an empty string when unset (the UI then hides push).
 */
routerAdd("GET", "/api/push/config", (e) => {
  return e.json(200, {
    publicKey: $os.getenv("VAPID_PUBLIC_KEY") || "",
  });
});
