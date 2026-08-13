import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("uploads, downloads, and deletes a private file", async ({ baseURL, page }) => {
  await page.goto("/signup?redirect=%2Fcore%2Ffile-uploads-demo");
  await page.getByLabel("Name").fill("File Upload User");
  await page.getByLabel("Email").fill(`file-upload-${randomUUID()}@test.local`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(`${baseURL}/core/file-uploads-demo`, { timeout: 15_000 });
  const fileInput = page.getByLabel("Choose a file");
  await fileInput.setInputFiles({
    name: "too-large.txt",
    mimeType: "text/plain",
    buffer: Buffer.alloc(500 * 1024 + 1, "x"),
  });
  await expect(page.getByText("Choose a file that is 500 KB or smaller.")).toBeVisible();
  await expect(page.getByRole("group", { name: "Selected attachment" })).toBeHidden();
  await expect(fileInput).toHaveValue("");

  await fileInput.setInputFiles({
    name: "project-brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Private project brief"),
  });
  await expect(page.getByText("project-brief.txt", { exact: true })).toBeVisible();
  const selectedAttachment = page.getByRole("group", { name: "Selected attachment" });
  await expect(selectedAttachment).toHaveAttribute("data-state", "idle");
  await selectedAttachment.getByRole("button", { name: "Remove project-brief.txt" }).click();
  await expect(selectedAttachment).toBeHidden();

  await fileInput.setInputFiles({
    name: "project-brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Private project brief"),
  });
  await page.getByRole("button", { name: "Upload file" }).click();

  const fileRow = page
    .getByRole("listitem", { includeHidden: true })
    .filter({ hasText: "project-brief.txt" });
  await expect(fileRow).toBeVisible();
  await expect(fileRow.getByRole("group", { name: "project-brief.txt" })).toHaveAttribute(
    "data-state",
    "done",
  );
  await expect(fileRow.getByRole("link", { name: "Download" })).toHaveAttribute(
    "href",
    /\/api\/files\//,
  );

  await fileRow.getByRole("button", { name: "Delete project-brief.txt" }).click();
  const deleteDialog = page.getByRole("alertdialog", { name: "Delete file?" });
  await expect(deleteDialog).toBeVisible();
  await expect(fileRow).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(fileRow.getByRole("button", { name: "Delete project-brief.txt" })).toBeFocused();

  await fileRow.getByRole("button", { name: "Delete project-brief.txt" }).click();
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete file" }).click();
  await expect(fileRow).toBeHidden();
  await expect(page.getByText("No files uploaded yet.")).toBeVisible();
});
