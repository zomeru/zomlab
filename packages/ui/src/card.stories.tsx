import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  args: {
    title: "Example Card",
    href: "https://example.com",
    children: "This is card content.",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomClass: Story = {
  args: {
    className: "block rounded-lg border p-4 shadow-sm",
    title: "Custom Card",
    children: "A card with custom styling.",
  },
};
