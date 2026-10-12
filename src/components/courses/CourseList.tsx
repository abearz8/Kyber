"use client";

import { useState } from "react";
import type { Course, Semester } from "@/lib/types";
import CourseAccordionCard from "./CourseAccordionCard";
import CourseDetail from "./CourseDetail";
import KyberLogo from "@/components/shared/KyberLogo";
import ColorPaletteModal from "@/components/shared/ColorPaletteModal";
import SettingsModal from "@/components/shared/SettingsModal";

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
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
      <div style={{ padding: "14px 16px 6px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <KyberLogo size={40} />
          <div>
            <p style={{ margin: 0, fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 22, color: "var(--orange-cta)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>Your courses</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
              {courses.length > 0 ? `${courses.length} course${courses.length !== 1 ? "s" : ""} · Semester ${activeSemester}` : "No courses yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Colour palette */}
          <button
            onClick={() => setShowPalette(true)}
            aria-label="Course colours"
            style={{
              width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
              border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55514a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="13.5" r="2.5" />
              <circle cx="8.5" cy="7.5" r="2.5" />
              <circle cx="6.5" cy="14.5" r="2.5" />
              <path d="M12 2a10 10 0 0 0 0 20c1.4 0 2.3-.8 2.3-2 0-.6-.2-1.1-.2-1.6 0-.7.6-1.4 1.4-1.4H17a5 5 0 0 0 5-5c0-5-4.5-9-10-9z" />
            </svg>
          </button>
          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            style={{
              width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
              border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55514a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
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
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "10px 16px calc(120px + var(--safe-bottom))" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
              <p style={{ fontWeight: 700, color: "var(--text-2)", fontSize: 16 }}>No courses yet</p>
              <p style={{ fontSize: 14 }}>Add syllabi from settings to get started</p>
            </div>
          ) : (
            courses.map((c) => (
              <CourseAccordionCard
                key={c.id}
                course={c}
                open={expandedCourseId === c.id}
                onToggle={() => setExpandedCourseId(expandedCourseId === c.id ? null : c.id)}
                onOpenDetail={() => setDetailCourseId(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {showPalette && (
        <ColorPaletteModal
          courses={courses}
          onClose={() => setShowPalette(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onAdd={onAdd}
          onReset={onReset}
        />
      )}
    </div>
  );
}
