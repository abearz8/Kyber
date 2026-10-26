import type { Course, CourseEvent, EventType } from "./types";
import { daysUntil } from "./dates";

/** Short "12 quizzes · 2 exams · grade weights" summary per course; honest when empty. */
export function summarizeCourseEvents(course: Course): string {
  if (course.events.length === 0) return course.gradeComponents.length > 0 ? "No deadlines found · grade weights" : "No deadlines found";
  const counts: Record<string, number> = {};
  for (const e of course.events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  const plural: Record<string, [string, string]> = {
    quiz: ["quiz", "quizzes"], exam: ["exam", "exams"], assignment: ["assignment", "assignments"],
    lab: ["lab", "labs"], reading: ["reading", "readings"],
  };
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type, n]) => {
      const forms = plural[type];
      return `${n} ${forms ? forms[n === 1 ? 0 : 1] : type}`;
    });
  if (course.gradeComponents.length > 0) parts.push("grade weights");
  return parts.join(" · ");
}

/** Week number of the semester, counted from the earliest event across all courses. */
export function semesterWeek(courses: Course[]): number {
  const dates = courses.flatMap((c) => c.events.map((e) => e.date)).filter(Boolean).sort();
  if (!dates.length) return 1;
  return Math.max(1, Math.floor(-daysUntil(dates[0]) / 7) + 1);
}

export function typeClass(type: EventType): string {
  if (type === "quiz" || type === "assignment") return "assignment";
  if (type === "exam") return "exam";
  if (type === "lab") return "lab";
  return "reading";
}

export function typeLabel(type: EventType): string {
  const map: Record<EventType, string> = {
    quiz: "Quiz",
    assignment: "Assignment",
    exam: "Exam",
    lab: "Lab",
    reading: "Reading",
  };
  return map[type] || type;
}

/** Inject courseId onto events and return events that are today or future */
export function upcoming(course: Course): CourseEvent[] {
  return course.events
    .map((e) => ({ ...e, courseId: course.id }))
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function nextExam(course: Course): CourseEvent | null {
  return upcoming(course).find((e) => e.type === "exam") ?? null;
}

export function nextEvent(course: Course): CourseEvent | null {
  return upcoming(course)[0] ?? null;
}

/** All upcoming events across multiple courses, sorted by date */
export function allUpcoming(courses: Course[]): CourseEvent[] {
  return courses
    .flatMap((c) =>
      c.events.map((e) => ({
        ...e,
        courseId: c.id,
      }))
    )
    .filter((e) => daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Events on a specific ISO date across all courses */
export function eventsOnDate(courses: Course[], iso: string): CourseEvent[] {
  return courses
    .flatMap((c) => c.events.map((e) => ({ ...e, courseId: c.id })))
    .filter((e) => e.date === iso)
    .sort((a, b) => {
      // exams first, then by type
      const order: Record<EventType, number> = {
        exam: 0,
        quiz: 1,
        assignment: 2,
        lab: 3,
        reading: 4,
      };
      return (order[a.type] ?? 5) - (order[b.type] ?? 5);
    });
}
