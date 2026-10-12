"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
} from "react";
import type { AppState, AppAction, Course, AppSettings } from "@/lib/types";
import { generateAiTasks } from "@/lib/aiTasks";
import { isoToday } from "@/lib/dates";

const STORAGE_KEY = "kyber-app-state-v1";

const defaultSettings: AppSettings = {
  defaultTab: "courses",
  defaultPlanView: "week",
  weekStartsOn: 1,
  showCompletedTasks: true,
};

const defaultState: AppState = {
  courses: [],
  activeTab: "courses",
  activeSemester: 1,
  planView: "week",
  completedTaskIds: [],
  gradeSims: {},
  selectedCourseId: null,
  selectedDate: null,
  personalEvents: [],
  aiTasks: [],
  weekMood: null,
  weekNotes: "",
  hasOnboarded: false,
  userProfile: null,
  settings: defaultSettings,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_COURSES": {
      const semesters = action.courses
        .map((c) => c.semester)
        .filter((s): s is 1 | 2 => s === 1 || s === 2);
      const lowest = semesters.length ? (Math.min(...semesters) as 1 | 2) : 1;
      return {
        ...state,
        courses: action.courses,
        activeSemester: lowest,
        selectedCourseId: null,
        aiTasks: generateAiTasks(action.courses, isoToday()),
      };
    }

    case "ADD_COURSES": {
      const existingIds = new Set(state.courses.map((c) => c.id));
      const fresh = action.courses.filter((c) => !existingIds.has(c.id));
      const merged = [...state.courses, ...fresh];
      return {
        ...state,
        courses: merged,
        aiTasks: generateAiTasks(merged, isoToday()),
      };
    }

    case "SET_AI_TASKS":
      return { ...state, aiTasks: action.tasks };

    case "DELETE_COURSE": {
      const courses = state.courses.filter((c) => c.id !== action.courseId);
      return {
        ...state,
        courses,
        selectedCourseId:
          state.selectedCourseId === action.courseId
            ? null
            : state.selectedCourseId,
      };
    }

    case "UPDATE_COURSE_COLOR": {
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.courseId ? { ...c, color: action.color } : c
        ),
      };
    }

    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: { ...(state.settings ?? defaultSettings), ...action.settings },
      };
    }

    case "SET_TAB":
      return { ...state, activeTab: action.tab, selectedCourseId: null };

    case "SET_SEMESTER":
      return {
        ...state,
        activeSemester: action.semester,
        selectedCourseId: null,
      };

    case "SET_PLAN_VIEW":
      return { ...state, planView: action.view };

    case "SET_SELECTED_COURSE":
      return { ...state, selectedCourseId: action.courseId };

    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.date };

    case "COMPLETE_TASK":
      if (state.completedTaskIds.includes(action.taskId)) return state;
      return {
        ...state,
        completedTaskIds: [...state.completedTaskIds, action.taskId],
      };

    case "UNCOMPLETE_TASK":
      return {
        ...state,
        completedTaskIds: state.completedTaskIds.filter(
          (id) => id !== action.taskId
        ),
      };

    case "SET_GRADE_SIM":
      return {
        ...state,
        gradeSims: {
          ...state.gradeSims,
          [action.courseId]: {
            ...(state.gradeSims[action.courseId] || {}),
            [action.componentId]: action.scores,
          },
        },
      };

    case "ADD_PERSONAL_EVENT":
      return { ...state, personalEvents: [...state.personalEvents, action.event] };

    case "DELETE_PERSONAL_EVENT":
      return {
        ...state,
        personalEvents: state.personalEvents.filter((e) => e.id !== action.id),
      };

    case "SET_MOOD":
      return { ...state, weekMood: action.mood };

    case "SET_WEEK_NOTES":
      return { ...state, weekNotes: action.notes };

    case "SET_ONBOARDED":
      return { ...state, hasOnboarded: action.value };

    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.profile };

    case "HYDRATE": {
      const hydratedState = { ...defaultState, ...action.state, settings: { ...defaultSettings, ...(action.state.settings ?? {}) } };
      // Always regenerate AI tasks on hydrate so they're fresh for today
      hydratedState.aiTasks = generateAiTasks(hydratedState.courses, isoToday());
      // "day" view no longer exists — reset to "week"
      if ((hydratedState.planView as string) === "day") hydratedState.planView = "week";
      if ((hydratedState.settings.defaultPlanView as string) === "day") hydratedState.settings.defaultPlanView = "week";
      return hydratedState;
    }

    case "RESET":
      return defaultState;

    default:
      return state;
  }
}

function loadFromStorage(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

function saveToStorage(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    // Don't persist navigation state — keep it clean on reload
    const toSave: AppState = {
      ...state,
      selectedCourseId: null,
      selectedDate: null,
      activeTab: "courses",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // storage full or unavailable — ignore
  }
}

interface StoreContext {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  loadCourses: (courses: Course[]) => void;
  addCourses: (courses: Course[]) => void;
  /** False until the persisted state has been loaded on the client. */
  hydrated: boolean;
}

import { createElement, type ReactNode } from "react";

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Start from defaultState so the server render and the first client render
  // match (localStorage isn't available during SSR). Load persisted state in
  // an effect after mount to avoid a hydration mismatch.
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: "HYDRATE", state: loadFromStorage() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Don't persist until we've hydrated, or we'd clobber stored data with the
    // empty defaultState on first mount.
    if (hydrated) saveToStorage(state);
  }, [state, hydrated]);

  const loadCourses = useCallback(
    (courses: Course[]) => dispatch({ type: "LOAD_COURSES", courses }),
    []
  );

  const addCourses = useCallback(
    (courses: Course[]) => dispatch({ type: "ADD_COURSES", courses }),
    []
  );

  return createElement(
    Ctx.Provider,
    { value: { state, dispatch, loadCourses, addCourses, hydrated } },
    children
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
