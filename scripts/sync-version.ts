import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const root = JSON.parse(readFileSync("package.json", "utf-8"));
const version = root.version as string;

const workspaces = [
  ...readdirSync("apps").map((d) => `apps/${d}/package.json`),
  ...readdirSync("packages").map((d) => `packages/${d}/package.json`),
];

for (const file of workspaces) {
  const pkg = JSON.parse(readFileSync(file, "utf-8"));
  pkg.version = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`${pkg.name} → ${version}`);
}
