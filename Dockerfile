# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Stage 1 — Build the frontend
#
# Pinned to the native build platform ($BUILDPLATFORM): the output is a static
# `dist` bundle that's architecture-independent, so we avoid emulating Node
# under QEMU for arm64 (which crashes V8 with "illegal instruction").
# ─────────────────────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
# Use the CI build so container builds are reproducible and do not
# auto-increment the version file inside the image.
RUN npm run build:ci

# ─────────────────────────────────────────────────────────────
# Stage 2 — Runtime: PocketBase serving API + static SPA
# ─────────────────────────────────────────────────────────────
FROM alpine:3.20 AS runtime

ARG PB_VERSION=0.39.8
ARG APP_VERSION=0.0.0

LABEL org.opencontainers.image.title="Triage" \
      org.opencontainers.image.description="Tell Triage what's due. Triage tells you what to work on." \
      org.opencontainers.image.version="${APP_VERSION}"

ENV TRIAGE_VERSION=${APP_VERSION}

RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /pb

# Download the PocketBase binary for the target architecture.
RUN ARCH="$(uname -m)"; \
    case "$ARCH" in \
      x86_64) PB_ARCH="amd64" ;; \
      aarch64) PB_ARCH="arm64" ;; \
      *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
    esac; \
    wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" -O /tmp/pb.zip; \
    unzip /tmp/pb.zip -d /pb; \
    rm /tmp/pb.zip; \
    chmod +x /pb/pocketbase

# Database migrations (schema-as-code) and static frontend.
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY --from=frontend /app/dist /pb/pb_public
COPY version.json /pb/version.json

EXPOSE 8090
VOLUME ["/pb/pb_data"]

# PocketBase serves the SPA from pb_public with index fallback and the
# REST API from /api on the same port. One process, one container.
ENTRYPOINT ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--publicDir=/pb/pb_public", "--migrationsDir=/pb/pb_migrations", "--hooksDir=/pb/pb_hooks"]
