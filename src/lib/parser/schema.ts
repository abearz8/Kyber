/**
 * JSON schema for Claude structured extraction + normalization.
 * Port of sources/syllabus_parser/schema.py
 */

import type { Course, GradeComponent, CourseEvent, Policy, PaletteColor } from "../types";
import { PALETTE } from "../types";
import { anchorAndFilterDates } from "../academicCalendar";

export { PALETTE };

const COMPONENT_TYPES = ["assignment", "exam", "lab", "quiz"] as const;
const EVENT_TYPES = ["reading", "assignment", "quiz", "exam", "lab"] as const;

// The JSON schema Claude must fill (via tool use / structured output)
export const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    code: { type: "string", description: "Course code, e.g. 'PSYC 101'. Empty string if unknown." },
    title: { type: "string", description: "Full course title." },
    term: { type: "string", description: "Term, e.g. 'Fall 2026'. Empty string if unknown." },
    instructor: { type: "string", description: "Instructor name. Empty string if unknown." },
    targetGrade: { type: "number", description: "Grade goal stated in syllabus, else 85." },
    subjects: {
      type: "array",
      description: "Topics/units the course covers, in schedule order.",
      items: { type: "string" },
    },
    tips: {
      type: "array",
      description: "Short, concrete tips for doing well (exam style, workload quirks, what's weighted heavily).",
      items: { type: "string" },
    },
    studyMethod: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "A study approach that fits how this course is graded." },
        why: { type: "string", description: "One sentence on why it fits." },
      },
      required: ["name", "why"],
    },
    gradeComponents: {
      type: "array",
      description: "Every graded component with its weight.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          weight: { type: "number", description: "Percent of final grade (0-100)." },
          type: { type: "string", enum: [...COMPONENT_TYPES] },
          count: { type: "integer", description: "Number of individual items. 1 if unknown." },
          dropLowest: { type: "integer", description: "How many lowest are dropped. 0 if none." },
        },
        required: ["name", "weight", "type", "count", "dropLowest"],
      },
    },
    events: {
      type: "array",
      description: "Every dated deadline, exam, quiz, lab, or reading.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", enum: [...EVENT_TYPES] },
          title: { type: "string" },
          date: {
            type: "string",
            description:
              "ISO date YYYY-MM-DD. If no exact date but a period/range is given (e.g. an exam scheduled within an exam period), use the START of that period. Empty string only if there is no date or period at all.",
          },
          dateConfirmed: {
            type: "boolean",
            description: "true if the date is stated exactly; false if inferred from a period/range or week number.",
          },
          dateNote: {
            type: "string",
            description: "When the date is not exact, the human-readable period, e.g. 'Registrar-scheduled; exam period Dec 10–22'. Empty otherwise.",
          },
          weight: { type: "number", description: "Percent of grade; 0 for readings." },
          component: { type: "string", description: "The gradeComponents name this belongs to, or empty string." },
        },
        required: ["type", "title", "date", "weight", "component"],
      },
    },
    policies: {
      type: "array",
      description: "Notable policies (late penalty, attendance, exam format).",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
      },
    },
    classMeetings: {
      type: "object",
      description: "When the class meets each week.",
      additionalProperties: false,
      properties: {
        days: {
          type: "array",
          description: "Days of the week the class meets, e.g. ['Mon','Wed','Fri'].",
          items: { type: "string", enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        },
        startTime: { type: "string", description: "Class start time, e.g. '10:30 AM'." },
        room: { type: "string", description: "Room or location, if stated." },
      },
      required: ["days"],
    },
    recurringAssignments: {
      type: "array",
      description: "Assignments that recur on the same day every week (e.g. weekly problem sets due every Thursday). Only include if the syllabus explicitly states a recurring pattern.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          type: { type: "string", enum: ["reading","assignment","quiz","lab"] },
          dayOfWeek: { type: "string", enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
          startDate: { type: "string", description: "ISO date of first occurrence." },
          endDate: { type: "string", description: "ISO date of last occurrence." },
          weight: { type: "number", description: "Weight per item; 0 if unknown." },
          component: { type: "string" },
        },
        required: ["title","type","dayOfWeek","startDate","endDate","weight","component"],
      },
    },
  },
  required: [
    "code", "title", "term", "instructor", "targetGrade",
    "subjects", "tips", "studyMethod", "gradeComponents", "events", "policies",
  ],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function slugify(text: string, fallback = "item"): string {
  const s = (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return s || fallback;
}

function toNum(v: unknown, def = 0): number {
  const n = Number(v);
  return isNaN(n) ? def : n;
}

const DOW_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// Raw extraction shape (what Claude returns)
export interface RawExtraction {
  code?: string;
  title?: string;
  term?: string;
  instructor?: string;
  targetGrade?: number;
  subjects?: string[];
  tips?: string[];
  studyMethod?: { name?: string; why?: string };
  gradeComponents?: Array<{
    name?: string;
    weight?: number;
    type?: string;
    count?: number;
    dropLowest?: number;
  }>;
  events?: Array<{
    type?: string;
    title?: string;
    date?: string;
    dateConfirmed?: boolean;
    dateNote?: string;
    weight?: number;
    component?: string;
  }>;
  policies?: Array<{ label?: string; value?: string }>;
  classMeetings?: { days?: string[]; startTime?: string; room?: string };
  recurringAssignments?: Array<{
    title?: string;
    type?: string;
    dayOfWeek?: string;
    startDate?: string;
    endDate?: string;
    weight?: number;
    component?: string;
  }>;
}

/**
 * Normalize raw Claude extraction into the app's Course shape.
 * Port of normalize_and_validate() in schema.py
 */
export function normalize(
  raw: RawExtraction,
  color: string = PALETTE[0],
  today?: string
): Course {
  // Reference date for anchoring extracted dates into the current academic
  // year. Defaults to "now" so uploads are always current.
  let ref = new Date();
  if (today && ISO_DATE.test(today)) {
    const [ty, tm, td] = today.split("-").map(Number);
    ref = new Date(ty, tm - 1, td);
  }
  const code = (raw.code || "").trim() || "COURSE";
  const title = (raw.title || "").trim() || code;
  const cid = slugify(code, "course");

  // Grade components
  const seenIds = new Set<string>();
  const components: GradeComponent[] = [];
  for (const c of raw.gradeComponents || []) {
    const name = (c.name || "").trim();
    if (!name) continue;
    let compId = slugify(name, `comp${components.length}`);
    while (seenIds.has(compId)) compId += "x";
    seenIds.add(compId);

    const ctype = COMPONENT_TYPES.includes(c.type as typeof COMPONENT_TYPES[number])
      ? (c.type as GradeComponent["type"])
      : "assignment";
    const count = Math.max(1, Math.round(toNum(c.count, 1)));
    const drop = Math.max(0, Math.round(toNum(c.dropLowest, 0)));

    const comp: GradeComponent = {
      id: compId,
      name,
      weight: Math.round(toNum(c.weight, 0) * 100) / 100,
      type: ctype,
      count,
      scores: Array(count).fill(null),
    };
    if (drop > 0) comp.dropLowest = drop;
    components.push(comp);
  }

  const nameToId = new Map(components.map((c) => [c.name.toLowerCase(), c.id]));

  // Events — only keep those with valid ISO dates
  const events: CourseEvent[] = [];
  for (let i = 0; i < (raw.events || []).length; i++) {
    const e = raw.events![i];
    const date = (e.date || "").trim();
    if (!ISO_DATE.test(date)) continue;

    const etype = EVENT_TYPES.includes(e.type as typeof EVENT_TYPES[number])
      ? (e.type as CourseEvent["type"])
      : "assignment";

    const ev: CourseEvent = {
      id: `${cid}-e${i}`,
      type: etype,
      title: (e.title || "Untitled").trim(),
      date,
      weight: Math.round(toNum(e.weight, 0) * 100) / 100,
      courseId: cid,
    };
    const compName = (e.component || "").trim().toLowerCase();
    if (compName && nameToId.has(compName)) {
      ev.component = nameToId.get(compName);
    }
    // Tentative date (inferred from an exam period, not stated exactly): flag it
    // so the UI can mark it, and carry the period wording for display.
    if (e.dateConfirmed === false) ev.estimated = true;
    const dateNote = (e.dateNote || "").trim();
    if (dateNote) ev.dateNote = dateNote;
    events.push(ev);
  }
  // Expand recurring assignments into individual dated events
  const rawRecurring = raw.recurringAssignments || [];
  let recurringIndex = events.length;
  for (const r of rawRecurring) {
    const title = (r.title || "").trim();
    const startDate = (r.startDate || "").trim();
    const endDate = (r.endDate || "").trim();
    const dow = typeof r.dayOfWeek === "string" ? (DOW_MAP[r.dayOfWeek] ?? -1) : -1;
    if (!title || !ISO_DATE.test(startDate) || !ISO_DATE.test(endDate) || dow < 0) continue;

    const etype = EVENT_TYPES.includes(r.type as typeof EVENT_TYPES[number])
      ? (r.type as CourseEvent["type"])
      : "assignment";
    const compName = (r.component || "").trim().toLowerCase();
    const compId = compName && nameToId.has(compName) ? nameToId.get(compName) : undefined;
    const weight = Math.round(toNum(r.weight, 0) * 100) / 100;

    // Walk from startDate to endDate, emitting one event per matching weekday
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const cur = new Date(start);
    // Advance to first matching weekday
    while (cur.getDay() !== dow && cur <= end) cur.setDate(cur.getDate() + 1);

    while (cur <= end) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      const ev: CourseEvent = {
        id: `${cid}-r${recurringIndex}`,
        type: etype,
        title,
        date: iso,
        weight,
        courseId: cid,
        recurringPattern: { dayOfWeek: dow, endDate },
      };
      if (compId) ev.component = compId;
      events.push(ev);
      recurringIndex++;
      cur.setDate(cur.getDate() + 7);
    }
  }

  // Anchor every extracted date into the current academic year (fixing stale
  // or mis-parsed years) and keep only deadlines within the next ~8 months.
  const normalizedEvents = anchorAndFilterDates(events, ref).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Class meetings
  const rawMeetings = raw.classMeetings;
  let classMeetings: Course["classMeetings"] | undefined;
  if (rawMeetings && (rawMeetings.days || []).length > 0) {
    const days = (rawMeetings.days || [])
      .map((d) => DOW_MAP[d])
      .filter((n): n is number => n !== undefined);
    if (days.length > 0) {
      classMeetings = { days };
      if (rawMeetings.startTime) classMeetings.startTime = rawMeetings.startTime;
      if (rawMeetings.room) classMeetings.room = rawMeetings.room;
    }
  }

  const subjects = (raw.subjects || [])
    .map((s) => s.trim())
    .filter(Boolean);

  const sm = raw.studyMethod || {};
  const studyMethod = {
    name: (sm.name || "Active recall + spaced practice").trim(),
    why: (sm.why || "Short, spaced review sessions beat re-reading.").trim(),
  };

  let target = toNum(raw.targetGrade, 85);
  if (target < 50 || target > 100) target = 85;

  const tips = (raw.tips || []).map((t) => t.trim()).filter(Boolean);
  const policies: Policy[] = (raw.policies || [])
    .filter((p) => (p.label || "").trim() && (p.value || "").trim())
    .map((p) => ({ label: p.label!.trim(), value: p.value!.trim() }));

  // Guard against the model literally returning "unknown"/"<UNKNOWN>" for a
  // missing term, which would otherwise show through to the UI.
  const rawTerm = (raw.term || "").trim();
  const term = rawTerm && !/^<?\s*unknown\s*>?$/i.test(rawTerm) ? rawTerm : "This term";

  const course: Course = {
    id: cid,
    code,
    title,
    term,
    instructor: (raw.instructor || "").trim() || "Instructor",
    color,
    targetGrade: Math.round(target),
    currentTopic: subjects[0] || title,
    studyMethod,
    gradeComponents: components,
    events: normalizedEvents,
    policies,
    subjects,
    tips,
  };
  if (classMeetings) course.classMeetings = classMeetings;
  return course;
}
