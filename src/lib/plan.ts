import type { Course, PersonalEvent, AiTask, PersonalEventKind, PlanAdjustment } from "./types";
import { allStudyTasks } from "./studyplan";
import { addDays } from "./dates";

export type PlanItemKind = "course" | "study" | "personal" | "ai";

export interface PlanItem {
  id: string;
  kind: PlanItemKind;
  title: string;
  courseCode?: string;
  color: string; // dot / tint colour
  date: string; // ISO
  startMin: number; // minutes from midnight (for ordering + grid placement)
  durationMin: number; // 0 = a point-in-time deadline
  timeLabel: string; // e.g. "4:00 PM", or "Due 11:59 PM"
  subtitle?: string;
  eventType?: string;
  personalKind?: PersonalEventKind;
  personalId?: string; // set for personal events (deletable)
  studyId?: string; // set for study tasks (checkable)
  aiTaskId?: string; // set for AI-generated tasks
  aiDescription?: string; // detail sheet content for AI tasks
  estimated?: boolean; // course event date was inferred from week number or exam period
  dateNote?: string; // note for a tentative date, e.g. "Registrar-scheduled; exam period Dec 10–22"
}

export const PERSONAL_COLORS: Record<string, string> = {
  // new kinds
  class: "#B48CFF",
  deadline: "#FF8A7A",
  study_block: "#E9A319",
  fun: "#9CC5A1",
  // legacy kinds
  personal: "#8B8475",
  work: "#8B8475",
  sport: "#9CC5A1",
  social: "#B48CFF",
  appointment: "#8B8475",
  study: "#E9A319",
  other: "#8B8475",
};

