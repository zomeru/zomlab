import { expect, test } from "@playwright/test";

const email = `e2e-${Date.now()}@test.local`;
const password = "password123";

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/core/crud/demo");

  await expect(page).toHaveURL(/\/login/);
});

test("sign up, create, edit, and delete a note", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/core\/crud\/demo/);

  await page.getByLabel("Title").fill("My first note");
  await page.getByLabel("Content").fill("Hello from Playwright");
  await page.getByRole("button", { name: /create note/i }).click();

  await expect(page.getByText("My first note")).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/core\/crud\/demo\/\w+/),
    page.getByRole("link", { name: "My first note" }).click(),
  ]);
  await expect(page.getByText("Hello from Playwright")).toBeVisible();

  await page.getByRole("button", { name: /edit/i }).click();
  await page.getByLabel("Title").fill("My edited note");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("My edited note")).toBeVisible();

  await page.getByRole("button", { name: /delete/i }).click();
  await expect(page).toHaveURL(/\/core\/crud\/demo$/);
  await expect(page.getByText("My edited note")).not.toBeVisible();
});
