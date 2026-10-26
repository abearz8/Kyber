import type { Course, StudyTask } from "./types";
import { addDays } from "./dates";

export interface Unit {
  index: number; // 0-based
  title: string;
  start: string; // ISO, inclusive
  end: string; // ISO, exclusive
  readings: number;
  steps: number;
  onFinal: boolean;
}

export interface UnitsInfo {
  units: Unit[];
  total: number;
  currentIndex: number;
  termStart: string;
  termEnd: string;
  anchored: boolean; // false when no dates existed and the window is a guess
  hasFinal: boolean;
}

const DAY_MS = 86_400_000;

function toTime(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Season start for a date with no course dates to anchor to. */
function seasonStart(today: string): string {
  const [y, m] = today.split("-").map(Number);
  if (m >= 8) return `${y}-09-01`;
  if (m >= 5) return `${y}-05-01`;
  return `${y}-01-06`;
}

/** Window the units are spread across. Never parses `course.term` (stale years). */
export function termWindow(course: Course, today: string): { start: string; end: string; anchored: boolean } {
  const dates = course.events.map((e) => e.date).filter(Boolean).sort();
  if (dates.length > 0) {
    const start = dates[0];
    let end = dates[dates.length - 1];
    if (toTime(end) - toTime(start) < 28 * DAY_MS) end = addDays(start, 13 * 7);
    return { start, end, anchored: true };
  }
  const start = seasonStart(today);
  return { start, end: addDays(start, 13 * 7), anchored: false };
}

/**
 * Spread a course's subjects evenly across its term window and work out which
 * unit "this week" falls in. Returns null when the syllabus listed no subjects.
 */
export function deriveUnits(course: Course, today: string, studyTasks: StudyTask[] = []): UnitsInfo | null {
  const subjects = course.subjects.filter((s) => s.trim());
  if (subjects.length === 0) return null;

  const { start, end, anchored } = termWindow(course, today);
  const total = subjects.length;
  const span = Math.max(DAY_MS, toTime(end) - toTime(start));
  const unitLen = span / total;

  const exams = course.events.filter((e) => e.type === "exam").sort((a, b) => a.date.localeCompare(b.date));
  const final = exams.find((e) => /final/i.test(e.title)) ?? (exams.length ? exams[exams.length - 1] : null);
  const midterm = exams.find((e) => /midterm|mid-term|mid term|test 1/i.test(e.title)) ?? null;
  const hasFinal = !!final;

  const units: Unit[] = subjects.map((title, i) => {
    const s = new Date(toTime(start) + Math.round(i * unitLen));
    const e = new Date(toTime(start) + Math.round((i + 1) * unitLen));
    const sIso = isoOf(s);
    const eIso = isoOf(e);
    const inWindow = (d: string) => d >= sIso && d < eIso;
    const readings = course.events.filter((ev) => ev.type === "reading" && inWindow(ev.date)).length;
    const steps = studyTasks.filter((t) => t.courseId === course.id && inWindow(t.date)).length;
    const onFinal = hasFinal && (!midterm || sIso >= midterm.date);
    return { index: i, title, start: sIso, end: eIso, readings, steps, onFinal };
  });

  const elapsed = toTime(today) - toTime(start);
  const currentIndex = Math.min(total - 1, Math.max(0, Math.floor(elapsed / unitLen)));

  return { units, total, currentIndex, termStart: start, termEnd: end, anchored, hasFinal };
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
