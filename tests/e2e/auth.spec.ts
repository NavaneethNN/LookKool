import { test, expect } from "@playwright/test";

test.describe("Authentication — Sign In", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("should display sign-in page with all elements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(
      page.getByText("Welcome back! Sign in to your account.")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" })
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" })
    ).toBeVisible();
  });

  test("should show email & password tab and magic link tab", async ({
    page,
  }) => {
    await expect(page.getByText("Email & Password")).toBeVisible();
    await expect(page.getByText("Magic Link")).toBeVisible();
  });

  test("should switch to magic link tab", async ({ page }) => {
    await page.getByText("Magic Link").click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Magic Link" })
    ).toBeVisible();
    // Password field should not be visible
    await expect(page.getByLabel("Password")).not.toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Wait for error message
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10_000 });
  });

  test("should require email field", async ({ page }) => {
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("should require password field", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: "Sign In" }).click();

    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toHaveAttribute("required", "");
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click eye icon to show password
    await page
      .locator("#password")
      .locator("..")
      .locator("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    await page
      .locator("#password")
      .locator("..")
      .locator("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should have forgot password link", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: "Forgot password?" });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password");
  });

  test("should have sign up link", async ({ page }) => {
    const signUpLink = page.getByRole("link", { name: "Sign up" });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", "/sign-up");
  });

  test("should navigate to sign-up page", async ({ page }) => {
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/sign-up", { timeout: 15_000 });
  });

  test("should navigate to forgot-password page", async ({ page }) => {
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL("/forgot-password", { timeout: 15_000 });
  });

  test("should disable sign-in button while loading", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    const signInBtn = page.getByRole("button", { name: "Sign In" });
    await signInBtn.click();

    // Button should be disabled while loading
    await expect(signInBtn).toBeDisabled();
  });
});

test.describe("Authentication — Sign Up", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-up");
  });

  test("should display sign-up page with all elements", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Create Account" })
    ).toBeVisible();
    await expect(page.getByText("Sign up to get started.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" })
    ).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Account" })
    ).toBeVisible();
  });

  test("should show validation for short name", async ({ page }) => {
    await page.getByLabel("Full Name").fill("A");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".bg-red-50")).toContainText(
      "Name must be at least 2 characters"
    );
  });

  test("should show validation for short password", async ({ page }) => {
    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".bg-red-50")).toContainText(
      "Password must be at least 8 characters"
    );
  });

  test("should have sign-in link", async ({ page }) => {
    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/sign-in");
  });

  test("should toggle password visibility", async ({ page }) => {
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    await page
      .locator("#password")
      .locator("..")
      .locator("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("should show password hint text", async ({ page }) => {
    await expect(page.getByText("At least 8 characters")).toBeVisible();
  });

  test("should require all fields", async ({ page }) => {
    await expect(page.getByLabel("Full Name")).toHaveAttribute("required", "");
    await expect(page.getByLabel("Email")).toHaveAttribute("required", "");
    await expect(page.locator("#password")).toHaveAttribute("required", "");
  });
});

test.describe("Authentication — Forgot Password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("should display forgot password page", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Reset Link" })
    ).toBeVisible();
  });

  test("should have back to sign-in link", async ({ page }) => {
    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/sign-in");
  });

  test("should require email field", async ({ page }) => {
    await expect(page.getByLabel("Email")).toHaveAttribute("required", "");
  });
});

test.describe("Authentication — Protected Routes", () => {
  test("should redirect unauthenticated user from /account to /sign-in", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test("should redirect unauthenticated user from /checkout to /sign-in", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test("should redirect unauthenticated user from /studio to /sign-in", async ({
    page,
  }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test("should redirect unauthenticated user from /account/orders to /sign-in", async ({
    page,
  }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test("should redirect unauthenticated user from /account/addresses to /sign-in", async ({
    page,
  }) => {
    await page.goto("/account/addresses");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});

test.describe("Authentication — Redirect Signed-In Users", () => {
  test.use({
    storageState: "tests/.auth/customer-storage.json",
  });

  test("should redirect signed-in user from /sign-in to /", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL("/", { timeout: 15_000 });
  });

  test("should redirect signed-in user from /sign-up to /", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL("/", { timeout: 15_000 });
  });
});
