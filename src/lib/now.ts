import type { Course } from "./types";
import { daysUntil, isoToday } from "./dates";
import { allStudyTasks } from "./studyplan";

// A single actionable item on the Now tab — either a generated study block or
// a hard deadline that lands today. Process Flow p.19–20.
export interface NowItem {
  id: string; // stable id (study task id or `deadline-<eventId>`)
  kind: "study" | "deadline";
  title: string;
  courseCode: string;
  courseColor: string;
  minutes: number; // estimated effort (study) or 0 for a deadline
  note: string; // short why-line
  targetTitle?: string; // what this prepares for (study tasks)
}

export interface NowAgenda {
  items: NowItem[]; // today's plan, deadlines first then study blocks
  totalMinutes: number;
}

/** Build today's agenda: deadlines due today + study blocks scheduled today. */
export function nowAgenda(courses: Course[]): NowAgenda {
  const today = isoToday();
  const items: NowItem[] = [];

  // Deadlines due today
  for (const c of courses) {
    for (const e of c.events) {
      if (e.date !== today || daysUntil(e.date) !== 0) continue;
      if (e.type === "reading") continue;
      items.push({
        id: `deadline-${e.id}`,
        kind: "deadline",
        title: e.title,
        courseCode: c.code,
        courseColor: c.color,
        minutes: 0,
        note: e.weight > 0 ? `Due today · ${e.weight}% of grade` : "Due today",
      });
    }
  }

  // Study blocks scheduled today
  const study = allStudyTasks(courses).filter((t) => t.date === today);
  for (const t of study) {
    items.push({
      id: t.id,
      kind: "study",
      title: t.label,
      courseCode: t.courseCode,
      courseColor: t.courseColor,
      minutes: t.minutes,
      note: `Prep for ${t.targetTitle}`,
      targetTitle: t.targetTitle,
    });
  }

  const totalMinutes = items.reduce((s, i) => s + i.minutes, 0);
  return { items, totalMinutes };
}

/** The first not-yet-done item = the "Up next" hero. */
export function upNext(agenda: NowAgenda, completedIds: Set<string>): NowItem | null {
  return agenda.items.find((i) => !completedIds.has(i.id)) ?? null;
}

/** Time-of-day greeting (no name — shared demo link). */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Day summary line based on remaining work. Process Flow p.19/20. */
export function daySummary(agenda: NowAgenda, completedIds: Set<string>): string {
  const remaining = agenda.items.filter((i) => !completedIds.has(i.id));
  if (agenda.items.length === 0) return "Nothing scheduled today — enjoy the breathing room.";
  if (remaining.length === 0) return "All done for today — nice work. ✦";
  const mins = remaining.reduce((s, i) => s + i.minutes, 0);
  const timeLabel =
    mins >= 60 ? `about ${Math.round(mins / 60)} hour${mins >= 120 ? "s" : ""}` : `about ${mins} minutes`;
  if (remaining.length === 1) return `Nearly there — one thing left · ${timeLabel}`;
  return `${remaining.length} things today · ${timeLabel}`;
}
