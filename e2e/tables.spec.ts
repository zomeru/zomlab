import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "password123";

test("sorts and searches a user's notes in a URL-backed table", async ({ baseURL, page }) => {
  const email = `tables-${randomUUID()}@test.local`;

  await page.goto(
    "/signup?redirect=%2Fcore%2Ftables-demo%3Fpage%3D1%26pageSize%3D5%26sortBy%3Dtitle%26sortDirection%3Dasc",
  );
  await page.getByLabel("Name").fill("Tables User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(
    `${baseURL}/core/tables-demo?page=1&pageSize=5&sortBy=title&sortDirection=asc`,
    { timeout: 15_000 },
  );

  for (const [title, content] of [
    ["Bravo", "Release checklist"],
    ["Alpha", "Planning notes"],
    ["Charlie", "Archive notes"],
  ]) {
    await page.getByRole("textbox", { name: "Title", exact: true }).fill(title);
    await page.getByRole("textbox", { name: "Content", exact: true }).fill(content);
    const createResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/notes") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /create note/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
  }

  const rows = page.getByRole("table", { name: "Notes table" }).getByRole("row");
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(1).getByRole("cell").first()).toContainText("Alpha");
  await expect(rows.nth(3).getByRole("cell").first()).toContainText("Charlie");

  const noteFormBox = await page.locator('[data-slot="card"]').first().boundingBox();
  const searchBox = await page
    .getByText("Search notes", { exact: true })
    .locator("..")
    .boundingBox();
  const tableBox = await page
    .getByRole("table", { name: "Notes table" })
    .locator("..")
    .locator("..")
    .boundingBox();

  expect(noteFormBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(tableBox).not.toBeNull();
  expect(Math.abs((noteFormBox?.x ?? 0) - (tableBox?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.x ?? 0) - (tableBox?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((noteFormBox?.width ?? 0) - (tableBox?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.width ?? 0) - (tableBox?.width ?? 0))).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Content" }).click();
  await expect(page.getByRole("columnheader", { name: "Content" })).toBeHidden();

  await page.getByRole("button", { name: "Sort by title descending" }).click();
  await expect(page).toHaveURL(
    `${baseURL}/core/tables-demo?page=1&pageSize=5&sortBy=title&sortDirection=desc`,
  );
  await expect(rows.nth(1).getByRole("cell").first()).toContainText("Charlie");

  const searchInput = page.getByLabel("Search notes");
  await searchInput.fill("checklist");
  await expect(page).toHaveURL(/query=checklist/);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("Bravo");

  await page.setViewportSize({ height: 844, width: 390 });
  const compactLayout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(compactLayout.scrollWidth).toBe(compactLayout.clientWidth);
  await expect(page.getByRole("table", { name: "Notes table" })).toBeVisible();
});
