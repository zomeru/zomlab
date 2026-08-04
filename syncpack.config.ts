import type { RcFile } from "syncpack";

const config: RcFile = {
  source: ["package.json", "{apps,packages}/*/package.json"],
  semverGroups: [
    {
      range: "",
      label: "exact",
      dependencies: ["turbo"],
    },
  ],
  versionGroups: [
    {
      label: "Local workspace packages",
      dependencies: ["@zomlab/*"],
      pinVersion: "workspace:*",
    },
  ],
};

export default config;
