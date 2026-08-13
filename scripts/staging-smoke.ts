import { pathToFileURL } from "node:url";

const DEFAULT_STAGING_URL = "https://zomlab-staging.zomer.workers.dev";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

interface StagingSmokeResult {
  healthRequestId: string | null;
  version: string;
  versionRequestId: string | null;
}

function endpoint(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

async function requestJson(
  baseUrl: string,
  path: string,
  fetcher: Fetcher,
  accessHeaders: Record<string, string>,
): Promise<{ body: unknown; requestId: string | null }> {
  const response = await fetcher(endpoint(baseUrl, path), {
    headers: { accept: "application/json", ...accessHeaders },
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location") ?? "";
    if (location.includes("cloudflareaccess.com")) {
      throw new Error(
        "Staging is Cloudflare Access protected. Set CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET for a service token allowed by the staging Access policy.",
      );
    }
  }

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }

  return { body: await response.json(), requestId: response.headers.get("x-request-id") };
}

function isHealthResponse(value: unknown): value is {
  status: "ok";
  timestamp: string;
  uptime: number;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.status === "ok" &&
    typeof candidate.timestamp === "string" &&
    !Number.isNaN(Date.parse(candidate.timestamp)) &&
    typeof candidate.uptime === "number" &&
    candidate.uptime >= 0
  );
}

function isVersionResponse(value: unknown): value is { name: string; version: string } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === "string" && typeof candidate.version === "string";
}

export async function runStagingSmoke(
  baseUrl = DEFAULT_STAGING_URL,
  fetcher: Fetcher = fetch,
): Promise<StagingSmokeResult> {
  const clientId = process.env.CF_ACCESS_CLIENT_ID;
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  const accessHeaders: Record<string, string> = {};
  if (clientId && clientSecret) {
    accessHeaders["CF-Access-Client-Id"] = clientId;
    accessHeaders["CF-Access-Client-Secret"] = clientSecret;
  }
  const [health, version] = await Promise.all([
    requestJson(baseUrl, "/api/health", fetcher, accessHeaders),
    requestJson(baseUrl, "/api/version", fetcher, accessHeaders),
  ]);

  if (!isHealthResponse(health.body)) {
    throw new Error("GET /api/health returned an invalid response contract");
  }
  if (!isVersionResponse(version.body) || version.body.name !== "zomlab-api") {
    throw new Error("GET /api/version returned an invalid response contract");
  }

  return {
    healthRequestId: health.requestId,
    version: version.body.version,
    versionRequestId: version.requestId,
  };
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  const baseUrl = process.argv[2] ?? DEFAULT_STAGING_URL;
  const result = await runStagingSmoke(baseUrl);
  console.log(`Staging healthy: ${baseUrl} · version ${result.version}`);
  if (result.healthRequestId || result.versionRequestId) {
    console.log(
      `Request IDs: ${result.healthRequestId ?? "n/a"}, ${result.versionRequestId ?? "n/a"}`,
    );
  }
}
