import { defineConfig } from "@playwright/test";
import fs from "node:fs";

const candidates = [
  process.env.CHROME,
  "/home/fluidframe/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome",
  "/home/fluidframe/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
  "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome",
].filter((p): p is string => !!p && fs.existsSync(p));

const extraLibs = [
  "/home/fluidframe/.local/pw-libs/usr/lib/x86_64-linux-gnu",
  "/home/fluidframe/.local/pw-root/usr/lib/x86_64-linux-gnu",
].filter((dir) => fs.existsSync(dir));
const libraryPath = [...extraLibs, process.env.LD_LIBRARY_PATH || ""].filter(Boolean).join(":");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    launchOptions: {
      ...(candidates[0] ? { executablePath: candidates[0] } : {}),
      env: { ...process.env, LD_LIBRARY_PATH: libraryPath },
    },
  },
  webServer: {
    command: "npx astro preview --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321/",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
