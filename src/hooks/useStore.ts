"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type Dispatch,
} from "react";
import type { AppState, AppAction, Course } from "@/lib/types";

const STORAGE_KEY = "kyber-app-state-v1";

const defaultState: AppState = {
  courses: [],
  activeTab: "courses",
  activeSemester: 1,
  planView: "month",
  completedTaskIds: [],
  gradeSims: {},
  selectedCourseId: null,
  selectedDate: null,
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
      };
    }

    case "ADD_COURSES": {
      const existingIds = new Set(state.courses.map((c) => c.id));
      const fresh = action.courses.filter((c) => !existingIds.has(c.id));
      return { ...state, courses: [...state.courses, ...fresh] };
    }

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
}

import { createElement, type ReactNode } from "react";

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

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
    { value: { state, dispatch, loadCourses, addCourses } },
    children
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
