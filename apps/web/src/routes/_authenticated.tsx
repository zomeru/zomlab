import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "~/lib/auth.function";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location, preload }) => {
    if (preload) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const session = await getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    return { user: session.user };
  },
  component: () => <Outlet />,
});
