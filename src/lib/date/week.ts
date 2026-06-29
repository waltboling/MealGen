const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getCurrentWeekStart(date = new Date()) {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return toDateKey(utc);
}

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return toDateKey(new Date(date.getTime() + days * DAY_MS));
}

export function getWeekDays(weekStartDate: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(weekStartDate, index);
    const date = new Date(`${dateKey}T00:00:00.000Z`);

    return {
      dateKey,
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC"
      }),
      dateLabel: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC"
      })
    };
  });
}
