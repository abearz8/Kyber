"use client";

// Thin typed wrapper around PostHog. All capture calls go through here so
// we have one place to audit what gets sent and ensure nothing sensitive leaks.

let ph: typeof import("posthog-js").default | null = null;

export function initAnalytics(key: string, host: string) {
  if (typeof window === "undefined" || !key) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host || "https://us.i.posthog.com",
      person_profiles: "identified_only",
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

  onboardingStarted: () => capture("onboarding_started"),

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

  nowTaskCompleted: (taskType: string, daysUntil: number) =>
    capture("now_task_completed", { task_type: taskType, days_until: daysUntil }),

  planViewed: (view: "day" | "week" | "month") =>
    capture("plan_viewed", { view }),

  planItemOpened: (eventType: string) =>
    capture("plan_item_opened", { event_type: eventType }),

  parsedInfoEdited: (field: string) =>
    capture("parsed_information_edited", { field }),
};
