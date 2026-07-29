import type { RcFile } from "syncpack";

const config: RcFile = {
  source: ["package.json", "apps/*/package.json", "packages/*/package.json"],
  semverGroups: [
    {
      range: "",
      label: "exact",
      dependencies: ["typescript", "turbo"],
    },
  ],
  versionGroups: [
    {
      label: "Local workspace packages",
      dependencies: ["@zomlab/*"],
      pinVersion: "*",
    },
  ],
};

export default config;
