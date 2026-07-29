import type { Meta, StoryObj } from "@storybook/react";
import { Code } from "./code";

const meta = {
  title: "UI/Code",
  component: Code,
  args: {
    children: "console.log('hello world')",
  },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inline: Story = {
  args: {
    children: "npm install",
    className: "rounded bg-gray-100 px-1.5 py-0.5 text-sm",
  },
};
