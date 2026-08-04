import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign up — ZomLab" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
