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
  const { state, dispatch, addCourses } = useStore();
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  // Redirect to onboarding if no courses
  useEffect(() => {
    if (state.courses.length === 0) {
      router.replace("/");
    }
  }, [state.courses.length, router]);

  if (state.courses.length === 0) return null;

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

  const { activeTab, selectedCourseId, courses, activeSemester } = state;

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

  const completedIds = new Set(state.completedTaskIds);
  const toggleTask = (id: string) =>
    dispatch({
      type: completedIds.has(id) ? "UNCOMPLETE_TASK" : "COMPLETE_TASK",
      taskId: id,
    });

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
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

        {activeTab === "courses" ? (
          <CourseList
            courses={visibleCourses}
            semesters={hasMultipleSemesters ? semestersPresent : []}
            activeSemester={activeSemester}
            openCourseId={selectedCourseId}
            completedIds={completedIds}
            onSemesterChange={(s) => dispatch({ type: "SET_SEMESTER", semester: s })}
            onToggleCourse={(id) =>
              dispatch({ type: "SET_SELECTED_COURSE", courseId: selectedCourseId === id ? null : id })
            }
            onToggleStudyTask={toggleTask}
            onDelete={(id) => dispatch({ type: "DELETE_COURSE", courseId: id })}
            onAdd={() => setShowUpload(true)}
            onReset={handleReset}
          />
        ) : activeTab === "now" ? (
          <NowTab courses={visibleCourses} />
        ) : (
          <PlanTab courses={visibleCourses} />
        )}
      </div>

      <TabBar
        active={activeTab}
        onChange={(tab) => dispatch({ type: "SET_TAB", tab })}
      />
    </MobileShell>
  );
}
