/**
 * One-time VAPID keypair generator.
 *
 *   npm run generate-vapid
 *
 * Copy the printed values into your environment (VAPID_PUBLIC_KEY on both
 * PocketBase and the worker; VAPID_PRIVATE_KEY on the worker only).
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
