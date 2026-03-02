import { test, expect } from "@playwright/test";

/**
 * Admin dashboard tests — requires authenticated admin session.
 * Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars to enable.
 */

test.describe("Admin Dashboard", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });

  // Dashboard fetches heavy data (stats, orders, chart) — allow extra time
  test.setTimeout(60_000);

  test("should load studio dashboard", async ({ page }) => {
    await page.goto("/studio", { timeout: 45_000 });
    await page.waitForLoadState("domcontentloaded");

    // Dashboard should display stat cards
    await expect(page.locator("main")).toBeVisible();
  });

  test("should display stat cards", async ({ page }) => {
    await page.goto("/studio", { timeout: 45_000 });
    await page.waitForLoadState("domcontentloaded");

    // Stat cards: Revenue, Orders, Customers, Products
    await expect(page.getByText(/total revenue/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/total orders/i)).toBeVisible();
    await expect(page.getByText(/total customers/i)).toBeVisible();
    await expect(page.getByText(/total products/i)).toBeVisible();
  });

  test("should display alert cards", async ({ page }) => {
    await page.goto("/studio", { timeout: 45_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/pending orders/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/pending returns/i)).toBeVisible();
    await expect(page.getByText(/total reviews/i)).toBeVisible();
  });

  test("should display recent orders table", async ({ page }) => {
    await page.goto("/studio", { timeout: 45_000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for dashboard to fully load
    await expect(page.getByText(/total revenue/i)).toBeVisible({ timeout: 30_000 });

    // Check for table headers
    const tableHeaders = page.locator("th");
    await expect(tableHeaders.first()).toBeVisible();
  });

  test("should have sidebar navigation", async ({ page }) => {
    await page.goto("/studio", { timeout: 45_000 });
    await page.waitForLoadState("domcontentloaded");

    // Sidebar should be visible on desktop
    await expect(page.locator("aside").first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Admin — Products Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load products listing page", async ({ page }) => {
    await page.goto("/studio/products", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Products")).toBeVisible({ timeout: 15_000 });
  });

  test("should have add product button", async ({ page }) => {
    await page.goto("/studio/products", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("link", { name: /add product/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("should navigate to new product page", async ({ page }) => {
    await page.goto("/studio/products", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByRole("link", { name: /add product/i })
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: /add product/i }).click();
    await expect(page).toHaveURL("/studio/products/new", { timeout: 15_000 });
  });

  test("should load new product form", async ({ page }) => {
    await page.goto("/studio/products/new", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });
  });

  test("should support product search filter", async ({ page }) => {
    await page.goto("/studio/products?search=test", { timeout: 30_000 });
    await expect(page).toHaveURL(/search=test/);
    await page.waitForLoadState("domcontentloaded");
  });

  test("should support status filter", async ({ page }) => {
    await page.goto("/studio/products?status=active", { timeout: 30_000 });
    await expect(page).toHaveURL(/status=active/);
    await page.waitForLoadState("domcontentloaded");
  });
});

test.describe("Admin — Orders Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load orders listing page", async ({ page }) => {
    await page.goto("/studio/orders", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });

  test("should display status filter chips", async ({ page }) => {
    await page.goto("/studio/orders", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    // Status filter options
    await expect(page.getByText("Pending")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Processing")).toBeVisible();
    await expect(page.getByText("Delivered")).toBeVisible();
  });

  test("should filter orders by pending status", async ({ page }) => {
    await page.goto("/studio/orders?status=Pending", { timeout: 30_000 });
    await expect(page).toHaveURL(/status=Pending/);
    await page.waitForLoadState("domcontentloaded");
  });

  test("should filter orders by delivered status", async ({ page }) => {
    await page.goto("/studio/orders?status=Delivered", { timeout: 30_000 });
    await expect(page).toHaveURL(/status=Delivered/);
    await page.waitForLoadState("domcontentloaded");
  });
});

test.describe("Admin — Customers Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load customers page", async ({ page }) => {
    await page.goto("/studio/customers", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Coupons Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load coupons page", async ({ page }) => {
    await page.goto("/studio/coupons", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Categories Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load categories page", async ({ page }) => {
    await page.goto("/studio/categories", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Billing / POS", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load billing page", async ({ page }) => {
    await page.goto("/studio/billing", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Inventory Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load inventory page", async ({ page }) => {
    await page.goto("/studio/inventory", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Reviews Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load reviews page", async ({ page }) => {
    await page.goto("/studio/reviews", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Returns Management", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load returns page", async ({ page }) => {
    await page.goto("/studio/returns", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Reports", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load reports page", async ({ page }) => {
    await page.goto("/studio/reports", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Settings", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load settings page", async ({ page }) => {
    await page.goto("/studio/settings", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Suppliers", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load suppliers page", async ({ page }) => {
    await page.goto("/studio/suppliers", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Purchases", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load purchases page", async ({ page }) => {
    await page.goto("/studio/purchases", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Barcode", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load barcode page", async ({ page }) => {
    await page.goto("/studio/barcode", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Backup", () => {
  test.use({ storageState: "tests/.auth/admin-storage.json" });
  test.setTimeout(60_000);

  test("should load backup page", async ({ page }) => {
    await page.goto("/studio/backup", { timeout: 30_000 });
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Admin — Access Control", () => {
  test("should redirect non-authenticated user from studio", async ({
    page,
  }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test("should redirect non-authenticated user from studio subpages", async ({
    page,
  }) => {
    await page.goto("/studio/products");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});
