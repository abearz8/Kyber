"use client";

import type { Course, Semester } from "@/lib/types";
import CourseCard from "./CourseCard";

interface Props {
  courses: Course[];
  semesters: Semester[];
  activeSemester: Semester;
  onSemesterChange: (s: Semester) => void;
  onOpen: (courseId: string) => void;
  onAdd: () => void;
  onReset: () => void;
}

export default function CourseList({
  courses,
  semesters,
  activeSemester,
  onSemesterChange,
  onOpen,
  onAdd,
  onReset,
}: Props) {
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
            My Courses
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: "2px 0 0" }}>
            {courses.length} course{courses.length !== 1 ? "s" : ""} loaded
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            style={{
              background: "#e9a319",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "6px 14px",
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
          <button
            onClick={onReset}
            title="Start over"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-3)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.54" />
            </svg>
          </button>
        </div>
      </div>

      {/* Semester switcher — only shown when both semesters are loaded */}
      {semesters.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "10px 16px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {semesters.map((s) => {
            const isActive = s === activeSemester;
            return (
              <button
                key={s}
                onClick={() => onSemesterChange(s)}
                className="flex-1 transition-colors"
                style={{
                  background: isActive ? "#e9a319" : "var(--surface-2)",
                  color: isActive ? "#fff" : "var(--text-2)",
                  border: isActive ? "1px solid #e9a319" : "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "8px 0",
                  fontFamily: "Quicksand, sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Semester {s}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable course list */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>📚</p>
            <p style={{ fontWeight: 600, color: "var(--text-2)" }}>No courses yet</p>
            <p style={{ fontSize: 13 }}>Tap + Add to upload syllabi</p>
          </div>
        ) : (
          courses.map((c) => (
            <CourseCard key={c.id} course={c} onClick={() => onOpen(c.id)} />
          ))
        )}
      </div>
    </div>
  );
}
