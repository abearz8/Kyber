/**
 * JSON schema for Claude structured extraction + normalization.
 * Port of sources/syllabus_parser/schema.py
 */

import type { Course, GradeComponent, CourseEvent, Policy, PaletteColor } from "../types";
import { PALETTE } from "../types";

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
          date: { type: "string", description: "ISO date YYYY-MM-DD. Empty string if no date." },
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
    weight?: number;
    component?: string;
  }>;
  policies?: Array<{ label?: string; value?: string }>;
}

/**
 * Normalize raw Claude extraction into the app's Course shape.
 * Port of normalize_and_validate() in schema.py
 */
export function normalize(
  raw: RawExtraction,
  color: string = PALETTE[0],
  _today?: string
): Course {
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
    events.push(ev);
  }
  events.sort((a, b) => a.date.localeCompare(b.date));

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

  return {
    id: cid,
    code,
    title,
    term: (raw.term || "").trim() || "This term",
    instructor: (raw.instructor || "").trim() || "Instructor",
    color,
    targetGrade: Math.round(target),
    currentTopic: subjects[0] || title,
    studyMethod,
    gradeComponents: components,
    events,
    policies,
    subjects,
    tips,
  };
}
