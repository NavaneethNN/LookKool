import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.local so TEST_USER_EMAIL, TEST_ADMIN_EMAIL etc. are available
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Auth setup — runs first, saves storage state for authenticated tests
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Desktop Chrome
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["auth-setup"],
    },

    // Mobile Chrome
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      dependencies: ["auth-setup"],
    },

    // Desktop Firefox
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["auth-setup"],
    },

    // Tablet
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"] },
      dependencies: ["auth-setup"],
    },
  ],

  // Start dev server automatically if not running
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
