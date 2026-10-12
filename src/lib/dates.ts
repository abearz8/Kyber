const DAY_MS = 86_400_000;

function parseISO(iso: string): Date {
  // Parse YYYY-MM-DD as local midnight to avoid timezone shifts
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function todayMidnight(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysUntil(iso: string): number {
  const target = parseISO(iso).getTime();
  const today = todayMidnight().getTime();
  return Math.round((target - today) / DAY_MS);
}

export function fmtFull(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function fmtShort(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function fmtMonthDay(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export function relativeLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 0) return `In ${d} day${d > 1 ? "s" : ""}`;
  return `${Math.abs(d)} day${Math.abs(d) > 1 ? "s" : ""} ago`;
}

export function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Start of the week (Monday) for a given ISO date */
export function weekStart(iso: string): string {
  const d = parseISO(iso);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return isoFromDate(d);
}

/** All 7 days of a week starting Monday */
export function weekDays(iso: string): string[] {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 7 days starting from (and including) a given date — used for rolling week view */
export function nextSevenDays(from: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
}

/** All days in a calendar month grid (fills to 42 cells, Mon-start) */
export function monthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const prefix = startDow === 0 ? 6 : startDow - 1; // shift to Mon-start

  const cells: (string | null)[] = [];
  for (let i = 0; i < prefix; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function fmtMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
