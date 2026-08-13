export function getRateLimitKey(headers: Headers): string | undefined {
  const clientIp =
    headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (clientIp === "::1" || clientIp?.startsWith("127.")) {
    return undefined;
  }

  return clientIp;
}
