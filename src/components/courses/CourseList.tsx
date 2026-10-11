"use client";

import { useState } from "react";
import type { Course, Semester } from "@/lib/types";
import CourseAccordionCard from "./CourseAccordionCard";
import CourseDetail from "./CourseDetail";
import KyberLogo from "@/components/shared/KyberLogo";

interface Props {
  courses: Course[];
  semesters: Semester[];
  activeSemester: Semester;
  openCourseId: string | null;
  onSemesterChange: (s: Semester) => void;
  onToggleCourse: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onReset: () => void;
}

function Avatar({ onAdd, onReset }: { onAdd: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        style={{
          width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
          border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#55514a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: "absolute", right: 0, top: 46, zIndex: 41, minWidth: 170,
              background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)",
              boxShadow: "var(--shadow-float)", overflow: "hidden",
            }}
          >
            <MenuItem label="Add syllabi" onClick={() => { setOpen(false); onAdd(); }} />
            <div style={{ height: 1, background: "var(--line)" }} />
            <MenuItem label="Start over" danger onClick={() => { setOpen(false); onReset(); }} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      style={{
        background: "none", border: "none", cursor: "pointer", padding: "12px 16px",
        fontSize: 15, fontWeight: 500, color: danger ? "#d1544b" : "var(--ink)",
      }}
    >
      {label}
    </button>
  );
}

export default function CourseList({
  courses,
  semesters,
  activeSemester,
  openCourseId,
  onSemesterChange,
  onToggleCourse,
  onDelete,
  onAdd,
  onReset,
}: Props) {
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const detailCourse = courses.find((c) => c.id === detailCourseId);

  if (detailCourse) {
    return (
      <CourseDetail
        course={detailCourse}
        onBack={() => setDetailCourseId(null)}
        onDelete={() => { onDelete(detailCourse.id); setDetailCourseId(null); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 6px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <KyberLogo size={40} />
        <Avatar onAdd={onAdd} onReset={onReset} />
      </div>

      {/* Semester switcher */}
      {semesters.length > 1 && (
        <div style={{ display: "flex", gap: 4, padding: "6px 16px 2px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 2, background: "var(--cream-deep)", borderRadius: 999, padding: 3, width: "100%" }}>
            {semesters.map((s) => {
              const isActive = s === activeSemester;
              return (
                <button
                  key={s}
                  onClick={() => onSemesterChange(s)}
                  className="flex-1"
                  style={{
                    background: isActive ? "var(--surface)" : "transparent",
                    color: isActive ? "var(--ink)" : "var(--text-2)",
                    boxShadow: isActive ? "var(--shadow-card)" : "none",
                    border: "none", borderRadius: 999, padding: "8px 0",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Semester {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "10px 16px 120px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
              <p style={{ fontWeight: 700, color: "var(--text-2)", fontSize: 16 }}>No courses yet</p>
              <p style={{ fontSize: 14 }}>Add syllabi from the menu to get started</p>
            </div>
          ) : (
            courses.map((c) => (
              <CourseAccordionCard
                key={c.id}
                course={c}
                open={openCourseId === c.id}
                onToggle={() => onToggleCourse(c.id)}
                onOpenDetail={() => setDetailCourseId(c.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
