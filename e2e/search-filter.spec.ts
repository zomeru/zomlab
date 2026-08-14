import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "password123";

test("filters a user's notes in the dedicated search demo", async ({ baseURL, page }) => {
  const email = `search-${randomUUID()}@test.local`;
  const searchRequests: string[] = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/notes" && url.searchParams.has("query")) {
      searchRequests.push(url.searchParams.get("query") ?? "");
    }
  });

  await page.goto("/signup?redirect=%2Fcore%2Fsearch-filter-demo");
  await page.getByLabel("Name").fill("Search User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo`, { timeout: 15_000 });

  await page.getByLabel("Title").fill("Roadmap");
  await page.getByLabel("Content").fill("Plan the next lab");
  await page.getByRole("button", { name: /create note/i }).click();
  await expect(page.getByRole("button", { name: "Creating…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create note" })).toBeEnabled();

  await page.getByLabel("Title").fill("Release notes");
  await page.getByLabel("Content").fill("Deployment checklist");
  await page.getByRole("button", { name: /create note/i }).click();
  await expect(page.getByRole("button", { name: "Creating…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create note" })).toBeEnabled();
  await expect(page.getByRole("link", { name: "Release notes" })).toBeVisible();

  const searchInput = page.getByLabel("Search notes");
  await expect(searchInput).toHaveAttribute("type", "text");
  await searchInput.pressSequentially("checklist", { delay: 10 });

  await expect(searchInput).toHaveValue("checklist");
  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo`);

  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo?query=checklist`);
  await expect(page.getByRole("link", { name: "Release notes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Roadmap" })).not.toBeVisible();
  expect(searchRequests).toEqual(["checklist"]);

  await page.goBack();
  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo`);
  await expect(searchInput).toHaveValue("");
  await page.waitForTimeout(350);
  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo`);
  expect(searchRequests).toEqual(["checklist"]);

  await page.goForward();
  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo?query=checklist`);
  await expect(searchInput).toHaveValue("checklist");

  const clearSearch = page.getByRole("button", { name: "Clear search" });
  await expect(clearSearch).toHaveCount(1);
  await clearSearch.click();
  await expect(searchInput).toHaveValue("");
  await expect(page).toHaveURL(`${baseURL}/core/search-filter-demo`);
  await expect(page.getByRole("link", { name: "Roadmap" })).toBeVisible();
});
