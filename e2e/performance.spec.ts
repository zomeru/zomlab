import { expect, test } from "@playwright/test";

test("runs browser performance comparisons with measured results", async ({ page }) => {
  const email = `performance-${crypto.randomUUID()}@test.local`;
  await page.goto("/signup?redirect=%2Fperformance%2Fjavascript");
  await page.getByLabel("Name").fill("Performance Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/performance\/javascript$/);
  await expect(
    page.getByRole("heading", { name: "JavaScript Performance", level: 1 }),
  ).toBeVisible();
  await page.getByLabel("Records").selectOption("1000");
  await page.getByRole("button", { name: "Run comparison" }).click();

  const medianRow = page.getByRole("row", { name: /Median execution/ });
  await expect(medianRow.locator("td").nth(0)).not.toHaveText("Not run", { timeout: 10_000 });
  await expect(medianRow.locator("td").nth(1)).not.toHaveText("Not run", { timeout: 10_000 });

  const comparisons = [
    { metric: /Child renders/, path: "/performance/react-rendering" },
    { metric: /Filter calculations/, path: "/performance/memoization" },
    { metric: /DOM rows/, path: "/performance/virtualization" },
    { metric: /Interaction to ready/, path: "/performance/lazy-loading" },
    { metric: /Interaction duration/, path: "/performance/code-splitting" },
    { metric: /Client request duration/, path: "/performance/caching" },
    { metric: /Client response time/, path: "/performance/api" },
    { metric: /Waterfall duration/, path: "/performance/network" },
    { metric: /Median completion/, path: "/performance/concurrency" },
  ];

  for (const comparison of comparisons) {
    await page.goto(comparison.path);
    if (comparison.path === "/performance/virtualization") {
      await page.getByLabel("Dataset size").selectOption("1000");
    }

    const runComparison = page.getByRole("button", { name: "Run comparison" });
    await expect(runComparison).toHaveCount(1);
    await expect(runComparison).toBeEnabled();
    await runComparison.click();

    const metricRow = page.getByRole("row", { name: comparison.metric });
    await expect(metricRow.locator("td").nth(0)).not.toHaveText("Not run", { timeout: 15_000 });
    await expect(metricRow.locator("td").nth(1)).not.toHaveText("Not run", { timeout: 15_000 });
  }
});

test("keeps Performance controls and results within the compact viewport", async ({ page }) => {
  const email = `performance-layout-${crypto.randomUUID()}@test.local`;
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/signup?redirect=%2Fperformance%2Freact-rendering");
  await page.getByLabel("Name").fill("Performance Layout Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/performance\/react-rendering$/);

  const compactRoutes = [
    "react-rendering",
    "memoization",
    "virtualization",
    "lazy-loading",
    "code-splitting",
    "caching",
    "bundle-analysis",
    "javascript",
    "api",
    "database",
    "network",
    "concurrency",
    "profiling",
  ];

  for (const route of compactRoutes) {
    await page.goto(`/performance/${route}`);
    const main = page.locator("main");
    expect(await main.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

    const firstAction = main.getByRole("button").first();
    const actionBox = await firstAction.boundingBox();
    expect(actionBox?.width).toBeGreaterThan(280);
  }

  await expect(page.getByText("Change", { exact: true }).first()).toBeVisible();
});
