"use client";

import { Link } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth";
import { useEffect, useState } from "react";
import { UserMenu } from "./user-menu";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export function ProfileButton() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then((result) => {
        const session = result?.data ?? null;
        setUser(session?.user ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid size-8 place-items-center rounded-md text-muted-foreground">
        <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();

  return <UserMenu name={user.name ?? "User"} email={user.email ?? ""} initial={initial} />;
}
