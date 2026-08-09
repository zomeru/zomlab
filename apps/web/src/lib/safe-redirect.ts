const DEFAULT_REDIRECT = "/";

export function getSafeRedirect(redirect: unknown, fallback = DEFAULT_REDIRECT) {
  if (typeof redirect !== "string" || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return fallback;
  }

  return redirect;
}
