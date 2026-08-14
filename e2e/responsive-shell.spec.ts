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
      const diagram = page.locator('[data-slot="architecture-diagram"]').first();
      const canvas = diagram.getByRole("application", {
        name: "CRUD request flow interactive architecture diagram",
      });
      await expect(diagram).toBeVisible();
      await expect(canvas).toBeVisible();
      await expect(canvas.locator(".react-flow__node")).toHaveCount(8);
      await expect
        .poll(() =>
          canvas.evaluate(
            (element) =>
              getComputedStyle(element).getPropertyValue("--diagram-background").trim() ===
              getComputedStyle(document.documentElement)
                .getPropertyValue("--diagram-background")
                .trim(),
          ),
        )
        .toBe(true);
      await expect(page.locator("article pre").first()).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
    });
  }
}
