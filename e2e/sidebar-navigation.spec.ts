import { expect, test } from "@playwright/test";

test("shows Search & Filtering as an overview and demo group", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.locator("details").filter({ hasText: "Core" }).locator(":scope > summary").click();
  const searchSummary = sidebar.locator("summary", { hasText: /^Search & Filtering$/ });
  const searchGroup = searchSummary.locator("..");
  await searchSummary.click();

  await expect(searchGroup.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/core/search-filter",
  );
  await expect(searchGroup.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "/core/search-filter-demo",
  );
});

test("shows CRUD as an overview and demo group", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.locator("details").filter({ hasText: "Core" }).locator(":scope > summary").click();
  const crudSummary = sidebar.locator("summary", { hasText: /^CRUD$/ });
  const crudGroup = crudSummary.locator("..");
  await crudSummary.click();

  await expect(crudGroup.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/core/crud",
  );
  await expect(crudGroup.getByRole("link", { name: "Data Boundaries" })).toHaveAttribute(
    "href",
    "/core/crud/data-boundaries",
  );
  await expect(crudGroup.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "/core/crud-demo",
  );
});

test("shows Pagination as an overview and demo group", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.locator("details").filter({ hasText: "Core" }).locator(":scope > summary").click();
  const paginationSummary = sidebar.locator("summary", { hasText: /^Pagination$/ });
  const paginationGroup = paginationSummary.locator("..");
  await paginationSummary.click();

  await expect(paginationGroup.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/core/pagination",
  );
  await expect(paginationGroup.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "/core/pagination-demo",
  );
});

test("shows Tables as an overview and demo group", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.locator("details").filter({ hasText: "Core" }).locator(":scope > summary").click();
  const tablesSummary = sidebar.locator("summary", { hasText: /^Tables$/ });
  const tablesGroup = tablesSummary.locator("..");
  await tablesSummary.click();

  await expect(tablesGroup.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/core/tables",
  );
  await expect(tablesGroup.getByRole("link", { name: "Server Data" })).toHaveAttribute(
    "href",
    "/core/tables/server-data",
  );
  await expect(tablesGroup.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "/core/tables-demo",
  );
});

test("shows File Uploads as an overview and demo group", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.locator("details").filter({ hasText: "Core" }).locator(":scope > summary").click();
  const uploadsSummary = sidebar.locator("summary", { hasText: /^File Uploads$/ });
  const uploadsGroup = uploadsSummary.locator("..");
  await uploadsSummary.click();

  await expect(uploadsGroup.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/core/file-uploads",
  );
  await expect(uploadsGroup.getByRole("link", { name: "Storage & Security" })).toHaveAttribute(
    "href",
    "/core/file-uploads/storage-security",
  );
  await expect(uploadsGroup.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "/core/file-uploads-demo",
  );
});

test("shows Error Handling as an overview, contract, and demo group", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  await sidebar.locator("details").filter({ hasText: "Core" }).locator(":scope > summary").click();
  const errorSummary = sidebar.locator("summary", { hasText: /^Error Handling$/ });
  const errorGroup = errorSummary.locator("..");
  await errorSummary.click();

  await expect(errorGroup.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "/core/error-handling",
  );
  await expect(errorGroup.getByRole("link", { name: "Error Contract" })).toHaveAttribute(
    "href",
    "/core/error-handling/error-contract",
  );
  await expect(errorGroup.getByRole("link", { name: "Demo" })).toHaveAttribute(
    "href",
    "/core/error-handling-demo",
  );
});

test("publishes every Realtime module as a navigable route", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  const realtimeSection = sidebar.locator("details").filter({ hasText: "Realtime" });
  await realtimeSection.locator(":scope > summary").click();

  const expectedLinks = [
    ["WebSockets", "/realtime/websockets"],
    ["SSE", "/realtime/sse"],
    ["Live Chat", "/realtime/live-chat"],
    ["Presence", "/realtime/presence"],
    ["Notifications", "/realtime/notifications"],
  ] as const;
  for (const [name, href] of expectedLinks) {
    await expect(realtimeSection.getByRole("link", { name })).toHaveAttribute("href", href);
  }
});

test("publishes the full-stack Performance section as navigable routes", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  const performanceSection = sidebar.locator("details").filter({ hasText: "Performance" });
  await performanceSection.locator(":scope > summary").click();

  const expectedLinks = [
    ["React Rendering", "/performance/react-rendering"],
    ["Memoization", "/performance/memoization"],
    ["Virtualization", "/performance/virtualization"],
    ["Lazy Loading", "/performance/lazy-loading"],
    ["Code Splitting", "/performance/code-splitting"],
    ["Caching", "/performance/caching"],
    ["Bundle Analysis", "/performance/bundle-analysis"],
    ["JavaScript", "/performance/javascript"],
    ["API", "/performance/api"],
    ["Database", "/performance/database"],
    ["Network", "/performance/network"],
    ["Concurrency", "/performance/concurrency"],
    ["Profiling", "/performance/profiling"],
  ] as const;
  for (const [name, href] of expectedLinks) {
    await expect(performanceSection.getByRole("link", { name, exact: true })).toHaveAttribute(
      "href",
      href,
    );
  }
});

test("keeps the Core sidebar section open after an unauthenticated demo redirect", async ({
  page,
}) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  const coreSection = sidebar.locator("details").filter({ hasText: "Core" });

  await coreSection.locator(":scope > summary").click();
  await coreSection
    .locator("details")
    .filter({ hasText: "CRUD" })
    .locator(":scope > summary")
    .click();
  await sidebar.getByRole("link", { name: "Demo", exact: true }).click();

  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(coreSection).toHaveAttribute("open", "");
});

test("collapses and restores the desktop sidebar from its cookie", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const sidebar = page.locator('[data-slot="sidebar-desktop"]');
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await page.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");

  await page.reload();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await page.getByRole("button", { name: "Expand navigation" }).click();
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
});

test("uses an off-canvas navigation sheet on compact viewports", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("navigation", { name: "Sidebar" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
