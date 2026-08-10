import { expect, test } from "@playwright/test";

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
