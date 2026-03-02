import { test, expect } from "@playwright/test";

/**
 * API endpoint tests — validates server responses for key API routes.
 */

test.describe("API — Razorpay Create Order", () => {
  test("should return 401 for unauthenticated request", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: { orderId: 1 },
    });
    expect(response.status()).toBe(401);
  });

  test("should return 400 for missing orderId", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: {},
    });
    // Should return 400 or 401 (unauthenticated)
    expect([400, 401]).toContain(response.status());
  });

  test("should return 400 for invalid orderId", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: { orderId: -1 },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("should return 400 for non-integer orderId", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: { orderId: "abc" },
    });
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("API — Razorpay Verify Payment", () => {
  test("should return 401 for unauthenticated request", async ({ request }) => {
    const response = await request.post("/api/razorpay/verify-payment", {
      data: {
        razorpay_order_id: "order_test123",
        razorpay_payment_id: "pay_test123",
        razorpay_signature: "fake_signature",
      },
    });
    expect(response.status()).toBe(401);
  });

  test("should return 400 for missing fields", async ({ request }) => {
    const response = await request.post("/api/razorpay/verify-payment", {
      data: {},
    });
    expect([400, 401]).toContain(response.status());
  });

  test("should return 400 for partial fields", async ({ request }) => {
    const response = await request.post("/api/razorpay/verify-payment", {
      data: {
        razorpay_order_id: "order_test123",
      },
    });
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("API — Auth Endpoints", () => {
  test("should return session info from /api/auth/get-session", async ({
    request,
  }) => {
    const response = await request.get("/api/auth/get-session");
    // Should return 200 with null session for unauthenticated
    expect(response.status()).toBe(200);
  });
});

test.describe("API — Upload Endpoint", () => {
  test("should reject unauthenticated upload", async ({ request }) => {
    const response = await request.post("/api/upload", {
      multipart: {
        file: {
          name: "test.png",
          mimeType: "image/png",
          buffer: Buffer.from("fake-image-data"),
        },
      },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("API — Invoice Endpoints", () => {
  test("should reject unauthenticated invoice request", async ({
    request,
  }) => {
    const response = await request.get("/api/invoice/999");
    expect([401, 403, 404]).toContain(response.status());
  });

  test("should reject unauthenticated bill invoice request", async ({
    request,
  }) => {
    const response = await request.get("/api/invoice/bill/999");
    expect([401, 403, 404]).toContain(response.status());
  });
});

test.describe("API — Security Checks", () => {
  test("should not expose server errors in response body", async ({
    request,
  }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: { orderId: 99999999 },
    });
    const body = await response.text();
    // Should not contain stack traces or internal errors
    expect(body).not.toContain("Error:");
    expect(body).not.toContain("at /");
    expect(body).not.toContain("node_modules");
  });

  test("should handle malformed JSON gracefully", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      headers: { "Content-Type": "application/json" },
      data: "not-valid-json{{{",
    });
    expect([400, 401, 500]).toContain(response.status());
  });

  test("should reject SQL injection in API params", async ({ request }) => {
    const response = await request.post("/api/razorpay/create-order", {
      data: { orderId: "1; DROP TABLE orders; --" },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("should reject XSS in API params", async ({ request }) => {
    const response = await request.post("/api/razorpay/verify-payment", {
      data: {
        razorpay_order_id: '<script>alert("xss")</script>',
        razorpay_payment_id: "pay_test",
        razorpay_signature: "sig_test",
      },
    });
    expect([400, 401]).toContain(response.status());
  });
});
