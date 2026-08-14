import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Callout, CodeContainer, DemoPanel, TableWrapper } from "./docs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import {
  DesktopSidebarTrigger,
  SidebarDesktop,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarNav,
  SidebarProvider,
} from "./sidebar";

const meta = {
  title: "Design system/Composite patterns",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MenusAndOverlays: Story = {
  render: () => (
    <div className="flex min-h-72 flex-wrap items-start gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuItem disabled>Team settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet>
        <SheetTrigger asChild>
          <Button>Open navigation sheet</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Browse labs and documentation.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Example navigation" className="space-y-1 p-4">
            <a
              className="block rounded-md bg-sidebar-accent px-3 py-2 font-medium"
              href="#overview"
            >
              Overview
            </a>
            <a className="block rounded-md px-3 py-2 text-muted-foreground" href="#demo">
              Demo
            </a>
          </nav>
        </SheetContent>
      </Sheet>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete workspace</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes the workspace and its notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete workspace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button disabled>Saving…</Button>
    </div>
  ),
};

export const ResponsiveNavigation: Story = {
  parameters: { viewport: { defaultViewport: "desktop" } },
  render: () => (
    <SidebarProvider>
      <div className="flex h-[32rem] w-full max-w-4xl overflow-hidden rounded-xl bg-background shadow-surface">
        <SidebarDesktop className="top-0 h-full">
          <SidebarNav aria-label="Sidebar example">
            <SidebarGroup>
              <SidebarGroupLabel>Core</SidebarGroupLabel>
              <SidebarMenu>
                <li>
                  <a className="block rounded-md bg-sidebar-accent px-3 py-2" href="#overview">
                    Getting started
                  </a>
                </li>
                <li>
                  <a className="block rounded-md px-3 py-2 text-muted-foreground" href="#crud">
                    CRUD
                  </a>
                </li>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarNav>
        </SidebarDesktop>
        <div className="min-w-0 flex-1 p-6">
          <DesktopSidebarTrigger />
          <h2 className="mt-8 text-2xl font-semibold">Documentation workspace</h2>
          <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
            The navigation preserves its text-led hierarchy and can collapse fully off-canvas.
          </p>
        </div>
      </div>
    </SidebarProvider>
  ),
};

export const DocumentationPatterns: Story = {
  render: () => (
    <article className="w-full max-w-3xl">
      <Callout>
        Use semantic documentation patterns to keep technical content readable in both themes.
      </Callout>
      <CodeContainer label="apps/web/src/example.ts">
        <pre className="overflow-x-auto p-4 font-mono text-sm">
          <code>{`const result = await client.api.notes.$get();`}</code>
        </pre>
      </CodeContainer>
      <TableWrapper>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="p-3">Layer</th>
              <th className="p-3">Responsibility</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-t p-3">Service</td>
              <td className="border-t p-3">
                Ownership and business rules with deliberately long content that demonstrates local
                table overflow.
              </td>
            </tr>
          </tbody>
        </table>
      </TableWrapper>
      <DemoPanel>
        <Card>
          <CardHeader>
            <CardTitle>Live result</CardTitle>
            <CardDescription>Representative embedded demo state.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>Request completed successfully.</Alert>
          </CardContent>
        </Card>
      </DemoPanel>
    </article>
  ),
};
