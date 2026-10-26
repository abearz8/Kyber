"use client";

import { useState } from "react";
import type { Course, Semester, CourseEvent } from "@/lib/types";
import { isoToday } from "@/lib/dates";
import { semesterWeek } from "@/lib/events";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import CourseAccordionCard from "./CourseAccordionCard";
import CourseDetail from "./CourseDetail";
import SettingsModal from "@/components/shared/SettingsModal";
import AddToPlanSheet from "@/components/plan/AddToPlanSheet";
import { ScreenHeader, Segmented, Toast, SCROLL_BOTTOM } from "@/components/shared/ui";
import { useScreenTime } from "@/hooks/useScreenTime";

interface Props {
  courses: Course[];
  semesters: Semester[];
  activeSemester: Semester;
  onSemesterChange: (s: Semester) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onReset: () => void;
}

export default function CourseList({
  courses,
  semesters,
  activeSemester,
  onSemesterChange,
  onDelete,
  onAdd,
  onReset,
}: Props) {
  const { dispatch } = useStore();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [addDeadlineFor, setAddDeadlineFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const detailCourse = courses.find((c) => c.id === detailCourseId);
  const week = semesterWeek(courses);

  // Owns the "courses" area: list vs. an open course detail.
  useScreenTime(detailCourse ? `course_detail:${detailCourse.code}` : "courses");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function addCourseEvent(courseId: string, event: CourseEvent) {
    const course = courses.find((c) => c.id === courseId);
    dispatch({ type: "ADD_COURSE_EVENT", courseId, event });
    track.deadlineAddedManually(course?.code ?? courseId, event.type);
    setAddDeadlineFor(null);
    showToast("Deadline added. Kyber will plan around it.");
  }

  if (detailCourse) {
    return (
      <CourseDetail
        course={detailCourse}
        onBack={() => setDetailCourseId(null)}
        onDelete={() => { onDelete(detailCourse.id); setDetailCourseId(null); }}
        onAddSyllabus={onAdd}
      />
    );
  }

  const subtitle =
    courses.length > 0
      ? `${courses.length} course${courses.length !== 1 ? "s" : ""}${semesters.length > 1 ? ` · Semester ${activeSemester}` : ""} · Week ${week}`
      : "No courses yet";

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0, position: "relative" }}>
      <ScreenHeader title="Your courses" subtitle={subtitle} onSettings={() => setShowSettings(true)} />

      {semesters.length > 1 && (
        <div style={{ padding: "4px 16px 6px", flexShrink: 0 }}>
          <Segmented<Semester>
            value={activeSemester}
            onChange={onSemesterChange}
            options={semesters.map((s) => ({ value: s, label: `Semester ${s}` }))}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: `10px 16px ${SCROLL_BOTTOM}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
              <p style={{ fontWeight: 700, color: "var(--text-2)", fontSize: 17 }}>No courses yet</p>
              <p style={{ fontSize: 15 }}>Add syllabi from settings to get started</p>
            </div>
          ) : (
            courses.map((c) => (
              <CourseAccordionCard
                key={c.id}
                course={c}
                open={expandedCourseId === c.id}
                onToggle={() => setExpandedCourseId(expandedCourseId === c.id ? null : c.id)}
                onOpenDetail={() => setDetailCourseId(c.id)}
                onAddDeadline={() => setAddDeadlineFor(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {addDeadlineFor && (
        <AddToPlanSheet
          defaultDate={isoToday()}
          preset={{ kind: "deadline", courseId: addDeadlineFor }}
          courses={courses}
          onAddCourseEvent={addCourseEvent}
          onAdd={(ev) => { dispatch({ type: "ADD_PERSONAL_EVENT", event: ev }); track.planItemOpened(ev.kind); setAddDeadlineFor(null); showToast("Added to your plan."); }}
          onAddSyllabus={() => { setAddDeadlineFor(null); onAdd(); }}
          onCancel={() => setAddDeadlineFor(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          courses={courses}
          onClose={() => setShowSettings(false)}
          onAdd={onAdd}
          onReset={onReset}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
