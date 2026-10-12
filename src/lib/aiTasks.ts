import type { Course, AiTask } from "./types";
import { addDays, daysUntil, isoToday } from "./dates";

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoToDow(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function addTaskIfRoom(
  buckets: Map<string, number>,
  task: AiTask,
  limit = 3
): boolean {
  const count = buckets.get(task.date) ?? 0;
  if (count >= limit) return false;
  buckets.set(task.date, count + 1);
  return true;
}

const READING_DESCRIPTIONS: Record<string, string> = {
  default:
    "Skim the assigned reading before class so you can follow the lecture without scrambling. Identify the two or three main ideas and jot one question to bring up.",
};

const REVIEW_DESCRIPTIONS: Record<string, string> = {
  default:
    "While today's class is still fresh, spend 15–20 minutes rewriting the key points from memory. Anything you can't recall cleanly is exactly what needs more attention.",
};

const LAB_DESCRIPTIONS: Record<string, string> = {
  default:
    "Read the lab procedure in full before showing up — know what you're measuring and why. Pre-fill any theory sections you can so you're not racing the clock during lab time.",
};

const PRACTICE_DESCRIPTIONS: Record<string, string> = {
  default:
    "Pick 5–8 problems from the section you found hardest this week. Work them without looking at notes first; only check once you've committed to an answer.",
};

function getDesc(map: Record<string, string>, key: string): string {
  return map[key] ?? map["default"];
}

export function generateAiTasks(
  courses: Course[],
  today: string = isoToday()
): AiTask[] {
  const tasks: AiTask[] = [];
  const buckets = new Map<string, number>(); // date → task count
  let counter = 0;

  for (const course of courses) {
    const meetings = course.classMeetings;

    // --- Pre-class readings and post-class reviews based on meeting days ---
    if (meetings && meetings.days.length > 0) {
      for (let offset = 0; offset < 14; offset++) {
        const date = addDays(today, offset);
        const dow = isoToDow(date);

        if (meetings.days.includes(dow)) {
          // Post-class review on the class day itself
          const reviewId = `ai-review-${course.id}-${date}`;
          const reviewTask: AiTask = {
            id: reviewId,
            courseId: course.id,
            courseCode: course.code,
            courseColor: course.color,
            title: `Review today's ${course.code} notes`,
            kind: "review",
            date,
            durationMin: 20,
            description: getDesc(REVIEW_DESCRIPTIONS, course.code),
            generatedAt: today,
          };
          if (addTaskIfRoom(buckets, reviewTask)) {
            tasks.push(reviewTask);
            counter++;
          }

          // Pre-class reading the day before (if within window)
          if (offset > 0) {
            const prevDate = addDays(today, offset - 1);
            const readingTask: AiTask = {
              id: `ai-read-${course.id}-${prevDate}`,
              courseId: course.id,
              courseCode: course.code,
              courseColor: course.color,
              title: `Read before ${course.code} — ${course.subjects[Math.floor(counter / 3) % Math.max(course.subjects.length, 1)] || course.currentTopic}`,
              kind: "reading",
              date: prevDate,
              durationMin: 30,
              description: getDesc(READING_DESCRIPTIONS, course.code),
              generatedAt: today,
            };
            if (addTaskIfRoom(buckets, readingTask)) {
              tasks.push(readingTask);
            }
          }
        }
      }
    }

    // --- Lab prep for upcoming lab events ---
    const upcomingLabs = course.events.filter(
      (e) => e.type === "lab" && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 14
    );
    for (const lab of upcomingLabs.slice(0, 2)) {
      const prepDate = daysUntil(lab.date) > 1 ? addDays(lab.date, -1) : lab.date;
      if (daysUntil(prepDate) < 0) continue;
      const labTask: AiTask = {
        id: `ai-labprep-${course.id}-${lab.id}`,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        title: `Prep for ${course.code} lab`,
        kind: "lab",
        date: prepDate,
        durationMin: 40,
        description: getDesc(LAB_DESCRIPTIONS, course.code),
        generatedAt: today,
      };
      if (addTaskIfRoom(buckets, labTask)) tasks.push(labTask);
    }

    // --- Weekly practice block (once per course, mid-week) ---
    const practiceOffset = (counter % 7) + 3; // spread courses across days 3–9
    if (practiceOffset < 14) {
      const practiceDate = addDays(today, practiceOffset);
      const practiceTask: AiTask = {
        id: `ai-practice-${course.id}-${practiceDate}`,
        courseId: course.id,
        courseCode: course.code,
        courseColor: course.color,
        title: `Practice problems — ${course.code}`,
        kind: "practice",
        date: practiceDate,
        durationMin: 50,
        description: getDesc(PRACTICE_DESCRIPTIONS, course.code),
        generatedAt: today,
      };
      if (addTaskIfRoom(buckets, practiceTask)) tasks.push(practiceTask);
    }

    counter++;
  }

  // Sort by date then by title
  tasks.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return tasks;
}

export function aiTasksForDate(aiTasks: AiTask[], date: string): AiTask[] {
  return aiTasks.filter((t) => t.date === date);
}
