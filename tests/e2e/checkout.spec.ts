import { test, expect } from "@playwright/test";

/**
 * Checkout flow tests — requires authenticated customer session.
 */

test.describe("Checkout — Access Control", () => {
  test("should redirect unauthenticated user to sign-in", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});

test.describe("Checkout — Authenticated Flow", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should load checkout page for authenticated user", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("heading", { name: /checkout/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("should display checkout content", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Checkout — Order Success Page", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should load order success page", async ({ page }) => {
    await page.goto("/checkout/order-success");
    await page.waitForLoadState("domcontentloaded");

    // The page shows "Order Placed Successfully!" heading
    await expect(
      page.getByRole("heading", { name: /order placed successfully/i })
    ).toBeVisible({ timeout: 15_000 });
  });
});
