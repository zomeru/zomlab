import { expect, test } from "@playwright/test";

const overviewPages = [
  { path: "/core/routing", title: "Routing", diagram: true },
  { path: "/core/forms", title: "Forms", diagram: false },
  { path: "/core/validation", title: "Validation", diagram: true },
  { path: "/core/state-management", title: "State management", diagram: true },
  { path: "/core/data-fetching", title: "Data fetching", diagram: true },
  { path: "/core/crud", title: "CRUD notes", diagram: true },
  { path: "/core/search-filter", title: "Search and filtering", diagram: true },
  { path: "/core/pagination", title: "Pagination", diagram: true },
  { path: "/core/tables", title: "Tables", diagram: true },
  { path: "/core/file-uploads", title: "File uploads", diagram: true },
  { path: "/core/error-handling", title: "Error handling", diagram: true },
  { path: "/core/caching", title: "Caching", diagram: true },
  { path: "/core/middleware", title: "Middleware", diagram: true },
  { path: "/core/logging", title: "Logging", diagram: false },
] as const;

for (const overview of overviewPages) {
  test(`${overview.title} has an implementation-backed overview`, async ({ page }) => {
    await page.goto(overview.path);

    const article = page.locator("article");
    await expect(article.getByRole("heading", { name: overview.title, exact: true })).toBeVisible();
    await expect(article.locator("pre").first()).toBeVisible();
    await expect(article.getByRole("heading", { name: "Routes", exact: true })).toHaveCount(0);

    if (overview.diagram) {
      const diagram = article.locator('[data-slot="architecture-diagram"]').first();
      await expect(diagram).toBeVisible();
      await expect(diagram.locator(".react-flow__node").first()).toBeVisible();
    }
  });
}

const chapterPages = [
  { path: "/core/crud/data-boundaries", title: "Design CRUD data boundaries" },
  { path: "/core/tables/server-data", title: "Compose a server-backed table" },
  { path: "/core/file-uploads/storage-security", title: "Secure file storage in R2" },
  { path: "/core/error-handling/error-contract", title: "Define a public error contract" },
] as const;

for (const chapter of chapterPages) {
  test(`${chapter.title} renders as a focused Core chapter`, async ({ page }) => {
    await page.goto(chapter.path);

    const article = page.locator("article");
    await expect(article.getByRole("heading", { name: chapter.title, exact: true })).toBeVisible();
    await expect(article.locator("pre").first()).toBeVisible();
  });
}

test("architecture diagrams support zooming and fitted viewing", async ({ page }) => {
  await page.goto("/core/crud");

  const diagram = page.locator('[data-slot="architecture-diagram"]').first();
  const canvas = diagram.getByLabel("CRUD request flow interactive architecture diagram");
  const viewport = canvas.locator(".react-flow__viewport");
  const zoomIn = diagram.getByRole("button", { name: "Zoom in" });
  const fit = diagram.getByRole("button", { name: "Fit diagram" });

  await expect(canvas).toBeVisible();
  await expect(canvas.locator(".react-flow__node")).toHaveCount(8);
  await expect(zoomIn).toBeVisible();
  await expect(fit).toBeVisible();

  const fittedTransform = await viewport.getAttribute("style");
  await zoomIn.click();
  await expect.poll(() => viewport.getAttribute("style")).not.toBe(fittedTransform);

  const zoomedTransform = await viewport.getAttribute("style");
  await fit.click();
  await expect.poll(() => viewport.getAttribute("style")).not.toBe(zoomedTransform);
});

test("code examples use theme-aware syntax highlighting", async ({ page }) => {
  await page.goto("/core/routing");

  const codeBlock = page.locator("article pre.shiki").first();
  const highlightedTokens = codeBlock.locator('span[style*="light-dark("]');

  await expect(codeBlock).toBeVisible();
  await expect(highlightedTokens.first()).toBeVisible();

  await page.locator("html").evaluate((element) => {
    element.classList.remove("dark");
    element.classList.add("light");
    element.style.colorScheme = "light";
  });
  const lightColors = await highlightedTokens.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).color),
  );

  await page.locator("html").evaluate((element) => {
    element.classList.remove("light");
    element.classList.add("dark");
    element.style.colorScheme = "dark";
  });
  await expect
    .poll(async () => {
      const darkColors = await highlightedTokens.evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).color),
      );

      return darkColors.some((color, index) => color !== lightColors[index]);
    })
    .toBe(true);
});
