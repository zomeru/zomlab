import { expect, test } from "@playwright/test";

test("CRUD has a concise overview page", async ({ page }) => {
  await page.goto("/core/crud");

  await expect(page.getByRole("heading", { name: "CRUD Notes", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the authenticated CRUD demo" }),
  ).toHaveAttribute("href", "/core/crud-demo");
});

test("search and filtering has a dedicated overview page", async ({ page }) => {
  await page.goto("/core/search-filter");

  await expect(
    page.getByRole("heading", { name: "Search and Filtering", exact: true }),
  ).toBeVisible();
});

test("pagination has a dedicated overview page", async ({ page }) => {
  await page.goto("/core/pagination");

  await expect(page.getByRole("heading", { name: "Pagination", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the authenticated pagination demo" }),
  ).toHaveAttribute("href", "/core/pagination-demo");
});

test("tables has a dedicated overview page", async ({ page }) => {
  await page.goto("/core/tables");

  await expect(page.getByRole("heading", { name: "Tables", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the authenticated tables demo" }),
  ).toHaveAttribute("href", "/core/tables-demo");
});

test("file uploads has a dedicated overview page", async ({ page }) => {
  await page.goto("/core/file-uploads");

  await expect(page.getByRole("heading", { name: "File Uploads", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the authenticated file uploads demo" }),
  ).toHaveAttribute("href", "/core/file-uploads-demo");
});
