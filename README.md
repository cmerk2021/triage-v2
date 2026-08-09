# Triage

> Tell Triage what's due. Triage tells you what to work on.

Triage is an intelligent academic workspace that removes the mental overhead of
deciding what to work on. Students provide facts — courses, assignments, due
dates, estimates, subtasks. Triage owns prioritization, daily planning,
recommendations, workload forecasting, and notification timing.

This is a complete rewrite that shares only the name with any prior version.

---

## What it does

- **Today** — the product. Answers "what should I work on right now?" with a
  ranked plan, each item explained in plain language (never a score).
- **Recommendation engine** — an isolated, pure module that scores work by due
  date, remaining effort, subtask progress, momentum, overdue status, workload
  pressure, and available study time.
- **Assignments** — simple facts (title, course, due date, estimate, notes,
  attachments, status) with first-class **subtasks**.
- **Courses** — name, code, professor, location, meeting schedule, color, icon.
- **Calendar** — agenda / week / month views for visualizing deadlines.
- **Search** — a keyboard-first command palette (⌘/Ctrl-K) over assignments,
  courses, notes, and professors.
- **Workload forecast** — a calm bar view of the crunch ahead.
- **Onboarding** — a device-setup-style first run that teaches Triage your
  semester before you ever see an empty screen.
- **Notifications** — a gentle morning briefing and evening study reminder.
- **PWA** — installable, responsive, mobile-first, offline-capable where
  practical.
- **Semester archive** — finish a term and clear it from active planning while
  preserving the ability to browse it later.

---

## Architecture

Feature-based, modular, strongly typed. No single monolithic file owns the app.

```
src/
  app/                 Router gate, theming, layout shell, keyboard shortcuts
  design-system/       Typography-first primitives (Button, Dialog, …) + tokens
  lib/                 PocketBase client, domain types, time & format helpers
  stores/              Zustand stores: auth, workspace data, transient UI
  features/
    auth/              Sign in / sign up
    onboarding/        Multi-step first-run wizard
    today/             Today's plan (the product)
    recommendations/   ← the engine (pure, isolated, testable)
    assignments/       List, quick add, detail editor, rows
    subtasks/          Subtask list
    courses/           Courses grid + editor + glyph
    calendar/          Agenda / week / month
    search/            Command palette
    workload/          Forecast module + chart
    notifications/     Permission, scheduling, summaries
    settings/          Preferences, semester archive, About/version
```

**Separation of concerns**

| Concern            | Owner                                            |
| ------------------ | ------------------------------------------------ |
| UI                 | `design-system/` + `features/*`                  |
| State              | `stores/` (Zustand)                              |
| Persistence        | PocketBase (`lib/pocketbase.ts`, `pb_migrations`)|
| Prioritization     | `features/recommendations/engine.ts` (pure)      |
| Notifications      | `features/notifications/`                        |

The recommendation engine has **no** knowledge of React, PocketBase, or the
DOM. It takes facts in and returns explained recommendations out, so all
prioritization lives in exactly one place.

### Backend

PocketBase stores **facts only** — business logic lives in the app. Schema is
defined as code in `pb_migrations/` and every record is owned by a user, with
access rules restricting reads/writes to the owner.

---

## Development

Requires Node 20+ and the PocketBase binary (v0.39.x).

```bash
npm install

# Terminal 1 — backend (downloads once, then reuse)
#   macOS/Linux:  ./pb/pocketbase serve --migrationsDir=pb_migrations
#   Windows:      pb\pocketbase.exe serve --migrationsDir pb_migrations
# First run prints a link to create your superuser (admin) account.

# Terminal 2 — frontend
npm run dev            # http://localhost:5173 (proxies /api to :8090)
```

The Vite dev server proxies `/api` to PocketBase on `:8090`. In production the
built SPA is served *by* PocketBase from the same origin.

---

## Versioning

Repository-based semantic versioning that does **not** rely on Git tags. The
version lives in `version.json`.

```bash
npm run version:show     # print current version
npm run version:patch    # x.y.Z
npm run version:minor     # x.Y.0
npm run version:major     # X.0.0
```

Production builds (`npm run build`) automatically increment the patch, stamp the
build number and time, and record the commit hash if Git is present. The version
is injected into the frontend at build time (`__APP_VERSION__`), shown in
**Settings → About**, and embedded into the Docker image metadata.

---

## Deployment

Triage runs as two services wired together by
[`docker-compose.yml`](docker-compose.yml):

| Service        | Image                          | Role                                              |
| -------------- | ------------------------------ | ------------------------------------------------- |
| `triage`       | `ghcr.io/cmerk2021/triage`      | PocketBase + SPA + migrations + hooks (one port)  |
| `triage-push`  | `ghcr.io/cmerk2021/triage-push` | Web Push worker for scheduled study reminders     |

Both are published as **multi-arch prebuilt images** (`linux/amd64` +
`linux/arm64`) to the GitHub Container Registry on every push to `main` and
every `v*` tag, via
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml).

### Deploy from prebuilt images (recommended)

You only need **two files on the server**: `docker-compose.yml` and a `.env`.
No git checkout, no build step.

**1. Generate VAPID keys** (one time — enables Web Push). With Node installed:

```bash
npx web-push generate-vapid-keys
```

This prints a `Public Key` and a `Private Key`. Keep the private key secret.

**2. Create the `.env`** next to `docker-compose.yml`:

```dotenv
# ── Web Push (required for reminders that fire when the app is closed) ──
VAPID_PUBLIC_KEY=<public key from step 1>     # served to browsers by the app
VAPID_PRIVATE_KEY=<private key from step 1>   # used only by the push worker
VAPID_SUBJECT=mailto:you@example.com          # a contact URL you own

# ── PocketBase superuser the push worker signs in as (set in step 4) ──
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=a-long-random-password

# ── Optional ──
# TRIAGE_IMAGE=ghcr.io/cmerk2021/triage:latest
# TRIAGE_PUSH_IMAGE=ghcr.io/cmerk2021/triage-push:latest
# POLL_INTERVAL_MS=60000                       # how often the worker checks (ms)
```

> Push notifications require **HTTPS** in production (put the app behind a
> reverse proxy / TLS). `localhost` is exempt, so plain HTTP is fine for testing.

**3. Pull and start:**

```bash
docker compose pull
docker compose up -d
```

Open the app on port `8090`.

**4. Create the superuser** the worker authenticates with (must match
`PB_ADMIN_*` in your `.env`):

```bash
docker compose exec triage /pb/pocketbase superuser upsert \
  "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD"
```

Then restart the worker so it picks up the account: `docker compose restart triage-push`.
Students just sign up in the app; enable reminders under **Settings → App &
notifications**.

### App only (no push)

If you don't want reminders, run just the app image — nothing else to configure:

```bash
docker run -d -p 8090:8090 -v triage_data:/pb/pb_data \
  ghcr.io/cmerk2021/triage:latest
```

Data persists in the `triage_data` volume either way.

### Build from source (development)

From a checkout, build and run everything locally instead of pulling:

```bash
docker compose up --build
```

The compose `build:` blocks are the fallback used here; the published images are
ignored when you pass `--build`. See
[`push-server/README.md`](push-server/README.md) for running the worker outside
Docker.


---

## Product principles

- When uncertain, choose the option that requires the student to make **fewer
  decisions**.
- Calm, fast, typographic. 150–200ms transitions. Nothing bounces.
- Every recommendation explains **why**; the score is never exposed.
- Build 12 exceptional features, not 40 average ones.
