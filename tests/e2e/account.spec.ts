import { test, expect } from "@playwright/test";

/**
 * Account management tests — requires authenticated customer session.
 * Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars to enable.
 */

test.describe("Account Hub", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should display account page with user info", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    // Should show user avatar area
    await expect(page.locator("main")).toBeVisible();
  });

  test("should display quick links", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("My Orders")).toBeVisible();
    await expect(page.getByText("Wishlist")).toBeVisible();
    await expect(page.getByText("Saved Addresses")).toBeVisible();
    await expect(page.getByText("Edit Profile")).toBeVisible();
  });

  test("should have sign out button", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible();
  });

  test("should navigate to orders page", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    await page.getByText("My Orders").click();
    await expect(page).toHaveURL("/account/orders", { timeout: 15_000 });
  });

  test("should navigate to addresses page", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    await page.getByText("Saved Addresses").click();
    await expect(page).toHaveURL("/account/addresses", { timeout: 15_000 });
  });

  test("should navigate to profile page", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    await page.getByText("Edit Profile").click();
    await expect(page).toHaveURL("/account/profile", { timeout: 15_000 });
  });
});

test.describe("Profile Page", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should display profile form with pre-filled data", async ({
    page,
  }) => {
    await page.goto("/account/profile");

    // Wait for client-side data loading to complete (form appears after useEffect)
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 15_000 });
    await expect(emailInput).toBeDisabled();

    // Name field should be editable
    const nameInput = page.locator("#name");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
  });

  test("should display phone number field", async ({ page }) => {
    await page.goto("/account/profile");

    // Wait for client-side data loading to complete
    const phoneInput = page.locator("#phone");
    await expect(phoneInput).toBeVisible({ timeout: 15_000 });
    await expect(phoneInput).toBeEnabled();
  });

  test("should have save changes button", async ({ page }) => {
    await page.goto("/account/profile");

    await expect(
      page.getByRole("button", { name: "Save Changes" })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("should have back to account link", async ({ page }) => {
    await page.goto("/account/profile");

    // Wait for page to finish loading
    await expect(page.locator("#email")).toBeVisible({ timeout: 15_000 });

    const backLink = page.getByRole("link", { name: /back to account/i });
    await expect(backLink).toBeVisible();
  });

  test("should allow editing name field", async ({ page }) => {
    await page.goto("/account/profile");

    // Wait for client-side data loading
    const nameInput = page.locator("#name");
    await expect(nameInput).toBeVisible({ timeout: 15_000 });

    await nameInput.clear();
    await nameInput.fill("Updated Test Name");
    await expect(nameInput).toHaveValue("Updated Test Name");
  });
});

test.describe("Addresses Page", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should display addresses page", async ({ page }) => {
    await page.goto("/account/addresses");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
  });

  test("should have add address button", async ({ page }) => {
    await page.goto("/account/addresses");
    await page.waitForLoadState("networkidle");

    // Either "Add Address" or "Add Your First Address" should be visible
    const addBtn = page.getByRole("button", { name: /add/i });
    await expect(addBtn.first()).toBeVisible({ timeout: 15_000 });
  });

  test("should open address form when clicking add", async ({ page }) => {
    await page.goto("/account/addresses");
    await page.waitForLoadState("networkidle");

    const addBtn = page.getByRole("button", { name: /add/i });
    await expect(addBtn.first()).toBeVisible({ timeout: 15_000 });
    await addBtn.first().click();

    // Form fields should appear
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Orders Page", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should display orders page", async ({ page }) => {
    await page.goto("/account/orders");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
  });

  test("should show empty state or order list", async ({ page }) => {
    await page.goto("/account/orders");

    // Wait for client-side data loading to complete (page uses useEffect)
    // Either order links or "No orders yet" text should appear
    await expect(
      page.locator("a[href*='/account/orders/']").first().or(page.getByText(/no orders/i))
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Wishlist Page", () => {
  test.use({ storageState: "tests/.auth/customer-storage.json" });

  test("should display wishlist page", async ({ page }) => {
    await page.goto("/wishlist");

    await expect(
      page.getByRole("heading", { name: /wishlist/i })
    ).toBeVisible({ timeout: 15_000 });
  });
});
