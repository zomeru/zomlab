import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "password123";

test("pages through a user's notes with URL-backed controls", async ({ baseURL, page }) => {
  const email = `pagination-${randomUUID()}@test.local`;

  await page.goto("/signup?redirect=%2Fcore%2Fpagination-demo%3Fpage%3D1%26pageSize%3D2");
  await page.getByLabel("Name").fill("Pagination User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(`${baseURL}/core/pagination-demo?page=1&pageSize=2`, {
    timeout: 15_000,
  });

  for (const title of ["First page note", "Second page note", "Third page note"]) {
    await page.getByLabel("Title").fill(title);
    const createResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/notes") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /create note/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
  }

  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Page 1", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.getByRole("list", { name: "Paginated notes" }).getByRole("listitem"),
  ).toHaveCount(2);

  await page.getByRole("link", { name: "Page 2", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/core/pagination-demo?page=2&pageSize=2`);
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Page 2", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.getByRole("list", { name: "Paginated notes" }).getByRole("listitem"),
  ).toHaveCount(1);

  await page.getByRole("link", { name: "Previous page" }).click();
  await expect(page).toHaveURL(`${baseURL}/core/pagination-demo?page=1&pageSize=2`);
});
