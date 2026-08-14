import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { height: 812, label: "mobile", width: 375 },
  { height: 1024, label: "tablet", width: 768 },
  { height: 800, label: "desktop", width: 1280 },
] as const;

const THEMES = ["light", "dark"] as const;

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
    test(`${viewport.label} shell and docs work in ${theme} theme`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((preference) => localStorage.setItem("theme", preference), theme);
      await page.goto("/");

      await expect(page.locator("html")).toHaveClass(new RegExp(`(^|\\s)${theme}(\\s|$)`));
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);

      if (viewport.width < 1024) {
        await page.getByRole("button", { name: "Open navigation" }).click();
        const dialog = page.getByRole("dialog", { name: "Navigation" });
        await expect(dialog.getByRole("navigation", { name: "Sidebar" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
      } else {
        await expect(page.getByRole("navigation", { name: "Sidebar" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Collapse navigation" })).toBeVisible();
      }

      await page.goto("/core/crud");
      await expect(page.getByRole("heading", { name: "CRUD notes", exact: true })).toBeVisible();
      await expect(page.getByLabel("Architecture diagram").first()).toBeVisible();
      await expect(page.getByText("Diagram could not be rendered.")).toHaveCount(0);
      await expect(page.locator("article pre").first()).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    });
  }
}
