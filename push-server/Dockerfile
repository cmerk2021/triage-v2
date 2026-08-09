# syntax=docker/dockerfile:1

# Install dependencies on the native build platform. The deps are pure JS
# (web-push, pocketbase, dotenv), so node_modules is architecture-independent
# and can be copied into the target-arch image — this avoids emulating Node
# under QEMU for arm64, which crashes with "illegal instruction".
FROM --platform=$BUILDPLATFORM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
CMD ["node", "index.mjs"]
