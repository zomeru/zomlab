import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GettingStarted from "./page";

describe("GettingStarted", () => {
  it("shows pnpm as the only package-manager command surface", () => {
    const page = renderToStaticMarkup(<GettingStarted />);

    expect(page).toContain("pnpm install");
    expect(page).not.toMatch(/\bbun\b/i);
  });
});
