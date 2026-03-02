import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("home page loads successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/รับหิ้ว|Rubhew/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("trips page loads and shows content", async ({ page }) => {
    await page.goto("/trips");

    await expect(page.locator("body")).toBeVisible();
    await page.waitForLoadState("networkidle");
  });

  test("requests page loads and shows content", async ({ page }) => {
    await page.goto("/requests");

    await expect(page.locator("body")).toBeVisible();
    await page.waitForLoadState("networkidle");
  });

  test("navigation between pages works", async ({ page }) => {
    await page.goto("/");

    const tripsLink = page.locator('a[href="/trips"]').first();
    if (await tripsLink.isVisible()) {
      await tripsLink.click();
      await expect(page).toHaveURL(/\/trips/);
    }
  });

  test("create-post page loads (requires session)", async ({ page }) => {
    await page.goto("/create-post");

    await expect(page.locator("body")).toBeVisible();
  });

  test("non-existent page shows 404", async ({ page }) => {
    await page.goto("/this-does-not-exist");

    await expect(page.locator("body")).toBeVisible();
    const content = await page.textContent("body");
    expect(content).toContain("404");
  });

  test("API health endpoint is reachable", async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || "http://localhost:3000";
    const res = await request.get(`${apiBase}/api/health`);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBeDefined();
  });
});

test.describe("Auth Flow", () => {
  test("auth modal opens from login trigger", async ({ page }) => {
    await page.goto("/");

    const loginButton = page.locator("button", { hasText: /เข้าสู่ระบบ|Login/ }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();

      await expect(
        page.locator("input[type='email']"),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
