import { expect, test } from "@playwright/test";

test("homepage loads and shows ZomLab branding", async ({ page }) => {
  const response = await page.goto("/");

  expect(response).not.toBeNull();
  expect(response?.headers()["cache-control"]).toContain("private");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  expect(response?.headers().vary).toContain("Cookie");

  await expect(page).toHaveTitle(/ZomLab/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sidebar" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
    "href",
    "#main",
  );
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ZomLab", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Getting Started" })).toBeVisible();
});
