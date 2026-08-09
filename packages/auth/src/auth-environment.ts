export function isDeployedEnvironment(appEnv: string) {
  return appEnv === "staging" || appEnv === "production";
}
