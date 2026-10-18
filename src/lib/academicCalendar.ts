/**
 * Academic-year date anchoring.
 *
 * Syllabi (and the LLM parser reading them) carry whatever year the document
 * was written for — often a past year, and sometimes a badly mis-extracted one
 * (we've seen 2035/2037). For a demo and for freshly-uploaded syllabi we want
 * every deadline to land in the *current* academic year: a November deadline
 * becomes this coming November, a March deadline becomes next March, etc. —
 * so everything sits within roughly the next 8 months.
 *
 * The rule: keep each date's month and day, and reassign the year to the
 * current academic year. The academic year runs August→July, so fall months
 * (Aug–Dec) map to the fall year and winter/spring months (Jan–Jul) map to the
 * following calendar year.
 */

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The fall (start) year of the academic year containing `ref`. From August
 * onward we're in an academic year that began this calendar year; before
 * August we're still in the one that began last August.
 */
export function academicFallYear(ref: Date = new Date()): number {
  return ref.getMonth() + 1 >= 8 ? ref.getFullYear() : ref.getFullYear() - 1;
}

/**
 * Remap an ISO date's YEAR to the current academic year, preserving month/day.
 * Fall months (Aug–Dec) → fall year; Jan–Jul → the following year.
 * Returns the input unchanged if it isn't a parseable YYYY-MM-DD.
 */
export function anchorToAcademicYear(iso: string, ref: Date = new Date()): string {
  const parts = iso.split("-").map(Number);
  const [, m, d] = parts;
  if (parts.length !== 3 || !m || !d) return iso;
  const fallYear = academicFallYear(ref);
  const year = m >= 8 ? fallYear : fallYear + 1;
  // Construct via Date so impossible day/month combos (e.g. Feb 29 in a
  // non-leap year) roll over to a real date instead of producing junk.
  return toISO(new Date(year, m - 1, d));
}

/**
 * True if `iso` falls within [ref − pastDays, ref + futureMonths]. Used to keep
 * only the deadlines a student actually cares about: the recent past of a
 * semester already underway through roughly the next year. The window spans a
 * full academic year (12 months) because anchoring already collapses every date
 * into the current academic year — a tighter cap wrongly dropped off-cycle
 * (summer/winter-start) courses whose deadlines land 8–11 months out.
 */
export function withinWindow(
  iso: string,
  ref: Date = new Date(),
  pastDays = 60,
  futureMonths = 12,
): boolean {
  const t = parseISO(iso).getTime();
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - pastDays).getTime();
  const end = new Date(ref.getFullYear(), ref.getMonth() + futureMonths, ref.getDate()).getTime();
  return t >= start && t <= end;
}

/**
 * Anchor every item's `date` to the current academic year, then drop anything
 * outside the window. If the filter would remove everything, the anchored-but-
 * unfiltered list is returned instead so a course never ends up with no dates.
 * Order is not guaranteed — callers that care should sort afterward.
 */
export function anchorAndFilterDates<T extends { date: string }>(
  events: T[],
  ref: Date = new Date(),
  opts: { pastDays?: number; futureMonths?: number } = {},
): T[] {
  const anchored = events.map((e) => ({ ...e, date: anchorToAcademicYear(e.date, ref) }));
  const filtered = anchored.filter((e) => withinWindow(e.date, ref, opts.pastDays, opts.futureMonths));
  return filtered.length ? filtered : anchored;
}
