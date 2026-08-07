import type { RcFile } from "syncpack";

const config: RcFile = {
  source: ["package.json", "{apps,packages,scripts}/*/package.json"],
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
    {
      label: "Local workspace apps",
      dependencies: ["@zomlab/legacy-web", "@zomlab/legacy-api"],
      pinVersion: "workspace:*",
    },
  ],
};

export default config;
