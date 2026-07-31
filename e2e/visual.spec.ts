import { expect, test } from "@playwright/test";

test("visual pass: signup, crud overview, and demo pages", async ({ page }) => {
  await page.goto("/signup");
  await page.screenshot({ path: "test-results/visual-signup.png", fullPage: true });

  await page.goto("/core/crud");
  await expect(page.getByRole("heading", { name: /Notes/i }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/visual-crud-overview.png", fullPage: true });
});

test("visual pass: crud demo after signup", async ({ page }) => {
  const email = `visual-${Date.now()}@test.local`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Visual User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/core\/crud\/demo/);

  await page.getByLabel("Title").fill("A beautifully styled note");
  await page.getByLabel("Content").fill("Rendered with care.");
  await page.getByRole("button", { name: /create note/i }).click();
  await expect(page.getByText("A beautifully styled note")).toBeVisible({ timeout: 10_000 });

  await page.screenshot({ path: "test-results/visual-crud-demo.png", fullPage: true });
});
