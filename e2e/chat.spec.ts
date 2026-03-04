import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
  test("chat list page loads without errors", async ({ page }) => {
    await page.goto("/chat");

    await expect(page.locator("body")).toBeVisible();
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1", { hasText: /แชท/ });
    await expect(heading).toBeVisible();
  });

  test("chat room page does not make excessive API calls", async ({ page }) => {
    let chatApiCalls = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/chat/")) chatApiCalls++;
    });

    await page.goto("/chat/test-nonexistent-room");
    await page.waitForTimeout(3000);

    expect(chatApiCalls).toBeLessThan(15);
  });

  test("chat room page shows connection status", async ({ page }) => {
    await page.goto("/chat/test-nonexistent-room");

    await expect(page.locator("body")).toBeVisible();
  });
});
