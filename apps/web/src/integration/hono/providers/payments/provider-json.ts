export type JsonObject = { [key: string]: unknown };

export function asObject(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function readObjectAt(value: unknown, ...path: string[]): JsonObject | undefined {
  let current = asObject(value);
  for (const key of path) {
    current = asObject(current?.[key]);
    if (!current) return undefined;
  }
  return current;
}

export function readStringAt(value: unknown, ...path: string[]): string | undefined {
  if (path.length === 0) return asString(value);
  const key = path.at(-1);
  const parent = readObjectAt(value, ...path.slice(0, -1));
  return key ? asString(parent?.[key]) : undefined;
}
