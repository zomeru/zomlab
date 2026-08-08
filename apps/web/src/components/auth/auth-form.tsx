"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth";
import { useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
};

const INPUT_CLASSES =
  "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm";

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const title = isLogin ? "Sign in" : "Sign up";
  const description = isLogin ? "Access your notes." : "Create an account to start writing notes.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = isLogin
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name });

    if (authError) {
      setError(authError.message ?? `Failed to ${isLogin ? "sign in" : "sign up"}`);
      setLoading(false);
      return;
    }

    navigate({ to: "/core/crud/demo" });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <label className="block">
              <span className="text-sm font-medium text-foreground">Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASSES}
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>

          {error && (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-[background-color,transform] hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (isLogin ? "Signing in…" : "Creating account…") : title}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            No account?{" "}
            <Link
              to="/signup"
              className="font-medium text-link underline underline-offset-4 hover:opacity-80"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-link underline underline-offset-4 hover:opacity-80"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
