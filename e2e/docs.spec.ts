import { expect, test } from "@playwright/test";

test("crud overview page renders mermaid diagrams", async ({ page }) => {
  await page.goto("/core/crud");
  await expect(page.getByRole("heading", { name: /Notes/i }).first()).toBeVisible();

  const svgCount = await page.locator("svg").count();
  console.log("SVG count on /core/crud:", svgCount);
  expect(svgCount).toBeGreaterThan(0);
});
