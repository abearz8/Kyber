"use client";

import { useState } from "react";
import type { Course, Semester } from "@/lib/types";
import CourseAccordionCard from "./CourseAccordionCard";
import GradeCalculator from "./GradeCalculator";
import { daysUntil } from "@/lib/dates";

interface Props {
  courses: Course[];
  semesters: Semester[];
  activeSemester: Semester;
  openCourseId: string | null;
  completedIds: Set<string>;
  onSemesterChange: (s: Semester) => void;
  onToggleCourse: (id: string) => void;
  onToggleStudyTask: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onReset: () => void;
}

// "Week X of N" derived from the span of all events.
function semesterProgress(courses: Course[]): { week: number; total: number; term: string } {
  const dates = courses.flatMap((c) => c.events.map((e) => e.date)).filter(Boolean).sort();
  const term = courses[0]?.term ?? "This term";
  if (dates.length < 2) return { week: 1, total: 15, term };
  const start = dates[0];
  const end = dates[dates.length - 1];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const spanMs = new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime();
  const total = Math.max(1, Math.round(spanMs / (7 * 86_400_000)));
  const sinceStart = -daysUntil(start); // days elapsed since first event
  const week = Math.min(Math.max(1, Math.floor(sinceStart / 7) + 1), total);
  return { week, total, term };
}

export default function CourseList({
  courses,
  semesters,
  activeSemester,
  openCourseId,
  completedIds,
  onSemesterChange,
  onToggleCourse,
  onToggleStudyTask,
  onDelete,
  onAdd,
  onReset,
}: Props) {
  const [calcCourseId, setCalcCourseId] = useState<string | null>(null);
  const calcCourse = courses.find((c) => c.id === calcCourseId);
  const { week, total, term } = semesterProgress(courses);

  if (calcCourse) {
    return <GradeCalculator course={calcCourse} onBack={() => setCalcCourseId(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text)", margin: 0 }}>
            Your courses
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: "2px 0 0" }}>
            {term} · Week {week} of {total}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            style={{
              background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 10,
              padding: "6px 14px", fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            + Add
          </button>
          <button
            onClick={onReset}
            title="Start over"
            style={{
              background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "6px 10px", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.54" />
            </svg>
          </button>
        </div>
      </div>

      {/* Semester switcher */}
      {semesters.length > 1 && (
        <div style={{ display: "flex", gap: 4, padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {semesters.map((s) => {
            const isActive = s === activeSemester;
            return (
              <button
                key={s}
                onClick={() => onSemesterChange(s)}
                className="flex-1 transition-colors"
                style={{
                  background: isActive ? "var(--amber)" : "var(--surface-2)",
                  color: isActive ? "var(--ink)" : "var(--text-2)",
                  border: isActive ? "1px solid var(--amber)" : "1px solid var(--border)",
                  borderRadius: 10, padding: "8px 0", fontFamily: "Quicksand, sans-serif",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Semester {s}
              </button>
            );
          })}
        </div>
      )}

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📚</p>
            <p style={{ fontWeight: 600, color: "var(--text-2)" }}>No courses yet</p>
            <p style={{ fontSize: 13 }}>Tap + Add to upload syllabi</p>
          </div>
        ) : (
          courses.map((c) => (
            <CourseAccordionCard
              key={c.id}
              course={c}
              open={openCourseId === c.id}
              completedIds={completedIds}
              onToggle={() => onToggleCourse(c.id)}
              onToggleStudyTask={onToggleStudyTask}
              onOpenCalc={() => setCalcCourseId(c.id)}
              onDelete={() => onDelete(c.id)}
            />
          ))
        )}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
