import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { readFileSync } from "node:fs";

const version = JSON.parse(
  readFileSync(path.resolve(__dirname, "version.json"), "utf-8"),
) as { version: string; buildNumber: number; buildTime: string | null };

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Custom service worker (src/sw.ts) so we can handle Web Push events.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "icon-maskable.svg"],
      manifest: {
        id: "/",
        name: "Triage — your academic workspace",
        short_name: "Triage",
        description: "Tell Triage what's due. Triage tells you what to work on.",
        lang: "en",
        theme_color: "#0b0b0f",
        background_color: "#0b0b0f",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["education", "productivity"],
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          { name: "Today", short_name: "Today", url: "/" },
          { name: "Assignments", short_name: "Work", url: "/assignments" },
          { name: "Calendar", short_name: "Calendar", url: "/calendar" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version.version),
    __APP_BUILD__: JSON.stringify(version.buildNumber),
    __APP_BUILD_TIME__: JSON.stringify(version.buildTime),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8090",
      "/_": "http://127.0.0.1:8090",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
