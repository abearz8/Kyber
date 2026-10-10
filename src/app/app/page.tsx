"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import MobileShell from "@/components/shared/MobileShell";
import TabBar from "@/components/shared/TabBar";
import CourseList from "@/components/courses/CourseList";
import CourseDetail from "@/components/courses/CourseDetail";
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

  const { activeTab, selectedCourseId, courses } = state;
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

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

        {/* Course detail overlays tab content when open */}
        {activeTab === "courses" && selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            onBack={() => dispatch({ type: "SET_SELECTED_COURSE", courseId: null })}
            onDelete={(id) => dispatch({ type: "DELETE_COURSE", courseId: id })}
          />
        ) : activeTab === "courses" ? (
          <CourseList
            courses={courses}
            onOpen={(id) => dispatch({ type: "SET_SELECTED_COURSE", courseId: id })}
            onAdd={() => setShowUpload(true)}
            onReset={handleReset}
          />
        ) : activeTab === "now" ? (
          <NowTab courses={courses} />
        ) : (
          <PlanTab courses={courses} />
        )}
      </div>

      <TabBar
        active={activeTab}
        onChange={(tab) => dispatch({ type: "SET_TAB", tab })}
      />
    </MobileShell>
  );
}
