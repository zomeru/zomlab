import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type GeneratePackageOptions = {
  directory: string;
  name: string;
  projectVersion: string;
  typescriptVersion: string;
  write: (message: string) => void;
};

export function generatePackage({
  directory,
  name,
  projectVersion,
  typescriptVersion,
  write,
}: GeneratePackageOptions): void {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error("Package name must be kebab-case (letters, numbers, hyphens only).");
  }

  const packageDirectory = join(directory, "packages", name);

  if (existsSync(packageDirectory)) {
    throw new Error(`Package "${name}" already exists at packages/${name}.`);
  }

  mkdirSync(join(packageDirectory, "src"), { recursive: true });
  mkdirSync(join(packageDirectory, "__tests__"), { recursive: true });

  writeFileSync(
    join(packageDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: `@zomlab/${name}`,
        version: projectVersion,
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
          "@zomlab/tsconfig": "workspace:*",
          "@zomlab/vitest-config": "workspace:*",
          typescript: typescriptVersion,
        },
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(packageDirectory, "tsconfig.json"),
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
    join(packageDirectory, "src/index.ts"),
    `export function ${toCamelCase(name)}(): string {
  return "Hello from @zomlab/${name}!";
}
`,
  );

  writeFileSync(
    join(packageDirectory, "__tests__/index.test.ts"),
    `import { describe, expect, it } from "vitest";
import { ${toCamelCase(name)} } from "../src/index.js";

describe("@zomlab/${name}", () => {
  it("should return a greeting", () => {
    expect(${toCamelCase(name)}()).toBe("Hello from @zomlab/${name}!");
  });
});
`,
  );

  write(`✓ Created package @zomlab/${name}`);
  write(`  Location: packages/${name}/`);
  write("");
  write("Next steps:");
  write("  1. pnpm install        # link new workspace");
  write("  2. pnpm check:all  # verify everything works");
}

function toCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, character: string) => character.toUpperCase());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2];

  if (!name) {
    console.error("Usage: pnpm generate:package <name>");
    process.exitCode = 1;
  } else {
    const rootPackage = JSON.parse(readFileSync("package.json", "utf-8")) as {
      devDependencies?: Record<string, string>;
      version: string;
    };

    try {
      generatePackage({
        directory: process.cwd(),
        name,
        projectVersion: rootPackage.version,
        typescriptVersion: rootPackage.devDependencies?.typescript ?? "6",
        write: (message) => console.log(message),
      });
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
}
