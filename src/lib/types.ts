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
  recurringPattern?: { dayOfWeek: number; endDate: string };
  estimated?: boolean;
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
  semester?: Semester;
  classMeetings?: { days: number[]; startTime?: string; room?: string };
}

export type Tab = "courses" | "now" | "plan";
export type PlanView = "month" | "week" | "day";

// Personal (user-added) plan items
export type PersonalEventKind =
  | "class"
  | "deadline"
  | "study_block"
  | "fun"
  // legacy kinds kept for backwards compatibility with stored data
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
  selectedDate: string | null;
  personalEvents: PersonalEvent[];
  aiTasks: AiTask[];
  weekMood: Mood | null;
  weekNotes: string;
  hasOnboarded: boolean;
  settings: AppSettings;
}

export interface AppSettings {
  defaultTab: Tab;
  defaultPlanView: PlanView;
  weekStartsOn: 0 | 1;
  showCompletedTasks: boolean;
}

export type AppAction =
  | { type: "LOAD_COURSES"; courses: Course[] }
  | { type: "ADD_COURSES"; courses: Course[] }
  | { type: "DELETE_COURSE"; courseId: string }
  | { type: "UPDATE_COURSE_COLOR"; courseId: string; color: string }
  | { type: "SET_TAB"; tab: Tab }
  | { type: "SET_SEMESTER"; semester: Semester }
  | { type: "SET_PLAN_VIEW"; view: PlanView }
  | { type: "SET_SELECTED_COURSE"; courseId: string | null }
  | { type: "SET_SELECTED_DATE"; date: string | null }
  | { type: "COMPLETE_TASK"; taskId: string }
  | { type: "UNCOMPLETE_TASK"; taskId: string }
  | { type: "ADD_PERSONAL_EVENT"; event: PersonalEvent }
  | { type: "DELETE_PERSONAL_EVENT"; id: string }
  | { type: "SET_AI_TASKS"; tasks: AiTask[] }
  | { type: "SET_MOOD"; mood: Mood }
  | { type: "SET_WEEK_NOTES"; notes: string }
  | { type: "SET_ONBOARDED"; value: boolean }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> }
  | { type: "HYDRATE"; state: AppState }
  | {
      type: "SET_GRADE_SIM";
      courseId: string;
      componentId: string;
      scores: (number | null)[];
    }
  | { type: "RESET" };

// AI-generated weekly prep task (simulates output of a weekly AI scheduling script)
export interface AiTask {
  id: string;
  courseId?: string;
  courseCode?: string;
  courseColor: string;
  title: string;
  kind: "reading" | "review" | "lab" | "practice" | "fun";
  date: string; // ISO YYYY-MM-DD, within next 14 days
  durationMin: number;
  description: string;
  generatedAt: string; // ISO date AI script last ran
}

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
