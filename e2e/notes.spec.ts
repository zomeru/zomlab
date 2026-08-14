import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "password123";

test("unauthenticated users are redirected to login", async ({ baseURL, page }) => {
  await page.goto("/core/crud-demo");

  await expect(page).toHaveURL(new RegExp(`${baseURL}/login(\\?redirect=.+)?`));
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("sign up, create, edit, and delete a note", async ({ baseURL, page }) => {
  const email = `e2e-${randomUUID()}@test.local`;

  await page.goto("/signup?redirect=%2Fcore%2Fcrud-demo");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(`${baseURL}/core/crud-demo`, { timeout: 15_000 });
  await expect(page.getByLabel("Search notes")).toHaveCount(0);

  const titleInput = page.getByLabel("Title");
  const contentInput = page.getByLabel("Content");
  await titleInput.fill("t".repeat(201));
  await contentInput.fill("c".repeat(301));
  await page.getByRole("button", { name: "Create note" }).click();
  await expect(page.getByText("Use 200 characters or fewer for the title.")).toBeVisible();
  await expect(page.getByText("Use 300 characters or fewer for the content.")).toBeVisible();
  await expect(titleInput).toBeFocused();
  await expect(titleInput).toHaveAttribute("aria-invalid", "true");
  await expect(titleInput).toHaveAttribute("aria-describedby", /new-note-title-description/);
  await expect(contentInput).toHaveAttribute("aria-invalid", "true");
  await expect(contentInput).toHaveAttribute("aria-describedby", /new-note-content-description/);

  await page.getByLabel("Title").fill("My first note");
  await page.getByLabel("Content").fill("Hello from Playwright");
  await page.getByRole("button", { name: /create note/i }).click();
  await expect(page.getByRole("button", { name: "Creating…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create note" })).toBeEnabled();

  const createdNoteLink = page.getByRole("link", { name: "My first note" });
  await expect(createdNoteLink).toBeVisible({ timeout: 15_000 });
  const detailPath = await createdNoteLink.getAttribute("href");
  expect(detailPath).toMatch(/^\/core\/crud-demo\/[^/]+$/);
  if (!detailPath) throw new Error("Created note link is missing its href");
  const detailUrl = new URL(detailPath, baseURL).href;

  await Promise.all([page.waitForURL(detailUrl), createdNoteLink.click()]);
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByText("Hello from Playwright")).toBeVisible();

  await page.getByRole("button", { name: /edit/i }).click();
  await titleInput.fill("t".repeat(201));
  await contentInput.fill("c".repeat(301));
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Use 200 characters or fewer for the title.")).toBeVisible();
  await expect(page.getByText("Use 300 characters or fewer for the content.")).toBeVisible();
  await expect(titleInput).toBeFocused();

  await titleInput.fill("My edited note");
  await contentInput.fill("Hello from Playwright");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByText("My edited note", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /delete/i }).click();
  const deleteDialog = page.getByRole("alertdialog", { name: "Delete note?" });
  await expect(deleteDialog).toBeVisible();
  await expect(page.getByText("My edited note", { exact: true })).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Delete" })).toBeFocused();

  await page.getByRole("button", { name: "Delete" }).click();
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete note" }).click();
  await expect(page).toHaveURL(`${baseURL}/core/crud-demo`);
  await expect(page.getByRole("link", { name: "My edited note" })).not.toBeVisible();
});
