import { auth } from "@zomlab/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { UserMenu } from "./user-menu";

export async function ProfileButton() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();

  return <UserMenu name={user.name ?? "User"} email={user.email} initial={initial} />;
}
