"use client";

import { Link, useRouter } from "@tanstack/react-router";
import { authClient } from "@zomlab/auth/client";
import { Alert } from "@zomlab/ui/components/alert";
import { Button } from "@zomlab/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader } from "@zomlab/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@zomlab/ui/components/field";
import { Input } from "@zomlab/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zomlab/ui/components/input-group";
import { EyeIcon, EyeOffIcon, MailIcon } from "lucide-react";
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
  const Icon = visible ? EyeOffIcon : EyeIcon;
  return <Icon aria-hidden="true" className="size-5" />;
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
          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading || socialLoading}>
            <fieldset disabled={!hydrated || loading || socialLoading} className="contents">
              <FieldGroup>
                {!isLogin && (
                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                    <InputGroupAddon>
                      <MailIcon aria-hidden="true" />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      name="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11"
                    />
                    <InputGroupAddon align="inline-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                        aria-pressed={passwordVisible}
                        onClick={() => setPasswordVisible((visible) => !visible)}
                        className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
                      >
                        <PasswordVisibilityIcon visible={passwordVisible} />
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                {!isLogin && (
                  <Field data-invalid={Boolean(confirmPasswordError)}>
                    <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        ref={confirmPasswordRef}
                        type={confirmPasswordVisible ? "text" : "password"}
                        id="confirm-password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        aria-invalid={Boolean(confirmPasswordError)}
                        aria-describedby={
                          confirmPasswordError ? "confirm-password-error" : undefined
                        }
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmPasswordError(null);
                        }}
                        className="pr-11"
                      />
                      <InputGroupAddon align="inline-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={
                            confirmPasswordVisible
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          aria-pressed={confirmPasswordVisible}
                          onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                          className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
                        >
                          <PasswordVisibilityIcon visible={confirmPasswordVisible} />
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                    {confirmPasswordError ? (
                      <FieldError id="confirm-password-error">{confirmPasswordError}</FieldError>
                    ) : null}
                  </Field>
                )}
              </FieldGroup>

              {error && (
                <Alert variant="destructive" role="alert">
                  {error}
                </Alert>
              )}

              <div className="mt-5 space-y-3">
                <Button type="submit" className="w-full">
                  {loading ? (isLogin ? "Signing in…" : "Creating account…") : title}
                </Button>
                <div
                  aria-hidden="true"
                  className="flex items-center gap-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span>OR</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
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
