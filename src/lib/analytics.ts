"use client";

// Thin typed wrapper around PostHog. All capture calls go through here so
// we have one place to audit what gets sent and ensure nothing sensitive leaks.

import type { UserProfile, RescheduleMode } from "@/lib/types";

let ph: typeof import("posthog-js").default | null = null;

export function initAnalytics(key: string, host: string) {
  if (typeof window === "undefined" || !key) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host || "https://us.i.posthog.com",
      person_profiles: "always",
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true, // privacy: never record what users type
      },
      autocapture: {
        // Exclude file inputs from autocapture (syllabus filenames are private)
        element_allowlist: ["a", "button"],
      },
    });
    ph = posthog;
  });
}

function capture(event: string, props?: Record<string, unknown>) {
  ph?.capture(event, props);
}

export const track = {
  appOpened: () => capture("app_opened"),

  // Virtual screen navigation (this is a tab-state SPA, so the URL never
  // changes — these give PostHog the per-screen views + dwell it can't infer).
  screenViewed: (screen: string, from: string | null) =>
    capture("screen_viewed", { screen, from }),

  screenDwell: (screen: string, seconds: number) =>
    capture("screen_dwell", { screen, seconds }),

  // Attach cohort dimensions to every subsequent event (no PII).
  setUserContext: (profile: UserProfile) =>
    ph?.register({
      program: profile.program,
      university: profile.university,
      year: profile.year,
      study_block: profile.studyBlock,
      goals_count: profile.goals.length,
    }),

  onboardingStarted: () => capture("onboarding_started"),

  onboardingStepCompleted: (step: number, name: string) =>
    capture("onboarding_step_completed", { step, name }),

  demoSemesterSelected: (program: "hba1" | "data_science", semester: string) =>
    capture("demo_semester_selected", { program, semester }),

  syllabusUploadStarted: (count: number) =>
    capture("syllabus_upload_started", { file_count: count }),

  syllabusUploadCompleted: (count: number) =>
    capture("syllabus_upload_completed", { courses_added: count }),

  syllabusUploadFailed: (reason: string) =>
    capture("syllabus_upload_failed", { reason }),

  semesterLoaded: (source: "demo" | "upload", courseCount: number) =>
    capture("semester_loaded", { source, course_count: courseCount }),

  tabViewed: (tab: "courses" | "now" | "plan") =>
    capture("tab_viewed", { tab }),

  courseOpened: (courseCode: string) =>
    capture("course_opened", { course_code: courseCode }),

  courseSectionViewed: (courseCode: string, section: string) =>
    capture("course_section_viewed", { course_code: courseCode, section }),

  gradeCalculatorUsed: (courseCode: string) =>
    capture("grade_calculator_used", { course_code: courseCode }),

  insightOpened: (courseCode: string, insightKind: string) =>
    capture("insight_opened", { course_code: courseCode, kind: insightKind }),

  nowTaskOpened: (taskType: string) =>
    capture("now_task_opened", { task_type: taskType }),

  // The Now tab only ever shows today's items, so there's no days_until to
  // report — it would always be 0.
  nowTaskCompleted: (taskType: string) =>
    capture("now_task_completed", { task_type: taskType }),

  planViewed: (view: "day" | "week" | "month") =>
    capture("plan_viewed", { view }),

  planItemOpened: (eventType: string) =>
    capture("plan_item_opened", { event_type: eventType }),

  // Feature value-signals — the "wiring my real life in" actions that best
  // predict willingness to pay.
  calendarExported: (source: "reveal" | "plan") =>
    capture("calendar_exported", { source }),

  courseDatesAdded: (courseCode: string, count: number) =>
    capture("course_dates_added", { course_code: courseCode, count }),

  weekMoodSet: (mood: string) => capture("week_mood_set", { mood }),

  replanOpened: (source: "now" | "plan") => capture("replan_opened", { source }),

  replanTapped: (mode: RescheduleMode) => capture("replan_tapped", { mode }),

  gradeMarkEntered: (courseCode: string) =>
    capture("grade_mark_entered", { course_code: courseCode }),

  deadlineAddedManually: (courseCode: string, eventType: string) =>
    capture("deadline_added_manually", { course_code: courseCode, event_type: eventType }),

  unitsViewed: (courseCode: string) =>
    capture("units_viewed", { course_code: courseCode }),

  planRangeChanged: (days: number) => capture("plan_range_changed", { days }),

  appearanceCustomized: (where: "palette" | "settings") =>
    capture("appearance_customized", { where }),
};
