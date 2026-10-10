"use client";

import type { Course } from "@/lib/types";
import CourseCard from "./CourseCard";

interface Props {
  courses: Course[];
  onOpen: (courseId: string) => void;
  onAdd: () => void;
  onReset: () => void;
}

export default function CourseList({ courses, onOpen, onAdd, onReset }: Props) {
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
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text)", margin: 0 }}>
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
              background: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "6px 14px",
              fontFamily: "Poppins, sans-serif",
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