function hhmmToMin(hhmm?: string): number {
  if (!hhmm) return 12 * 60;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function fmtTime(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** "2h 15m" / "45m" */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Default slot for a course event by type.
function courseSlot(type: string): { startMin: number; durationMin: number } {
  if (type === "exam") return { startMin: 9 * 60, durationMin: 120 };
  if (type === "lab") return { startMin: 14 * 60, durationMin: 120 };
  return { startMin: 23 * 60 + 59, durationMin: 0 }; // deadline at 11:59 PM
}

// Study blocks get afternoon slots, staggered by the step's position.
function studySlot(index: number): { startMin: number } {
  const base = 16 * 60; // 4:00 PM
  return { startMin: base + (index % 3) * 75 };
}

const AI_KIND_SLOT: Record<string, { startMin: number; durationMin: number }> = {
  reading:  { startMin: 8 * 60 + 30, durationMin: 30 },
  review:   { startMin: 17 * 60,     durationMin: 20 },
  lab:      { startMin: 13 * 60,     durationMin: 40 },
  practice: { startMin: 18 * 60,     durationMin: 50 },
  fun:      { startMin: 19 * 60,     durationMin: 60 },
};

/** All plan items for a single ISO date, time-ordered. */
export function planItemsForDate(
  courses: Course[],
  personalEvents: PersonalEvent[],
  date: string,
  aiTasks: AiTask[] = [],
  studyBlock?: string,
  adjustments?: Record<string, PlanAdjustment>
): PlanItem[] {
  const items: PlanItem[] = [];

  for (const c of courses) {
    for (const e of c.events) {
      if (e.date !== date) continue;
      const slot = courseSlot(e.type);
      items.push({
        id: `pi-${e.id}`,
        kind: "course",
        title: e.title,
        courseCode: c.code,
        color: c.color,
        date,
        startMin: slot.startMin,
        durationMin: slot.durationMin,
        timeLabel: slot.durationMin === 0 ? `Due ${fmtTime(slot.startMin)}` : fmtTime(slot.startMin),
        subtitle: c.code,
        eventType: e.type,
        estimated: e.estimated,
        dateNote: e.dateNote,
      });
    }
  }

  const studyTasks = allStudyTasks(courses, studyBlock, adjustments).filter((t) => t.date === date);
  studyTasks.forEach((t, i) => {
    const slot = studySlot(i);
    items.push({
      id: `pi-${t.id}`,
      kind: "study",
      title: t.label,
      courseCode: t.courseCode,
      color: t.courseColor,
      date,
      startMin: slot.startMin,
      durationMin: t.minutes,
      timeLabel: `${fmtTime(slot.startMin)} · ${t.minutes} min`,
      subtitle: `${t.courseCode} · study block`,
      studyId: t.id,
    });
  });

  for (const p of personalEvents) {
    if (p.date !== date) continue;
    const startMin = hhmmToMin(p.start);
    const endMin = p.end ? hhmmToMin(p.end) : startMin;
    items.push({
      id: `pi-${p.id}`,
      kind: "personal",
      title: p.title,
      color: PERSONAL_COLORS[p.kind] ?? "#8B8475",
      date,
      startMin,
      durationMin: Math.max(0, endMin - startMin),
      timeLabel: p.start ? fmtTime(startMin) + (p.end ? `–${fmtTime(endMin)}` : "") : "All day",
      subtitle: p.kind.charAt(0).toUpperCase() + p.kind.slice(1).replace("_", " "),
      personalKind: p.kind,
      personalId: p.id,
    });
  }

  // AI-generated tasks
  for (const t of aiTasks) {
    if (t.date !== date) continue;
    const slot = AI_KIND_SLOT[t.kind] ?? { startMin: 15 * 60, durationMin: 30 };
    items.push({
      id: `pi-${t.id}`,
      kind: "ai",
      title: t.title,
      courseCode: t.courseCode,
      color: t.courseColor,
      date,
      startMin: slot.startMin,
      durationMin: t.durationMin > 0 ? t.durationMin : slot.durationMin,
      timeLabel: `${fmtTime(slot.startMin)} · ${t.durationMin} min`,
      subtitle: t.courseCode ? `${t.courseCode} · AI suggestion` : "AI suggestion",
      aiTaskId: t.id,
      aiDescription: t.description,
    });
  }

  return items.sort((a, b) => a.startMin - b.startMin);
}

// ─── Multi-day range (week grid / list) ──────────────────────────────────────

export interface PlanDay {
  date: string;
  items: PlanItem[];
}

/** Consecutive days from `startDate`; each day's items time-ordered. */
export function planItemsForRange(
  courses: Course[],
  personalEvents: PersonalEvent[],
  startDate: string,
  dayCount: number,
  aiTasks: AiTask[] = [],
  studyBlock?: string,
  adjustments?: Record<string, PlanAdjustment>
): PlanDay[] {
  return Array.from({ length: dayCount }, (_, i) => addDays(startDate, i)).map((date) => ({
    date,
    items: planItemsForDate(courses, personalEvents, date, aiTasks, studyBlock, adjustments),
  }));
}

export interface RangeSummary {
  studyBlocks: number;
  focusMin: number;
  classes: number;
  due: number;
  exams: number;
}

export function isStudyLike(it: PlanItem): boolean {
  return it.kind === "study" || it.kind === "ai" || (it.kind === "personal" && (it.personalKind === "study_block" || it.personalKind === "study"));
}

export function summarizeRange(days: PlanDay[]): RangeSummary {
  const s: RangeSummary = { studyBlocks: 0, focusMin: 0, classes: 0, due: 0, exams: 0 };
  for (const d of days) {
    for (const it of d.items) {
      if (isStudyLike(it)) { s.studyBlocks++; s.focusMin += it.durationMin; }
      else if (it.kind === "personal" && it.personalKind === "class") s.classes++;
      else if (it.kind === "course") {
        if (it.eventType === "exam") s.exams++;
        else if (it.durationMin === 0) s.due++;
      }
    }
  }
  return s;
}

export function fmtRangeSummary(s: RangeSummary): string {
  const parts: string[] = [];
  if (s.studyBlocks) parts.push(`${s.studyBlocks} study block${s.studyBlocks === 1 ? "" : "s"}`);
  if (s.focusMin) parts.push(`${fmtDuration(s.focusMin)} focus`);
  if (s.classes) parts.push(`${s.classes} class${s.classes === 1 ? "" : "es"}`);
  if (s.exams) parts.push(`${s.exams} exam${s.exams === 1 ? "" : "s"}`);
  if (s.due) parts.push(`${s.due} due`);
  return parts.length ? parts.join(" · ") : "Nothing planned yet";
}

// ─── Grid geometry ───────────────────────────────────────────────────────────

export const GRID_START_MIN = 8 * 60; // 8a
export const GRID_END_MIN = 22 * 60; // 10p

export function gridHourLabels(stepHours = 2): { min: number; label: string }[] {
  const out: { min: number; label: string }[] = [];
  for (let h = GRID_START_MIN / 60; h <= GRID_END_MIN / 60; h += stepHours) {
    const label = h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`;
    out.push({ min: h * 60, label });
  }
  return out;
}

/** Pixel placement for a timed item; null for pinned (zero-duration) items. */
export function gridPosition(item: PlanItem, pxPerHour: number): { top: number; height: number } | null {
  if (item.durationMin === 0) return null;
  const start = Math.max(GRID_START_MIN, Math.min(item.startMin, GRID_END_MIN - 15));
  const end = Math.min(GRID_END_MIN, Math.max(item.startMin + item.durationMin, start + 15));
  const top = ((start - GRID_START_MIN) / 60) * pxPerHour;
  const height = Math.max(22, ((end - start) / 60) * pxPerHour);
  return { top, height };
}

export function splitPinned(items: PlanItem[]): { pinned: PlanItem[]; timed: PlanItem[] } {
  const pinned: PlanItem[] = [];
  const timed: PlanItem[] = [];
  for (const it of items) (it.durationMin === 0 ? pinned : timed).push(it);
  return { pinned, timed };
}

/** Sweep by start time; overlapping items get separate lanes. */
export function assignLanes(items: PlanItem[]): Array<{ item: PlanItem; lane: number; laneCount: number }> {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.durationMin - a.durationMin);
  const result: Array<{ item: PlanItem; lane: number; laneCount: number }> = [];
  let cluster: Array<{ item: PlanItem; lane: number; end: number }> = [];
  let clusterEnd = -1;

  const flush = () => {
    const laneCount = cluster.reduce((m, c) => Math.max(m, c.lane + 1), 1);
    for (const c of cluster) result.push({ item: c.item, lane: c.lane, laneCount });
    cluster = [];
  };

  for (const item of sorted) {
    const end = item.startMin + item.durationMin;
    if (cluster.length && item.startMin >= clusterEnd) { flush(); clusterEnd = -1; }
    const laneEnds: number[] = [];
    for (const c of cluster) laneEnds[c.lane] = Math.max(laneEnds[c.lane] ?? 0, c.end);
    let lane = 0;
    while ((laneEnds[lane] ?? 0) > item.startMin) lane++;
    cluster.push({ item, lane, end });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return result;
}

export const STUDY_TINT = "#E9A319";

// ─── Google Calendar / .ics export ─────────────────────────────────────────

function icsDate(iso: string, min = 9 * 60): string {
  const [y, m, d] = iso.split("-");
  const hh = String(Math.floor(min / 60)).padStart(2, "0");
  const mm = String(min % 60).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}00`;
}

/** Build an .ics file string for all course events across the given courses. */
export function buildICS(courses: Course[], personalEvents: PersonalEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kyber//Semester Plan//EN",
    "CALSCALE:GREGORIAN",
  ];

  const push = (uid: string, title: string, iso: string, startMin: number, durMin: number) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}@kyber`);
    lines.push(`DTSTART:${icsDate(iso, startMin)}`);
    lines.push(`DTEND:${icsDate(iso, startMin + Math.max(durMin, 30))}`);
    lines.push(`SUMMARY:${title.replace(/[\n,;]/g, " ")}`);
    lines.push("END:VEVENT");
  };

  for (const c of courses) {
    for (const e of c.events) {
      const slot = courseSlot(e.type);
      push(e.id, `${c.code}: ${e.title}`, e.date, slot.startMin, slot.durationMin);
    }
  }
  for (const p of personalEvents) {
    push(p.id, p.title, p.date, hhmmToMin(p.start), 60);
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(courses: Course[], personalEvents: PersonalEvent[]) {
  const ics = buildICS(courses, personalEvents);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kyber-plan.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
