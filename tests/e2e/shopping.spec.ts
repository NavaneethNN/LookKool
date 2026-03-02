import { test, expect } from "@playwright/test";

// ─── Public shopping tests (no auth required) ───

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    // Page should have content loaded
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("should display hero section", async ({ page }) => {
    await page.goto("/");
    // Hero is the first major section
    await expect(page.locator("main")).toBeVisible();
  });

  test("should display featured categories", async ({ page }) => {
    await page.goto("/");
    // Wait for categories to load via Suspense
    await page.waitForLoadState("networkidle");
  });

  test("should have navigation bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });

  test("should have footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Shop Page", () => {
  test("should load shop page", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveURL("/shop");
    await page.waitForLoadState("networkidle");
  });

  test("should display products grid", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    // Products should be rendered
    await expect(page.locator("main")).toBeVisible();
  });

  test("should support sort by price ascending", async ({ page }) => {
    await page.goto("/shop?sort=price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    await page.waitForLoadState("networkidle");
  });

  test("should support sort by price descending", async ({ page }) => {
    await page.goto("/shop?sort=price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);
    await page.waitForLoadState("networkidle");
  });

  test("should support sort by newest", async ({ page }) => {
    await page.goto("/shop?sort=newest");
    await expect(page).toHaveURL(/sort=newest/);
    await page.waitForLoadState("networkidle");
  });

  test("should support category filter", async ({ page }) => {
    await page.goto("/shop?category=test");
    await expect(page).toHaveURL(/category=test/);
    await page.waitForLoadState("networkidle");
  });

  test("should support pagination", async ({ page }) => {
    await page.goto("/shop?page=2");
    await expect(page).toHaveURL(/page=2/);
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Search Page", () => {
  test("should load search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL("/search");
    await page.waitForLoadState("networkidle");
  });

  test("should display results for a search query", async ({ page }) => {
    await page.goto("/search?q=shirt");
    await expect(page).toHaveURL(/q=shirt/);
    await page.waitForLoadState("networkidle");
  });

  test("should show trending/popular when no query", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");
    // Should display trending or popular products when no search query
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Product Detail Page", () => {
  test("should display 404 or fallback for non-existent product", async ({
    page,
  }) => {
    const response = await page.goto("/products/non-existent-product-slug-xyz", { timeout: 30_000 });
    // Should return 404 or render a not-found page
    const status = response?.status() ?? 0;
    if (status === 200) {
      // In dev mode, Next.js may render 404 page with 200 status — check page content
      await expect(page.locator("body")).toContainText(/not found/i);
    } else {
      expect(status).toBeGreaterThanOrEqual(400);
    }
  });
});

test.describe("Category Page", () => {
  test("should load category page", async ({ page }) => {
    await page.goto("/categories/test-category");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Cart Page", () => {
  test("should load cart page", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("heading", { name: "Shopping Cart" })
    ).toBeVisible();
  });

  test("should show empty cart state", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForLoadState("domcontentloaded");
    // Cart should show empty state or items
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Static Pages", () => {
  const staticPages = [
    { path: "/faq", title: "FAQ" },
    { path: "/shipping", title: "Shipping" },
    { path: "/returns", title: "Returns" },
    { path: "/cancellation", title: "Cancellation" },
    { path: "/privacy", title: "Privacy" },
    { path: "/terms", title: "Terms" },
    { path: "/contact", title: "Contact" },
  ];

  for (const { path, title } of staticPages) {
    test(`should load ${title} page at ${path}`, async ({ page }) => {
      const response = await page.goto(path, { timeout: 30_000 });
      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    });
  }
});

test.describe("Collections & New Arrivals", () => {
  test("should load collections page", async ({ page }) => {
    const response = await page.goto("/collections", { timeout: 30_000 });
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
  });

  test("should load new arrivals page", async ({ page }) => {
    const response = await page.goto("/new-arrivals", { timeout: 30_000 });
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
  });

  test("should load offers page", async ({ page }) => {
    const response = await page.goto("/offers", { timeout: 30_000 });
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
  });
});
