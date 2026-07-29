import { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [getAbsolutePath("@storybook/addon-essentials")],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")));
}

export default config;
