# Triage push worker

Sends Web Push study reminders (morning briefing, evening reminder and
study-window nudges) so they arrive even when Triage is closed — the whole
point of the PWA on phones and Chromebooks.

## Why a separate service?

Web Push requires signing a VAPID JWT with **ES256** and encrypting the payload
per RFC 8291. PocketBase's JavaScript hook runtime (goja) doesn't expose those
crypto primitives, so the sender runs here as a tiny Node worker using the
[`web-push`](https://github.com/web-push-libs/web-push) library. PocketBase only
serves the **public** key (see `pb_hooks/push.pb.js`).

## Setup

1. Generate a VAPID keypair (run once, keep the private key secret):

   ```sh
   npm install
   npm run generate-vapid
   ```

2. Set the printed values as environment variables:
   - `VAPID_PUBLIC_KEY` — on **both** PocketBase and this worker.
   - `VAPID_PRIVATE_KEY` — on this worker only.
   - `VAPID_SUBJECT` — a `mailto:` you own.

3. Create a PocketBase superuser for the worker to read subscriptions:

   ```sh
   pocketbase superuser create admin@example.com "a-strong-password"
   ```

   Put those in `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`.

4. Point `PB_URL` at your PocketBase instance and start it:

   ```sh
   cp .env.example .env   # fill in the values
   npm start
   ```

With `docker compose up` the worker is wired up automatically; supply the
variables via a root `.env` file (see `docker-compose.yml`).
