import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const password = "e2e-password-123";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
}

test("authentication stays synchronized across redirects, refreshes, logout, and relogin", async ({
  baseURL,
  page,
}) => {
  const email = `auth-lifecycle-${randomUUID()}@test.local`;
  const protectedPath = "/core/crud-demo";

  await page.goto(protectedPath);
  await expect(page).toHaveURL(new RegExp(`${baseURL}/login\\?redirect=`));

  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL(new RegExp(`${baseURL}/signup\\?redirect=`));
  await page.getByLabel("Name").fill("Auth Lifecycle User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(`${baseURL}${protectedPath}`, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(`${baseURL}${protectedPath}`);
  await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();

  await signOut(page);
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.goto(protectedPath);
  await expect(page).toHaveURL(new RegExp(`${baseURL}/login\\?redirect=`));
  await signIn(page, email);
  await expect(page).toHaveURL(`${baseURL}${protectedPath}`);

  await signOut(page);
  await expect(page).toHaveURL(`${baseURL}/`);
  await page.goto(protectedPath);
  await expect(page).toHaveURL(new RegExp(`${baseURL}/login\\?redirect=`));

  await signIn(page, email);
  await expect(page).toHaveURL(`${baseURL}${protectedPath}`);
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
});

test("auth forms provide password visibility controls and social authentication", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.locator('[data-slot="field-group"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="field"]')).toHaveCount(2);
  await expect(page.locator('[data-slot="input-group"]')).toHaveCount(2);
  const passwordInput = page.getByLabel("Password", { exact: true });
  await expect(passwordInput).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(passwordInput).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  await expect(page.getByText("OR", { exact: true })).toBeVisible();

  await page.goto("/signup");
  await expect(page.locator('[data-slot="field-group"]')).toHaveCount(1);
  await expect(page.locator('[data-slot="field"]')).toHaveCount(4);
  await expect(page.locator('[data-slot="input-group"]')).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  const confirmPasswordInput = page.getByLabel("Confirm password", { exact: true });
  await expect(confirmPasswordInput).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show confirm password" }).click();
  await expect(confirmPasswordInput).toHaveAttribute("type", "text");
});

test("sign up requires matching passwords", async ({ page }) => {
  await page.goto("/signup");

  await expect(page.getByLabel("Confirm password", { exact: true })).toBeVisible();
  await page.getByLabel("Name").fill("Password Match User");
  await page.getByLabel("Email").fill("password-match@test.local");
  await page.getByLabel("Password", { exact: true }).fill("e2e-password-123");
  await page.getByLabel("Confirm password", { exact: true }).fill("different-password");
  await page.getByRole("button", { name: "Sign up" }).click();

  const confirmPassword = page.getByLabel("Confirm password", { exact: true });
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match");
  await expect(confirmPassword).toBeFocused();
  await expect(confirmPassword).toHaveAttribute("aria-invalid", "true");
  await expect(confirmPassword).toHaveAttribute("aria-describedby", "confirm-password-error");
});
