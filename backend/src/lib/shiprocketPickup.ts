/** Extract warehouse pickup date/time from Shiprocket schedule_pickup response. */
export type ParsedPickupSchedule = {
  dateLabel: string | null;
  timeLabel: string | null;
  scheduledAt: Date | null;
};

function readStringField(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function responsePayload(fullResponse: unknown): Record<string, unknown> | null {
  if (!fullResponse || typeof fullResponse !== "object") return null;
  const top = fullResponse as Record<string, unknown>;
  const nested = top.response;
  if (nested && typeof nested === "object") {
    return nested as Record<string, unknown>;
  }
  return top;
}

export function parseShiprocketPickupSchedule(
  fullResponse: unknown,
): ParsedPickupSchedule {
  const payload = responsePayload(fullResponse);
  if (!payload) {
    return { dateLabel: null, timeLabel: null, scheduledAt: null };
  }

  const dateLabel = readStringField(payload, [
    "pickup_scheduled_date",
    "pickup_date",
    "scheduled_date",
  ]);
  const timeLabel = readStringField(payload, [
    "pickup_scheduled_time",
    "pickup_time",
    "pickup_slot",
    "scheduled_time",
    "pickup_time_slot",
  ]);

  let scheduledAt: Date | null = null;
  if (dateLabel) {
    const combined = timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
    const parsed = Date.parse(combined);
    if (!Number.isNaN(parsed)) {
      scheduledAt = new Date(parsed);
    }
  }

  return { dateLabel, timeLabel, scheduledAt };
}
