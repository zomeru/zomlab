"use client";

import { useRouter } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth/client";
import { Button } from "@zomlab/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zomlab/ui/components/dropdown-menu";
import { LogOutIcon } from "lucide-react";

type UserMenuProps = {
  name: string;
  email: string;
  initial: string;
};

export function UserMenu({ name, email, initial }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    await router.navigate({ to: "/", replace: true });
    await router.invalidate({ sync: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          static
          aria-label="Account menu"
          className="rounded-full"
        >
          <span className="font-mono text-xs font-bold" aria-hidden="true">
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <span className="block truncate">{name}</span>
          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
