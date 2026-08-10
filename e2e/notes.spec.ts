import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "password123";

test("unauthenticated users are redirected to login", async ({ baseURL, page }) => {
  await page.goto("/core/crud/demo");

  await expect(page).toHaveURL(new RegExp(`${baseURL}/login(\\?redirect=.+)?`));
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("sign up, create, edit, and delete a note", async ({ baseURL, page }) => {
  const email = `e2e-${randomUUID()}@test.local`;

  await page.goto("/signup?redirect=%2Fcore%2Fcrud%2Fdemo");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(`${baseURL}/core/crud/demo`);

  await page.getByLabel("Title").fill("My first note");
  await page.getByLabel("Content").fill("Hello from Playwright");
  await page.getByRole("button", { name: /create note/i }).click();

  const createdNoteLink = page.getByRole("link", { name: "My first note" });
  await expect(createdNoteLink).toBeVisible();
  const detailPath = await createdNoteLink.getAttribute("href");
  expect(detailPath).toMatch(/^\/core\/crud\/demo\/[^/]+$/);
  if (!detailPath) throw new Error("Created note link is missing its href");
  const detailUrl = new URL(detailPath, baseURL).href;

  await Promise.all([page.waitForURL(detailUrl), createdNoteLink.click()]);
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByText("Hello from Playwright")).toBeVisible();

  await page.getByRole("button", { name: /edit/i }).click();
  await page.getByLabel("Title").fill("My edited note");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByText("My edited note")).toBeVisible();

  await page.getByRole("button", { name: /delete/i }).click();
  await expect(page).toHaveURL(`${baseURL}/core/crud/demo`);
  await expect(page.getByRole("link", { name: "My edited note" })).not.toBeVisible();
});
