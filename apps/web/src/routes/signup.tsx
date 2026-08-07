import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "~/lib/auth.function";
import { AuthForm } from "~/components/auth/auth-form";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="py-12">
      <AuthForm mode="signup" />
    </div>
  );
}
