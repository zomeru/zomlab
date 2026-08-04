import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUpThroughApi } from "../helpers/auth-session";

test("email authentication preserves its session and cookie contract", async ({
  baseURL,
  request,
}) => {
  const email = `auth-contract-${randomUUID()}@test.local`;
  const password = "contract-password-123";

  const signup = await signUpThroughApi(request, {
    name: "Contract User",
    email,
    password,
  });
  expect(signup.status()).toBe(200);
  const signupBody = await signup.json();
  expect(signupBody).toMatchObject({ user: { email, name: "Contract User" } });

  const cookies = (await request.storageState()).cookies;
  const sessionCookie = cookies.find((cookie) => cookie.name.includes("session_token"));
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });

  const session = await request.get("/api/auth/get-session");
  expect(session.status()).toBe(200);
  const sessionBody = await session.json();
  expect(sessionBody).toMatchObject({ user: { email } });

  const signout = await request.post("/api/auth/sign-out", {
    data: {},
    headers: { Origin: baseURL as string },
  });
  expect(signout.status()).toBe(200);

  const clearedSession = await request.get("/api/auth/get-session");
  expect(clearedSession.status()).toBe(200);
  expect(await clearedSession.json()).toBeNull();

  const failedSignin = await request.post("/api/auth/sign-in/email", {
    data: { email, password: "wrong-password" },
  });
  expect(failedSignin.ok()).toBe(false);

  const sessionAfterFailedSignin = await request.get("/api/auth/get-session");
  expect(sessionAfterFailedSignin.status()).toBe(200);
  expect(await sessionAfterFailedSignin.json()).toBeNull();
});
