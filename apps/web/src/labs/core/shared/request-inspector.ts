import { client } from "~/lib/api";

export interface RequestInspection {
  cacheControl: string;
  durationMs: number;
  name: string;
  requestId: string;
  security: string;
  serverTiming: string;
  status: number;
  version: string;
}

export async function inspectVersionRequest(): Promise<RequestInspection> {
  const startedAt = performance.now();
  const response = await client.api.version.$get();
  const durationMs = performance.now() - startedAt;

  if (!response.ok) {
    throw new Error(`Version request failed with status ${response.status}`);
  }

  const data = await response.json();

  return {
    cacheControl: response.headers.get("cache-control") ?? "Not set",
    durationMs,
    name: data.name,
    requestId: response.headers.get("x-request-id") ?? "Not exposed locally",
    security: response.headers.get("x-content-type-options") ?? "Not exposed locally",
    serverTiming: response.headers.get("server-timing") ?? "Not exposed locally",
    status: response.status,
    version: data.version,
  };
}
