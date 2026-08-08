import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "~/components/auth/auth-form";
import { getSession } from "~/lib/auth.function";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="py-12">
      <AuthForm mode="login" />
    </div>
  );
}
