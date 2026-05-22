import { parseShiprocketPickupSchedule } from "./shiprocketPickup.js";

export type ParsedShiprocketMeta = {
  expectedDelivery: string | null;
  pickupDateLabel: string | null;
  pickupTimeLabel: string | null;
  pickupScheduledAt: Date | null;
};

const ETD_KEYS = ["edd", "etd", "expected_delivery_date", "expected_delivery"];
const PICKUP_DATE_KEYS = [
  "pickup_scheduled_date",
  "pickup_date",
  "scheduled_date",
  "pickup_generated_date",
];
const PICKUP_TIME_KEYS = [
  "pickup_scheduled_time",
  "pickup_time",
  "pickup_slot",
  "scheduled_time",
  "pickup_time_slot",
];

function readStringField(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function deepFindString(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepFindString(item, keys);
      if (found) return found;
    }
    return null;
  }

  const direct = readStringField(obj, keys);
  if (direct) return direct;

  const record = obj as Record<string, unknown>;
  for (const value of Object.values(record)) {
    const found = deepFindString(value, keys);
    if (found) return found;
  }

  return null;
}

function formatDisplayDate(value: string): string {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return value;
}

function formatDisplayTime(value: string): string {
  const normalized = value.includes("T") ? value : `1970-01-01T${value}`;
  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  return value;
}

function splitDateTime(value: string): {
  dateLabel: string;
  timeLabel: string | null;
  scheduledAt: Date | null;
} {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
  if (!match) {
    return { dateLabel: formatDisplayDate(value), timeLabel: null, scheduledAt: null };
  }

  const datePart = match[1]!;
  const timePart = match[2] ?? null;
  const combined = timePart ? `${datePart}T${timePart}` : datePart;
  const parsed = Date.parse(combined);
  return {
    dateLabel: formatDisplayDate(datePart),
    timeLabel: timePart ? formatDisplayTime(timePart) : null,
    scheduledAt: Number.isNaN(parsed) ? null : new Date(parsed),
  };
}

function mergePickup(
  current: ParsedShiprocketMeta,
  dateRaw: string | null,
  timeRaw: string | null,
): ParsedShiprocketMeta {
  if (!dateRaw && !timeRaw) return current;

  if (dateRaw && /\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(dateRaw)) {
    const split = splitDateTime(dateRaw);
    return {
      ...current,
      pickupDateLabel: split.dateLabel,
      pickupTimeLabel: split.timeLabel ?? current.pickupTimeLabel,
      pickupScheduledAt: split.scheduledAt ?? current.pickupScheduledAt,
    };
  }

  let scheduledAt = current.pickupScheduledAt;
  if (dateRaw) {
    const combined = timeRaw ? `${dateRaw} ${timeRaw}` : dateRaw;
    const parsed = Date.parse(combined.replace(" ", "T"));
    if (!Number.isNaN(parsed)) {
      scheduledAt = new Date(parsed);
    }
  }

  return {
    ...current,
    pickupDateLabel: dateRaw ? formatDisplayDate(dateRaw) : current.pickupDateLabel,
    pickupTimeLabel: timeRaw
      ? formatDisplayTime(timeRaw)
      : current.pickupTimeLabel,
    pickupScheduledAt: scheduledAt,
  };
}

export function parseShiprocketMetaFromSources(
  ...sources: unknown[]
): ParsedShiprocketMeta {
  let meta: ParsedShiprocketMeta = {
    expectedDelivery: null,
    pickupDateLabel: null,
    pickupTimeLabel: null,
    pickupScheduledAt: null,
  };

  for (const source of sources) {
    if (!source) continue;

    const etdRaw = deepFindString(source, ETD_KEYS);
    if (etdRaw && !meta.expectedDelivery) {
      meta.expectedDelivery = formatDisplayDate(etdRaw);
    }

    const pickupFromSchedule = parseShiprocketPickupSchedule(source);
    if (pickupFromSchedule.dateLabel || pickupFromSchedule.timeLabel) {
      meta = mergePickup(
        meta,
        pickupFromSchedule.dateLabel,
        pickupFromSchedule.timeLabel,
      );
      if (pickupFromSchedule.scheduledAt) {
        meta.pickupScheduledAt = pickupFromSchedule.scheduledAt;
      }
    }

    const pickupDateRaw = deepFindString(source, PICKUP_DATE_KEYS);
    const pickupTimeRaw = deepFindString(source, PICKUP_TIME_KEYS);
    meta = mergePickup(meta, pickupDateRaw, pickupTimeRaw);
  }

  return meta;
}

export function mergeShiprocketMeta(
  existing: ParsedShiprocketMeta,
  incoming: ParsedShiprocketMeta,
): ParsedShiprocketMeta {
  return {
    expectedDelivery: incoming.expectedDelivery ?? existing.expectedDelivery,
    pickupDateLabel: incoming.pickupDateLabel ?? existing.pickupDateLabel,
    pickupTimeLabel: incoming.pickupTimeLabel ?? existing.pickupTimeLabel,
    pickupScheduledAt: incoming.pickupScheduledAt ?? existing.pickupScheduledAt,
  };
}

export function metaToOrderUpdate(meta: ParsedShiprocketMeta) {
  return {
    ...(meta.expectedDelivery ? { expectedDelivery: meta.expectedDelivery } : {}),
    ...(meta.pickupDateLabel ? { pickupDateLabel: meta.pickupDateLabel } : {}),
    ...(meta.pickupTimeLabel ? { pickupTimeLabel: meta.pickupTimeLabel } : {}),
    ...(meta.pickupScheduledAt ? { pickupScheduledAt: meta.pickupScheduledAt } : {}),
  };
}

export function hasShiprocketMeta(meta: ParsedShiprocketMeta): boolean {
  return Boolean(
    meta.expectedDelivery ||
      meta.pickupDateLabel ||
      meta.pickupTimeLabel ||
      meta.pickupScheduledAt,
  );
}
