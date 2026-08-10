import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "~/components/auth/auth-form";
import { getSession } from "~/lib/auth.function";
import { getSafeRedirect } from "~/lib/safe-redirect";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ preload, search }) => {
    if (preload) {
      return;
    }

    const session = await getSession();
    if (session) {
      throw redirect({ href: getSafeRedirect(search.redirect, "/") });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  return (
    <div className="py-12">
      <AuthForm mode="login" redirect={search.redirect} />
    </div>
  );
}
