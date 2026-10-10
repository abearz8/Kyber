export const PALETTE = [
  "#e9a319",
  "#38bdf8",
  "#34d399",
  "#a78bfa",
  "#f5c451",
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

export interface AppState {
  courses: Course[];
  activeTab: Tab;
  activeSemester: Semester;
  planView: PlanView;
  completedTaskIds: string[];
  gradeSims: Record<string, Record<string, (number | null)[]>>;
  selectedCourseId: string | null;
  selectedDate: string | null; // ISO date for plan day-drill
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
  | {
      type: "SET_GRADE_SIM";
      courseId: string;
      componentId: string;
      scores: (number | null)[];
    }
  | { type: "RESET" };

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
