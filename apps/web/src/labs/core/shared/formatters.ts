const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  second: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

const DECIMAL_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const BYTE_UNITS = ["Bytes", "KB", "MB", "GB", "TB"] as const;

export function formatDate(value: string | Date): string {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return DATE_TIME_FORMATTER.format(new Date(value));
}

export function formatTime(value: string | Date): string {
  return TIME_FORMATTER.format(new Date(value));
}

export function formatDuration(milliseconds: number): string {
  return `${DECIMAL_FORMATTER.format(milliseconds)} ms`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** index;

  return `${DECIMAL_FORMATTER.format(value)} ${BYTE_UNITS[index]}`;
}
