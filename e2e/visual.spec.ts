import { randomUUID } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";

type ColorScheme = "dark" | "light";

const COLOR_SCHEMES: ColorScheme[] = ["dark", "light"];

async function captureTheme(
  page: Page,
  options: {
    colorScheme: ColorScheme;
    filename: string;
    route: string;
    ready?: () => Promise<void>;
  },
) {
  await page.emulateMedia({ colorScheme: options.colorScheme });
  await page.goto(options.route);

  const root = page.locator("html");
  const hasExpectedTheme = await root.evaluate(
    (element, theme) => element.classList.contains(theme),
    options.colorScheme,
  );

  if (!hasExpectedTheme) {
    await page.getByRole("button", { name: "Change theme" }).click();
    await page
      .getByRole("menuitemradio", {
        name: new RegExp(`^${options.colorScheme}`, "i"),
      })
      .click();
  }

  await expect(root).toHaveClass(new RegExp(`(^|\\s)${options.colorScheme}(\\s|$)`));
  await options.ready?.();
  await page.screenshot({ path: `test-results/${options.filename}`, fullPage: true });
}

async function signUpAndCreateVisualNote(page: Page) {
  await page.goto("/signup?redirect=%2Fcore%2Fcrud-demo");
  await page.getByLabel("Name").fill("Visual User");
  await page.getByLabel("Email").fill(`visual-${randomUUID()}@test.local`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/core\/crud-demo$/);

  await page.getByLabel("Title").fill("A beautifully styled note");
  await page.getByLabel("Content").fill("Rendered with care.");
  const createResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/notes") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /create note/i }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);

  const noteLink = page.getByRole("link", { name: "A beautifully styled note" });
  await expect(noteLink).toBeVisible();
  return noteLink;
}

test("captures the workbench homepage in both themes", async ({ page }) => {
  for (const colorScheme of COLOR_SCHEMES) {
    await captureTheme(page, {
      colorScheme,
      filename: `workbench-home-${colorScheme}.png`,
      route: "/",
      ready: async () => {
        await expect(page.getByRole("main")).toBeVisible();
      },
    });
  }
});

test("captures the signup page in both themes", async ({ page }) => {
  for (const colorScheme of COLOR_SCHEMES) {
    await captureTheme(page, {
      colorScheme,
      filename: `signup-${colorScheme}.png`,
      route: "/signup",
      ready: async () => {
        await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
      },
    });
  }
});

test("captures the CRUD documentation in both themes", async ({ page }) => {
  for (const colorScheme of COLOR_SCHEMES) {
    await captureTheme(page, {
      colorScheme,
      filename: `crud-docs-${colorScheme}.png`,
      route: "/core/crud",
      ready: async () => {
        await expect(page.getByRole("heading", { name: "CRUD notes", exact: true })).toBeVisible();
      },
    });
  }
});

test("captures the authenticated notes list in both themes", async ({ page }) => {
  await signUpAndCreateVisualNote(page);

  for (const colorScheme of COLOR_SCHEMES) {
    await captureTheme(page, {
      colorScheme,
      filename: `notes-list-${colorScheme}.png`,
      route: "/core/crud-demo",
      ready: async () => {
        await expect(page.getByRole("link", { name: "A beautifully styled note" })).toBeVisible();
      },
    });
  }
});

test("captures an authenticated note detail in both themes", async ({ page }) => {
  const noteLink = await signUpAndCreateVisualNote(page);
  const detailPath = await noteLink.getAttribute("href");
  expect(detailPath).toMatch(/^\/core\/crud-demo\/[^/]+$/);
  if (!detailPath) throw new Error("Created note link is missing its href");

  for (const colorScheme of COLOR_SCHEMES) {
    await captureTheme(page, {
      colorScheme,
      filename: `note-detail-${colorScheme}.png`,
      route: detailPath,
      ready: async () => {
        await expect(
          page.getByRole("heading", { name: "A beautifully styled note" }),
        ).toBeVisible();
      },
    });
  }
});
