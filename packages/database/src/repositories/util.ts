type SerializeDates<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? SerializeDates<U>[]
    : T extends object
      ? { [K in keyof T]: SerializeDates<T[K]> }
      : T;

export function serializeDates<T>(value: T): SerializeDates<T> {
  if (value instanceof Date) {
    return value.toISOString() as SerializeDates<T>;
  }

  if (Array.isArray(value)) {
    return value.map(serializeDates) as SerializeDates<T>;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeDates(item)]),
    ) as SerializeDates<T>;
  }

  return value as SerializeDates<T>;
}
