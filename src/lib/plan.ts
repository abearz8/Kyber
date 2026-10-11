import type { Course, PersonalEvent, StudyTask } from "./types";
import { allStudyTasks } from "./studyplan";

export type PlanItemKind = "course" | "study" | "personal";

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
  personalId?: string; // set for personal events (deletable)
  studyId?: string; // set for study tasks (checkable)
}

const PERSONAL_COLORS: Record<string, string> = {
  personal: "#8a8a8a",
  work: "#8a8a8a",
  sport: "#8a8a8a",
  social: "#8a8a8a",
  appointment: "#8a8a8a",
  study: "#e9a319",
  other: "#8a8a8a",
};

function hhmmToMin(hhmm?: string): number {
  if (!hhmm) return 12 * 60;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function fmtTime(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Default slot for a course event by type.
function courseSlot(type: string): { startMin: number; durationMin: number } {
  if (type === "exam") return { startMin: 9 * 60, durationMin: 120 };
  if (type === "lab") return { startMin: 14 * 60, durationMin: 120 };
  return { startMin: 23 * 60 + 59, durationMin: 0 }; // deadline at 11:59 PM
}

// Study blocks get afternoon slots, staggered by the step's position.
function studySlot(index: number): { startMin: number; durationMin: number } {
  const base = 16 * 60; // 4:00 PM
  return { startMin: base + (index % 3) * 75, durationMin: 60 };
}

/** All plan items for a single ISO date, time-ordered. */
export function planItemsForDate(
  courses: Course[],
  personalEvents: PersonalEvent[],
  date: string
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
      });
    }
  }

  const studyTasks = allStudyTasks(courses).filter((t) => t.date === date);
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
      durationMin: slot.durationMin,
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
      color: PERSONAL_COLORS[p.kind] ?? "#8a8a8a",
      date,
      startMin,
      durationMin: Math.max(0, endMin - startMin),
      timeLabel: p.start ? fmtTime(startMin) + (p.end ? `–${fmtTime(endMin)}` : "") : "All day",
      subtitle: p.kind.charAt(0).toUpperCase() + p.kind.slice(1),
      personalId: p.id,
    });
  }

  return items.sort((a, b) => a.startMin - b.startMin);
}

export const STUDY_TINT = "#e9a319";

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
