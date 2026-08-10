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
  await expect(page.getByRole("button", { name: "Change theme" })).toBeVisible();
  await page.getByRole("button", { name: "Change theme" }).click();
  await expect(page.getByRole("menuitemradio", { name: "System" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "ZomLab", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Getting Started" })).toBeVisible();

  const readmeLink = page.getByRole("link", {
    name: "Read the repository README",
  });
  await expect(readmeLink).toHaveAttribute(
    "href",
    "https://github.com/zomeru/zomlab/blob/main/README.md",
  );
  await expect(page.getByText(/only completed vertical slice/i)).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByText(/standalone Hono API/i)).toHaveCount(0);
  await expect(main.getByText(/microservices/i)).toHaveCount(0);
});
