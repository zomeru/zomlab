import { test } from "@playwright/test";
import { expectSystemContract } from "../helpers/api-contract";

test("system API preserves its public contract", async ({ request }) => {
  await expectSystemContract(request);
});
