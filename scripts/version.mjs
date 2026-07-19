#!/usr/bin/env node
/**
 * Repository-based semantic versioning for Triage.
 *
 * Does NOT depend on Git tags. The version lives in `version.json`.
 *
 *   node scripts/version.mjs show     Print current version
 *   node scripts/version.mjs patch    Bump patch (x.y.Z)
 *   node scripts/version.mjs minor    Bump minor (x.Y.0)
 *   node scripts/version.mjs major    Bump major (X.0.0)
 *   node scripts/version.mjs build    Increment build number + patch, stamp time
 *
 * The `build` command is intended for production builds: it increments the
 * patch automatically and records the build number and time so every release
 * artifact is uniquely identifiable.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const versionFile = resolve(__dirname, "..", "version.json");

function readVersion() {
  return JSON.parse(readFileSync(versionFile, "utf-8"));
}

function writeVersion(data) {
  writeFileSync(versionFile, JSON.stringify(data, null, 2) + "\n");
}

function parse(version) {
  const [major, minor, patch] = version.split(".").map((n) => parseInt(n, 10));
  return { major, minor, patch };
}

function tryReadCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function bump(kind) {
  const data = readVersion();
  const { major, minor, patch } = parse(data.version);

  switch (kind) {
    case "major":
      data.version = `${major + 1}.0.0`;
      break;
    case "minor":
      data.version = `${major}.${minor + 1}.0`;
      break;
    case "patch":
      data.version = `${major}.${minor}.${patch + 1}`;
      break;
    case "build":
      data.version = `${major}.${minor}.${patch + 1}`;
      data.buildNumber = (data.buildNumber ?? 0) + 1;
      data.buildTime = new Date().toISOString();
      data.commit = tryReadCommit();
      break;
    default:
      throw new Error(`Unknown bump kind: ${kind}`);
  }

  writeVersion(data);
  return data;
}

const command = process.argv[2] ?? "show";

if (command === "show") {
  const data = readVersion();
  console.log(data.version);
  process.exit(0);
}

if (!["major", "minor", "patch", "build"].includes(command)) {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: node scripts/version.mjs [show|patch|minor|major|build]");
  process.exit(1);
}

const result = bump(command);
console.log(
  `Triage version -> ${result.version}` +
    (command === "build" ? ` (build ${result.buildNumber})` : ""),
);
