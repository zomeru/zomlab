import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScaffoldHome } from "./scaffold-home";

describe("ScaffoldHome", () => {
  it("identifies the target web scaffold", () => {
    expect(renderToStaticMarkup(<ScaffoldHome />)).toContain("ZomLab migration scaffold");
  });
});
