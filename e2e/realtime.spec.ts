import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("shares WebSocket broadcasts and presence across two tabs", async ({
  baseURL,
  context,
  page,
}) => {
  test.setTimeout(60_000);

  const webSocketConsoleErrors: string[] = [];
  const captureWebSocketError = (message: { text(): string; type(): string }) => {
    if (message.type() === "error" && message.text().includes("WebSocket")) {
      webSocketConsoleErrors.push(message.text());
    }
  };
  page.on("console", captureWebSocketError);

  await page.goto("/signup?redirect=%2Frealtime%2Fwebsockets");
  await page.getByLabel("Name").fill("Realtime Learner");
  await page.getByLabel("Email").fill(`realtime-${randomUUID()}@test.local`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();
  await expect(page).toHaveURL(`${baseURL}/realtime/websockets`, { timeout: 15_000 });
  await expect(page.getByRole("status").filter({ hasText: "Connected" })).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "WebSocket connection encountered an error" }),
  ).toHaveCount(0);

  const secondTab = await context.newPage();
  secondTab.on("console", captureWebSocketError);
  await secondTab.goto("/realtime/websockets");
  await expect(secondTab.getByRole("status").filter({ hasText: "Connected" })).toBeVisible();

  const message = `two-tab-${randomUUID()}`;
  await page.getByLabel("Message").fill(message);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("list", { name: "WebSocket messages" })).toContainText(message);
  await expect(secondTab.getByRole("list", { name: "WebSocket messages" })).toContainText(message);

  await Promise.all([page.goto("/realtime/presence"), secondTab.goto("/realtime/presence")]);
  await expect(page.getByText(/1 user · 2 sessions/)).toBeVisible();
  await expect(secondTab.getByText(/1 user · 2 sessions/)).toBeVisible();

  await secondTab.close();
  await expect(page.getByText(/1 user · 1 session/)).toBeVisible();

  await page.goto("/realtime/sse");
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  await page.getByRole("button", { name: "Start stream" }).click();
  await expect(page.getByRole("status").filter({ hasText: "streaming" })).toBeVisible();
  await expect(page.getByRole("list", { name: "SSE events" })).toContainText("heartbeat", {
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Stop stream" }).click();
  await expect(page.getByRole("status").filter({ hasText: "stopped" })).toBeVisible();

  for (const route of ["/realtime/live-chat", "/realtime/notifications"]) {
    await page.goto(route);
    await expect(page.getByRole("status").filter({ hasText: "Connected" })).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: "WebSocket connection encountered an error" }),
    ).toHaveCount(0);
  }

  expect(webSocketConsoleErrors).toEqual([]);
});
