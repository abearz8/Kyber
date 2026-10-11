// Per-course dot/calendar-tint palette (Process Flow appendix A).
// Amber (#e9a319) is reserved for the single action per screen, so it is
// intentionally NOT a course colour.
export const PALETTE = [
  "#e8784a", // terracotta
  "#5aa6e6", // blue
  "#3faf76", // green
  "#987be8", // purple
  "#d3a608", // gold
] as const;

export type PaletteColor = (typeof PALETTE)[number];

export type ComponentType = "assignment" | "exam" | "lab" | "quiz";
export type EventType = "reading" | "assignment" | "quiz" | "exam" | "lab";

export interface GradeComponent {
  id: string;
  name: string;
  weight: number;
  type: ComponentType;
  count: number;
  scores: (number | null)[];
  dropLowest?: number;
}

export interface CourseEvent {
  id: string;
  type: EventType;
  title: string;
  date: string; // ISO YYYY-MM-DD
  weight: number;
  component?: string; // GradeComponent.id
  courseId: string;
}

export interface Policy {
  label: string;
  value: string;
}

export type Semester = 1 | 2;

export interface Course {
  id: string;
  code: string;
  title: string;
  term: string;
  instructor: string;
  color: string;
  targetGrade: number;
  currentTopic: string;
  studyMethod: { name: string; why: string };
  gradeComponents: GradeComponent[];
  events: CourseEvent[];
  policies: Policy[];
  subjects: string[];
  tips: string[];
  semester?: Semester; // which semester this course belongs to (demo data)
}

export type Tab = "courses" | "now" | "plan";
export type PlanView = "month" | "week" | "day";

// Personal (user-added) plan items — Process Flow p.25 "Add to your plan" (7 types)
export type PersonalEventKind =
  | "personal"
  | "work"
  | "sport"
  | "social"
  | "appointment"
  | "study"
  | "other";

export interface PersonalEvent {
  id: string;
  kind: PersonalEventKind;
  title: string;
  date: string; // ISO YYYY-MM-DD
  start?: string; // "HH:MM"
  end?: string; // "HH:MM"
}

// How a week feels — Process Flow p.22 check-in
export type Mood = "light" | "good" | "busy" | "overwhelmed";

export interface AppState {
  courses: Course[];
  activeTab: Tab;
  activeSemester: Semester;
  planView: PlanView;
  completedTaskIds: string[];
  gradeSims: Record<string, Record<string, (number | null)[]>>;
  selectedCourseId: string | null;
  selectedDate: string | null; // ISO date for plan day-drill
  personalEvents: PersonalEvent[];
  weekMood: Mood | null;
  weekNotes: string;
  hasOnboarded: boolean; // true once the reveal has been shown
}

export type AppAction =
  | { type: "LOAD_COURSES"; courses: Course[] }
  | { type: "ADD_COURSES"; courses: Course[] }
  | { type: "DELETE_COURSE"; courseId: string }
  | { type: "SET_TAB"; tab: Tab }
  | { type: "SET_SEMESTER"; semester: Semester }
  | { type: "SET_PLAN_VIEW"; view: PlanView }
  | { type: "SET_SELECTED_COURSE"; courseId: string | null }
  | { type: "SET_SELECTED_DATE"; date: string | null }
  | { type: "COMPLETE_TASK"; taskId: string }
  | { type: "UNCOMPLETE_TASK"; taskId: string }
  | { type: "ADD_PERSONAL_EVENT"; event: PersonalEvent }
  | { type: "DELETE_PERSONAL_EVENT"; id: string }
  | { type: "SET_MOOD"; mood: Mood }
  | { type: "SET_WEEK_NOTES"; notes: string }
  | { type: "SET_ONBOARDED"; value: boolean }
  | {
      type: "SET_GRADE_SIM";
      courseId: string;
      componentId: string;
      scores: (number | null)[];
    }
  | { type: "RESET" };

// A generated study-prep step for an upcoming exam/deadline (Process Flow p.12/18)
export interface StudyTask {
  id: string; // stable, used in completedTaskIds
  courseId: string;
  courseCode: string;
  courseColor: string;
  label: string; // e.g. "Review lectures 1–6"
  minutes: number;
  targetEventId: string; // the exam/deadline this prepares for
  targetTitle: string;
  date: string; // ISO date this step is scheduled for
}

export interface NowTask {
  id: string;
  eventId: string;
  courseId: string;
  courseCode: string;
  courseColor: string;
  title: string;
  date: string;
  type: EventType;
  weight: number;
  daysUntil: number;
  priority: number;
  bucket: "today" | "tomorrow" | "upcoming";
}
