"use client";

import { Link } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth/client";
import { UserMenu } from "./user-menu";

export function ProfileButton() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending) {
    return (
      <div className="grid size-8 place-items-center rounded-md text-muted-foreground">
        <div
          aria-label="Loading account"
          role="status"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        to="/login"
        search={{ redirect: undefined }}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();

  return <UserMenu name={user.name ?? "User"} email={user.email ?? ""} initial={initial} />;
}
