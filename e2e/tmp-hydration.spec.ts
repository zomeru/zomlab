import { expect, test } from "@playwright/test";

test("measure hydration", async ({ page }) => {
  const navStart = await page.evaluate(() => performance.now());
  await page.goto("/signup");
  const t1 = await page.evaluate(() => performance.now());
  await page.waitForSelector("html[data-tanstack-devtools-theme]", { timeout: 15000 });
  const t2 = await page.evaluate(() => performance.now());
  const b = page.getByRole("button", { name: /sign up/i });
  await b.click();
  const t3 = await page.evaluate(() => performance.now());
  await page.waitForURL("**/core/crud/demo", { timeout: 15000 });
  const t4 = await page.evaluate(() => performance.now());
  console.log(
    `goto-return=${(t1 - navStart).toFixed(0)}ms devtools-attr=${(t2 - t1).toFixed(0)}ms click=${(t3 - t2).toFixed(0)}ms to-demo=${(t4 - t3).toFixed(0)}ms`,
  );
  expect(page.url()).toContain("/core/crud/demo");
});
