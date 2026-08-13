import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Alert } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Checkbox } from "./checkbox";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "./empty-state";
import { Input } from "./input";
import { Label } from "./label";
import { Select } from "./select";
import { Skeleton } from "./skeleton";
import { Textarea } from "./textarea";

const meta = {
  title: "Design system/Foundations",
  component: Card,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

function CheckboxExample() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Checkbox
          id="story-notifications"
          checked={checked}
          onCheckedChange={(nextChecked) => setChecked(nextChecked === true)}
        />
        <Label htmlFor="story-notifications">Receive workspace notifications</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Notifications are {checked ? "enabled" : "disabled"}.
      </p>
    </div>
  );
}

export const Components: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Workbench controls</CardTitle>
            <Badge>Stable</Badge>
          </div>
          <CardDescription>Shared actions and form fields in their default states.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="story-title">Title</Label>
            <Input id="story-title" placeholder="A useful note" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="story-content">Content</Label>
            <Textarea id="story-content" placeholder="Capture the implementation detail…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="story-visibility">Visibility</Label>
            <Select id="story-visibility" defaultValue="team">
              <option value="private">Private</option>
              <option value="team">Team</option>
              <option value="public">Public</option>
            </Select>
          </div>
          <CheckboxExample />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Alert>Connected to the development workspace.</Alert>
        <Alert variant="destructive">The request could not be completed.</Alert>
        <EmptyState>
          <EmptyStateTitle>Nothing here yet</EmptyStateTitle>
          <EmptyStateDescription>
            Create the first record to populate this workspace.
          </EmptyStateDescription>
          <Button className="mt-4" size="sm">
            Create record
          </Button>
        </EmptyState>
        <div className="space-y-2" role="status" aria-label="Loading example">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-20" />
        </div>
      </div>
    </div>
  ),
};

export const DarkTheme: Story = {
  globals: { theme: "dark" },
  render: () => (
    <div className="rounded-2xl bg-background p-8 text-foreground">
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Dark workspace</CardTitle>
          <CardDescription>Semantic tokens keep contrast consistent.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button>Continue</Button>
          <Button variant="outline">Cancel</Button>
        </CardContent>
      </Card>
    </div>
  ),
};
