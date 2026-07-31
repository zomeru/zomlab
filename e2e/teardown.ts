import { execSync } from "node:child_process";

const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);

export default async function teardown() {
  try {
    execSync(`kill $(lsof -tiTCP:${E2E_PORT} -sTCP:LISTEN 2>/dev/null) 2>/dev/null`);
  } catch {
    // No process on the port — nothing to clean up.
  }
}
