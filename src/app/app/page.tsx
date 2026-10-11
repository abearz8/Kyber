"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import MobileShell from "@/components/shared/MobileShell";
import TabBar from "@/components/shared/TabBar";
import CourseList from "@/components/courses/CourseList";
import NowTab from "@/components/now/NowTab";
import PlanTab from "@/components/plan/PlanTab";
import SyllabusUploader from "@/components/upload/SyllabusUploader";
import type { Course } from "@/lib/types";
import { useState } from "react";

export default function AppPage() {
  const { state, dispatch, addCourses, hydrated } = useStore();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  // Redirect to onboarding if no courses (only once persisted state has loaded)
  useEffect(() => {
    if (hydrated && state.courses.length === 0) {
      router.replace("/");
    }
  }, [hydrated, state.courses.length, router]);

  // Render nothing until hydration completes so the server and first client
  // render match; then gate on whether any courses are present.
  if (!hydrated || state.courses.length === 0) return null;

  function handleAddCourses(courses: Course[]) {
    addCourses(courses);
    setShowUpload(false);
  }

  function handleReset() {
    if (confirm("Start over? This will clear all loaded courses.")) {
      dispatch({ type: "RESET" });
      router.replace("/");
    }
  }

  const { activeTab, courses, activeSemester } = state;

  // Which semesters are present in the loaded data?
  const semestersPresent = Array.from(
    new Set(courses.map((c) => c.semester).filter((s): s is 1 | 2 => s === 1 || s === 2))
  ).sort();
  const hasMultipleSemesters = semestersPresent.length > 1;

  // Scope the whole app to the active semester when both are loaded.
  // Courses with no semester (e.g. uploaded) stay visible in every view.
  const visibleCourses = hasMultipleSemesters
    ? courses.filter((c) => c.semester == null || c.semester === activeSemester)
    : courses;

  // Upload overlay
  if (showUpload) {
    return (
      <MobileShell>
        <SyllabusUploader onDone={handleAddCourses} onCancel={() => setShowUpload(false)} />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-gradient)", position: "relative" }}>

        {activeTab === "courses" ? (
          <CourseList
            courses={visibleCourses}
            semesters={hasMultipleSemesters ? semestersPresent : []}
            activeSemester={activeSemester}
            onSemesterChange={(s) => dispatch({ type: "SET_SEMESTER", semester: s })}
            onDelete={(id) => dispatch({ type: "DELETE_COURSE", courseId: id })}
            onAdd={() => setShowUpload(true)}
            onReset={handleReset}
          />
        ) : activeTab === "now" ? (
          <NowTab courses={visibleCourses} />
        ) : (
          <PlanTab courses={visibleCourses} onAdd={() => setShowUpload(true)} onReset={handleReset} />
        )}
      </div>

      <TabBar
        active={activeTab}
        onChange={(tab) => dispatch({ type: "SET_TAB", tab })}
      />
    </MobileShell>
  );
}
