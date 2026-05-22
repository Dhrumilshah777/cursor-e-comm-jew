const DISPLAY_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoLike = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  let parsed = Date.parse(isoLike);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  const daysMatch = trimmed.match(/^(\d+)\s*days?$/i);
  if (daysMatch) {
    const days = Number.parseInt(daysMatch[1]!, 10);
    if (Number.isFinite(days)) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + days);
      return date;
    }
  }

  return null;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-IN", DISPLAY_FORMAT);
}

export function addDaysToDateInput(value: string, extraDays: number): string | null {
  const base = parseFlexibleDate(value);
  if (!base) return null;
  const result = new Date(base);
  result.setDate(result.getDate() + extraDays);
  return formatDisplayDate(result);
}

export function addDaysFromToday(daysFromToday: number, extraDays = 0): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday + extraDays);
  return formatDisplayDate(date);
}

export function customerDeliveryDateFromShiprocketEdd(
  shiprocketEdd: string | null | undefined,
  bufferDays = 2,
): string {
  if (!shiprocketEdd?.trim() || shiprocketEdd === "To be confirmed") {
    return "To be confirmed";
  }
  const withBuffer = addDaysToDateInput(shiprocketEdd, bufferDays);
  return withBuffer ?? shiprocketEdd;
}
