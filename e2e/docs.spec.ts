import { expect, test } from "@playwright/test";

test("crud overview page renders mermaid diagrams", async ({ page }) => {
  await page.goto("/core/crud");
  await expect(page.getByRole("heading", { name: /Notes/i }).first()).toBeVisible();
  await expect(page.getByRole("main").locator("figure svg").first()).toBeVisible({
    timeout: 15_000,
  });
});
