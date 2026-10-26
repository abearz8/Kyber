import type { Course, CourseEvent, StudyTask, PlanAdjustment, RescheduleMode } from "./types";
import { daysUntil, addDays, isoToday, maxIso, minIso } from "./dates";
import { submittedProgress } from "./grades";

export type Adjustments = Record<string, PlanAdjustment>;

// A "major" event worth preparing for: any exam, or a heavy assignment/lab.
export function isMajor(e: CourseEvent): boolean {
  return e.type === "exam" || e.weight >= 15;
}

/** The next major upcoming event for a course (exam or heavy deliverable). */
export function nextMajor(course: Course): CourseEvent | null {
  return (
    course.events
      .map((e) => ({ ...e, courseId: course.id }))
      .filter((e) => daysUntil(e.date) >= 0 && isMajor(e))
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

// Prep-step templates per event type — three tiers matching user's study block pref.
const EXAM_STEPS = [
  { label: "Review lecture notes", minutes: 45 },
  { label: "Work through practice problems", minutes: 50 },
  { label: "Do a past exam under time", minutes: 60 },
  { label: "Build a one-page summary sheet", minutes: 30 },
];

const DELIVERABLE_STEPS = [
  { label: "Outline and gather sources", minutes: 40 },
  { label: "Draft the main sections", minutes: 60 },
  { label: "Revise and finalise", minutes: 45 },
];

const EXAM_STEPS_SHORT = [
  { label: "Review lecture notes", minutes: 20 },
  { label: "Work through practice problems", minutes: 25 },
  { label: "Do a past exam under time", minutes: 30 },
  { label: "Build a one-page summary sheet", minutes: 20 },
];

const DELIVERABLE_STEPS_SHORT = [
  { label: "Outline and gather sources", minutes: 20 },
  { label: "Draft the main sections", minutes: 30 },
  { label: "Revise and finalise", minutes: 20 },
];

const EXAM_STEPS_LONG = [
  { label: "Review lecture notes", minutes: 60 },
  { label: "Work through practice problems", minutes: 90 },
  { label: "Do a past exam under time", minutes: 90 },
  { label: "Build a one-page summary sheet", minutes: 45 },
];

const DELIVERABLE_STEPS_LONG = [
  { label: "Outline and gather sources", minutes: 45 },
  { label: "Draft the main sections", minutes: 90 },
  { label: "Revise and finalise", minutes: 60 },
];

function pickSteps(isExam: boolean, studyBlock?: string) {
  if (studyBlock === "short") return isExam ? EXAM_STEPS_SHORT : DELIVERABLE_STEPS_SHORT;
  if (studyBlock === "long") return isExam ? EXAM_STEPS_LONG : DELIVERABLE_STEPS_LONG;
  return isExam ? EXAM_STEPS : DELIVERABLE_STEPS;
}

/**
 * Generate prep steps for a course's next major event, spread evenly from today
 * through the day before the event — so there is always a first step to do now.
 *
 * `adjustments` (from "Reschedule this week") are applied AFTER the id is built,
 * so ids — and therefore completion state — stay stable across reschedules.
 */
export function studyTasksForCourse(
  course: Course,
  studyBlock?: string,
  adjustments?: Adjustments
): StudyTask[] {
  const target = nextMajor(course);
  if (!target) return [];
  const steps = pickSteps(target.type === "exam", studyBlock);
  const today = isoToday();
  const window = Math.max(0, daysUntil(target.date) - 1); // last step the day before
  const n = steps.length;

  return steps.map((step, i) => {
    const offset = n === 1 ? 0 : Math.round((i * window) / (n - 1));
    const id = `study-${course.id}-${target.id}-${i}`;
    const adj = adjustments?.[id];
    return {
      id,
      courseId: course.id,
      courseCode: course.code,
      courseColor: course.color,
      label: step.label,
      minutes: adj?.durationMin ?? step.minutes,
      targetEventId: target.id,
      targetTitle: target.title,
      targetDate: target.date,
      // A pinned date never lands in the past — "nothing's lost".
      date: adj?.date ? maxIso(adj.date, today) : addDays(today, offset),
    };
  });
}

/** All study tasks across every course. */
export function allStudyTasks(
  courses: Course[],
  studyBlock?: string,
  adjustments?: Adjustments
): StudyTask[] {
  return courses.flatMap((c) => studyTasksForCourse(c, studyBlock, adjustments));
}

// ─── Reschedule this week ────────────────────────────────────────────────────

/**
 * Pure: compute the merged adjustment map for a reschedule.
 * - "lighter": every remaining study block from `fromDate` on is shortened to
 *   75% (never below 15 min).
 * - "push": study blocks inside the window move one day later, capped at the
 *   window end and the day before their target event (the last day absorbs).
 */
export function rescheduleAdjustments(
  tasks: StudyTask[], // already adjusted (allStudyTasks with current adjustments)
  existing: Adjustments,
  mode: RescheduleMode,
  fromDate: string,
  completedIds: Set<string>,
  windowDays = 7
): Adjustments {
  const next: Adjustments = { ...existing };
  const windowEnd = addDays(fromDate, windowDays - 1);

  for (const t of tasks) {
    if (completedIds.has(t.id)) continue;
    if (t.date < fromDate) continue;

    if (mode === "lighter") {
      const durationMin = Math.max(15, Math.round(t.minutes * 0.75));
      if (durationMin === t.minutes) continue;
      next[t.id] = { ...(next[t.id] ?? {}), durationMin };
    } else {
      if (t.date > windowEnd) continue;
      const cap = minIso(windowEnd, addDays(t.targetDate, -1));
      const moved = minIso(addDays(t.date, 1), cap);
      if (moved <= t.date) continue;
      next[t.id] = { ...(next[t.id] ?? {}), date: moved };
    }
  }
  return next;
}

/** Drop overrides whose task no longer exists (target passed, course deleted…). */
export function pruneAdjustments(adjustments: Adjustments, tasks: StudyTask[]): Adjustments {
  const ids = new Set(tasks.map((t) => t.id));
  const out: Adjustments = {};
  for (const [id, adj] of Object.entries(adjustments)) {
    if (ids.has(id)) out[id] = adj;
  }
  return out;
}

/** Preview copy for the reschedule sheet. */
export function previewReschedule(
  tasks: StudyTask[],
  existing: Adjustments,
  mode: RescheduleMode,
  fromDate: string,
  completedIds: Set<string>,
  windowDays = 7
): { affected: number; minutesSaved: number } {
  const next = rescheduleAdjustments(tasks, existing, mode, fromDate, completedIds, windowDays);
  let affected = 0;
  let minutesSaved = 0;
  for (const t of tasks) {
    const before = existing[t.id];
    const after = next[t.id];
    if (!after || after === before) continue;
    if (mode === "lighter" && after.durationMin !== undefined && after.durationMin !== t.minutes) {
      affected++;
      minutesSaved += t.minutes - after.durationMin;
    } else if (mode === "push" && after.date !== undefined && after.date !== t.date) {
      affected++;
    }
  }
  return { affected, minutesSaved };
}

/**
 * Course readiness for its next major event (0–100). Driven mostly by how many
 * prep steps are done, blended with how much of the course is already graded.
 * Process Flow p.17 — "How is this calculated?".
 */
export function readiness(course: Course, completedIds: Set<string>): number | null {
  const target = nextMajor(course);
  if (!target) return null;
  const tasks = studyTasksForCourse(course);
  const doneFraction =
    tasks.length === 0
      ? 0
      : tasks.filter((t) => completedIds.has(t.id)).length / tasks.length;
  const gradedFactor = Math.min(submittedProgress(course), 100) / 100;
  const value = doneFraction * 75 + gradedFactor * 15 + 10;
  return Math.min(95, Math.round(value));
}

export function readinessExplainer(course: Course): string {
  const target = nextMajor(course);
  if (!target) return "No major assessment coming up — you're clear for now.";
  const tasks = studyTasksForCourse(course);
  return `Readiness blends how many of your ${tasks.length} prep steps for "${target.title}" are done with how much of ${course.code} is already graded. Finish the steps to move it up — it never drops on its own.`;
}
