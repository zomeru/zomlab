import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    appName: "ZomLab",
    children: "Click me",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomClass: Story = {
  args: {
    className: "rounded bg-blue-600 px-4 py-2 text-white",
    children: "Styled Button",
  },
};
