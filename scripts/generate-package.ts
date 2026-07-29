#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const rootPkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
  devDependencies?: Record<string, string>;
};
const defaultTypeScriptVersion = "6";
const typescriptVersion = rootPkg.devDependencies?.typescript ?? defaultTypeScriptVersion;

const name = process.argv[2];

if (!name) {
  console.error("Usage: bun run generate:package <name>");
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error("Error: Package name must be kebab-case (letters, numbers, hyphens only).");
  process.exit(1);
}

const dir = `packages/${name}`;

if (existsSync(dir)) {
  console.error(`Error: Package "${name}" already exists at ${dir}.`);
  process.exit(1);
}

mkdirSync(`${dir}/src`, { recursive: true });
mkdirSync(`${dir}/__tests__`, { recursive: true });

writeFileSync(
  `${dir}/package.json`,
  `${JSON.stringify(
    {
      name: `@zomlab/${name}`,
      version: "0.1.0",
      private: true,
      type: "module",
      main: "./src/index.ts",
      types: "./src/index.ts",
      exports: {
        ".": "./src/index.ts",
      },
      scripts: {
        "check-types": "tsc --noEmit",
      },
      devDependencies: {
        "@zomlab/tsconfig": "*",
        "@zomlab/vitest-config": "*",
        typescript: typescriptVersion,
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  `${dir}/tsconfig.json`,
  `${JSON.stringify(
    {
      extends: "@zomlab/tsconfig/base.json",
      compilerOptions: {
        outDir: "./dist",
      },
      include: ["src", "__tests__"],
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  `${dir}/src/index.ts`,
  `export function ${toCamelCase(name)}(): string {
  return "Hello from @zomlab/${name}!";
}
`,
);

writeFileSync(
  `${dir}/__tests__/index.test.ts`,
  `import { describe, expect, it } from "vitest";
import { ${toCamelCase(name)} } from "../src/index.js";

describe("@zomlab/${name}", () => {
  it("should return a greeting", () => {
    expect(${toCamelCase(name)}()).toBe("Hello from @zomlab/${name}!");
  });
});
`,
);

console.log(`✓ Created package @zomlab/${name}`);
console.log(`  Location: ${dir}/`);
console.log("");
console.log("Next steps:");
console.log("  1. bun install        # link new workspace");
console.log("  2. bun run check:all  # verify everything works");

function toCamelCase(kebab: string) {
  return kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
