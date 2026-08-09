export function isDeployedEnvironment(appEnv: string) {
  return appEnv === "staging" || appEnv === "production";
}

function isLocalAuthUrl(authUrl: string) {
  const { hostname } = new URL(authUrl);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isDeployedAuthEnvironment(appEnv: string, authUrl: string) {
  return isDeployedEnvironment(appEnv) && !isLocalAuthUrl(authUrl);
}
