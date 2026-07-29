import { expect, test } from "@playwright/test";

test("homepage loads and shows ZomLab branding", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/ZomLab/);

  await expect(page.getByRole("link", { name: "ZomLab" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Getting Started" })).toBeVisible();
});
