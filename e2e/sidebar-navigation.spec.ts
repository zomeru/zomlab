import { expect, test } from "@playwright/test";

test("keeps the Core sidebar section open after an unauthenticated demo redirect", async ({
  page,
}) => {
  await page.goto("/");

  const sidebar = page.getByRole("navigation", { name: "Sidebar" });
  const coreSection = sidebar.locator("details").filter({ hasText: "Core" });

  await coreSection.locator("summary").click();
  await sidebar.getByRole("link", { name: "Demo", exact: true }).click();

  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(coreSection).toHaveAttribute("open", "");
});
