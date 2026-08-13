import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const corePaths = [
  ["routing", "Routing"],
  ["forms", "Forms"],
  ["validation", "Validation"],
  ["state-management", "State Management"],
  ["data-fetching", "Data Fetching"],
  ["error-handling", "Error Handling"],
  ["caching", "Caching"],
  ["middleware", "Middleware"],
  ["logging", "Logging"],
] as const;

test("publishes every Core foundation overview", async ({ page }) => {
  for (const [path, heading] of corePaths) {
    await page.goto(`/core/${path}`);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("link", { name: /open the authenticated/i })).toHaveAttribute(
      "href",
      `/core/${path}-demo`,
    );
  }
});

test("runs the Core foundation demos as one authenticated learning path", async ({
  baseURL,
  page,
}) => {
  await page.goto("/signup?redirect=%2Fcore%2Frouting-demo");
  await page.getByLabel("Name").fill("Core Learner");
  await page.getByLabel("Email").fill(`core-${randomUUID()}@test.local`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(`${baseURL}/core/routing-demo`, { timeout: 15_000 });
  await expect(
    page.getByRole("navigation", { name: "Routing topics" }).getByRole("link"),
  ).toHaveCount(3);
  await expect(page.getByRole("link", { name: "File routes" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("link", { name: "Search parameters" }).click();
  await expect(page).toHaveURL(`${baseURL}/core/routing-demo?topic=search`);
  await expect(page.getByText("The URL is application state.")).toBeVisible();

  await page.goto("/core/forms-demo");
  await page.getByLabel("Project name").fill("Core labs");
  await page.getByLabel("Summary").fill("A controlled form with accessible feedback.");
  await page.getByRole("button", { name: "Submit project" }).click();
  await expect(page.getByText("Core labs was submitted.")).toBeVisible();

  await page.goto("/core/validation-demo");
  await page.getByRole("button", { name: "Validate note" }).click();
  await expect(page.getByLabel("Validated title")).toBeFocused();
  await page.getByLabel("Validated title").fill("Shared constraints");
  await page.getByLabel("Validated content").fill("One schema, predictable errors.");
  await page.getByRole("button", { name: "Validate note" }).click();
  await expect(page.getByText(/Validation passed/)).toBeVisible();
  await page.getByLabel("Validated title").fill("");
  await page.getByRole("button", { name: "Validate note" }).click();
  await expect(page.getByText("Enter a title.")).toBeVisible();

  await page.goto("/core/state-management-demo");
  await page.getByLabel("Task name").fill("Ship the Core path");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("Ship the Core path")).toBeVisible();
  const taskCheckbox = page.getByRole("checkbox", { name: "Ship the Core path" });
  await expect(taskCheckbox).toBeVisible();
  await taskCheckbox.check();
  await expect(page.getByText("1 of 1 complete")).toBeVisible();

  await page.goto("/core/data-fetching-demo");
  await expect(page.getByText("API is healthy")).toBeVisible();
  await page.getByRole("button", { name: "Refetch health" }).click();
  await expect(page.getByText(/Last successful response/)).toBeVisible();

  await page.goto("/core/error-handling-demo");
  await page.getByRole("button", { name: "Show not found error" }).click();
  await expect(page.getByRole("alert")).toContainText("NOTE_NOT_FOUND");

  await page.goto("/core/caching-demo");
  await expect(page.getByText("Cached health response")).toBeVisible();
  await page.getByRole("button", { name: "Invalidate health cache" }).click();
  await expect(page.getByText(/Cache refreshed/)).toBeVisible();

  await page.goto("/core/middleware-demo");
  await page.getByRole("button", { name: "Inspect middleware" }).click();
  await expect(page.getByText("Request ID")).toBeVisible();
  await expect(page.getByText("Security headers")).toBeVisible();

  await page.goto("/core/logging-demo");
  await page.getByRole("button", { name: "Record API request" }).click();
  await expect(
    page.getByRole("list", { name: "Request events" }).getByRole("listitem"),
  ).toHaveCount(1);
  await expect(page.getByText("GET /api/version")).toBeVisible();
});
