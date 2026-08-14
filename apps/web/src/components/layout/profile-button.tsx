"use client";

import { Link } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth/client";
import { Button } from "@zomlab/ui/components/button";
import { Skeleton } from "@zomlab/ui/components/skeleton";
import { UserMenu } from "./user-menu";

export function ProfileButton() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending) {
    return (
      <div className="grid size-8 place-items-center" role="status" aria-label="Loading account">
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" static>
        <Link to="/login" search={{ redirect: undefined }}>
          Sign in
        </Link>
      </Button>
    );
  }

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();

  return <UserMenu name={user.name ?? "User"} email={user.email ?? ""} initial={initial} />;
}
