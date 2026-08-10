"use client";

import { Link, useRouter } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth/client";
import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader } from "@zomlab/ui/components/card";
import { Input } from "@zomlab/ui/components/input";
import { Label } from "@zomlab/ui/components/label";
import { useEffect, useRef, useState } from "react";
import { getSafeRedirect } from "~/lib/safe-redirect";

type AuthFormProps = {
  mode: "login" | "signup";
  redirect?: string;
};

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      {visible ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.6 10.6a2 2 0 0 0 2.8 2.8m-8.9-8.9C3 5.6 2 7.6 2 9s3.6 6 10 6c1.5 0 2.8-.2 4-.6M6.2 6.2C4.5 7.1 3.4 8.2 2 9c1.5 2.4 4.9 6 10 6 1.2 0 2.3-.2 3.3-.5M9.9 4.2C10.6 4.1 11.3 4 12 4c6.4 0 10 4.6 10 6 0 .8-1.2 2.8-3.4 4.3"
          />
        </>
      ) : (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"
          />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

export function AuthForm({ mode, redirect }: AuthFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const isLogin = mode === "login";
  const title = isLogin ? "Sign in" : "Sign up";
  const description = isLogin ? "Access your notes." : "Create an account to start writing notes.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmPasswordError(null);

    if (!isLogin && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    const { error: authError } = isLogin
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name });

    if (authError) {
      setError(authError.message ?? `Failed to ${isLogin ? "sign in" : "sign up"}`);
      setLoading(false);
      return;
    }

    await router.invalidate({ sync: true });
    await router.navigate({ href: getSafeRedirect(redirect), replace: true });
  }

  async function handleSocialSignIn(provider: "google" | "github") {
    setError(null);
    setSocialLoading(true);

    const { error: authError } = await authClient.signIn.social({
      provider,
      callbackURL: getSafeRedirect(redirect),
    });

    if (authError) {
      setError(
        authError.message ??
          `Failed to continue with ${provider === "google" ? "Google" : "GitHub"}`,
      );
      setSocialLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <Card className="shadow-overlay">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading || socialLoading}>
            <fieldset disabled={!hydrated || loading || socialLoading} className="contents">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    type={passwordVisible ? "text" : "password"}
                    id="password"
                    name="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                  >
                    <PasswordVisibilityIcon visible={passwordVisible} />
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      ref={confirmPasswordRef}
                      type={confirmPasswordVisible ? "text" : "password"}
                      id="confirm-password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      required
                      aria-invalid={Boolean(confirmPasswordError)}
                      aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmPasswordError(null);
                      }}
                      className="pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={
                        confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"
                      }
                      aria-pressed={confirmPasswordVisible}
                      onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                      className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                    >
                      <PasswordVisibilityIcon visible={confirmPasswordVisible} />
                    </Button>
                  </div>
                  {confirmPasswordError ? (
                    <p
                      id="confirm-password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {confirmPasswordError}
                    </p>
                  ) : null}
                </div>
              )}

              {error && (
                <Alert variant="destructive" role="alert">
                  {error}
                </Alert>
              )}

              <div className="mt-5 space-y-3">
                <Button type="submit" className="w-full">
                  {loading ? (isLogin ? "Signing in…" : "Creating account…") : title}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialSignIn("google")}
                  className="w-full"
                >
                  <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M21.8 12.2c0-.7-.1-1.3-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3.2-4.3 3.2-7.3Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.4 13.8A6 6 0 0 1 6.1 12c0-.6.1-1.3.3-1.8V7.6H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.4l3.3-2.6Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 6.1c1.5 0 2.9.5 4 1.5l3-3A9.9 9.9 0 0 0 3.1 7.6l3.3 2.6C7.2 7.8 9.4 6.1 12 6.1Z"
                    />
                  </svg>
                  {socialLoading ? "Connecting to Google…" : "Continue with Google"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialSignIn("github")}
                  className="w-full"
                >
                  <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.7.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.9.1-.7.4-1.1.6-1.3-2.2-.3-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.7.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.5 4.9.4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.4 6.9-5.2 6.9-9.7C22 6.6 17.5 2 12 2Z" />
                  </svg>
                  {socialLoading ? "Connecting to GitHub…" : "Continue with GitHub"}
                </Button>
              </div>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            No account?{" "}
            <Link
              to="/signup"
              search={{ redirect }}
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
              search={{ redirect }}
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
