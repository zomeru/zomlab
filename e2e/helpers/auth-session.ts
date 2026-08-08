import type { APIRequestContext } from "@playwright/test";

export interface AuthIdentity {
  name: string;
  email: string;
  password: string;
}

export function signUpThroughApi(
  request: APIRequestContext,
  identity: AuthIdentity,
  headers?: Record<string, string>,
) {
  return request.post("/api/auth/sign-up/email", { data: identity, headers });
}
