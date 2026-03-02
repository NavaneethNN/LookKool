import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Auth setup — creates authenticated storage states for reuse across tests.
 *
 * Environment variables required:
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD       — regular customer account
 *   TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD     — admin account
 */

// Auth setup can be slow due to server compilation + auth round-trip
setup.setTimeout(60_000);

const customerStoragePath = path.resolve(
  __dirname,
  "../.auth/customer-storage.json"
);
const adminStoragePath = path.resolve(
  __dirname,
  "../.auth/admin-storage.json"
);

setup("authenticate as customer", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      "Skipping customer auth setup: TEST_USER_EMAIL / TEST_USER_PASSWORD not set"
    );
    return;
  }

  await page.goto("/sign-in", { timeout: 30_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to homepage after successful login
  await page.waitForURL("/", { timeout: 30_000 });
  await expect(page).toHaveURL("/");

  await page.context().storageState({ path: customerStoragePath });
});

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "Skipping admin auth setup: TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set"
    );
    return;
  }

  await page.goto("/sign-in", { timeout: 30_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL("/", { timeout: 30_000 });
  await expect(page).toHaveURL("/");

  await page.context().storageState({ path: adminStoragePath });
});
