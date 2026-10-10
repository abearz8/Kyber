import type { Course, NowTask, EventType } from "./types";
import { daysUntil } from "./dates";

function urgencyFactor(days: number): number {
  if (days === 0) return 10;
  if (days === 1) return 8;
  if (days === 2) return 6;
  if (days <= 5) return 4;
  if (days <= 7) return 2;
  return 0;
}

function bucket(days: number): "today" | "tomorrow" | "upcoming" {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return "upcoming";
}

/**
 * Generate prioritised Now-tab tasks from all courses.
 * Only includes events in the next 7 days (or past-due today).
 */
export function generateNowTasks(courses: Course[]): NowTask[] {
  const tasks: NowTask[] = [];

  for (const course of courses) {
    for (const event of course.events) {
      const days = daysUntil(event.date);
      if (days < 0 || days > 7) continue;

      // Skip low-weight readings (not worth surfacing)
      if (event.type === "reading" && event.weight === 0 && days > 1) continue;

      const factor = urgencyFactor(days);
      const priority = event.weight > 0 ? event.weight * factor : factor * 0.5;

      tasks.push({
        id: `now-${event.id}`,
        eventId: event.id,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        title: event.type === "exam"
          ? `Exam: ${event.title}`
          : event.type === "reading"
          ? `Read: ${event.title}`
          : event.title,
        date: event.date,
        type: event.type as EventType,
        weight: event.weight,
        daysUntil: days,
        priority,
        bucket: bucket(days),
      });
    }
  }

  return tasks.sort((a, b) => b.priority - a.priority || a.daysUntil - b.daysUntil);
}

export function topTask(tasks: NowTask[]): NowTask | null {
  return tasks.find((t) => !t) ?? tasks[0] ?? null;
}
