"use client";

import { useRef, useEffect } from "react";
import type { Course } from "@/lib/types";
import { daysUntil, fmtShort } from "@/lib/dates";
import { submittedProgress } from "@/lib/grades";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  open: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
}

/** Next upcoming event of any type (reading, quiz, exam…). */
function nextUp(course: Course) {
  return (
    course.events
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

/** "Week N" for this course, based on how long since its first dated item. */
function courseWeek(course: Course): number {
  const dates = course.events.map((e) => e.date).filter(Boolean).sort();
  if (dates.length === 0) return 1;
  const elapsed = -daysUntil(dates[0]);
  return Math.max(1, Math.floor(elapsed / 7) + 1);
}

export default function CourseAccordionCard({ course, open, onToggle, onOpenDetail }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const up = nextUp(course);
  const progress = submittedProgress(course);
  const week = courseWeek(course);

  const deadlines = course.events.filter((e) => daysUntil(e.date) >= 0 && e.type !== "exam" && e.weight > 0).length;
  const exams = course.events.filter((e) => e.type === "exam" && daysUntil(e.date) >= 0).length;
  const gradeParts = course.gradeComponents.length;

  useEffect(() => {
    if (open && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  const c = course.color;

  return (
    <div
      ref={ref}
      style={{
        background: "var(--surface)",
        border: open ? `1.5px solid ${c}` : "1px solid var(--line)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/* ── Header (tap to toggle) ── */}
      <button
        onClick={() => {
          if (!open) track.courseOpened(course.code);
          onToggle();
        }}
        className="w-full text-left flex gap-3"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "16px 16px 0" }}
      >
        <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: c, flexShrink: 0, minHeight: 44 }} />
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="flex items-start justify-between">
            <span className="eyebrow">{course.code}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: c,
                background: `${c}1f`,
                borderRadius: 999,
                padding: "3px 10px",
                flexShrink: 0,
              }}
            >
              Week {week}
            </span>
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
            <span style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 21, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              {course.title}
            </span>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4"
              style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── UP NEXT ── */}
      {up && (
        <div style={{ padding: "14px 16px 0" }}>
          <div
            style={{
              background: `${c}14`,
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c }}>
                Up next
              </div>
              <div style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 18, color: "var(--ink)", margin: "4px 0 2px", lineHeight: 1.2 }}>
                {up.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                Next: {up.title} · {fmtShort(up.date)}
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 34, color: c, lineHeight: 1 }}>
                {Math.max(0, daysUntil(up.date))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c }}>DAYS</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Semester progress ── */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
          <span style={{ fontSize: 14, color: "var(--text-2)" }}>Semester progress</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{progress}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 7, background: "#ece2d1", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: c, borderRadius: 7, transition: "width .3s" }} />
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ height: 1, background: "var(--line)", margin: "2px 0 14px" }} />

          {/* Instructor */}
          <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
            <span style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>{course.instructor}</span>
          </div>

          {/* Current focus */}
          <div className="eyebrow eyebrow-accent" style={{ marginBottom: 4 }}>Current focus</div>
          <p style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 17, color: "var(--ink)", margin: "0 0 14px" }}>
            {course.currentTopic}
          </p>

          {/* Stat boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <StatBox value={deadlines} label="Deadlines" color={c} />
            <StatBox value={exams} label="Exams" color={c} />
            <StatBox value={gradeParts} label="Grade parts" color={c} />
          </div>

          {/* Open full course */}
          <button
            onClick={() => { track.courseSectionViewed(course.code, "full_course"); onOpenDetail(); }}
            className="w-full flex items-center justify-between"
            style={{
              marginTop: 14,
              background: c,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "15px 18px",
              cursor: "pointer",
              fontFamily: "var(--ios-font)",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Open full course
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: "var(--cream-deep)", borderRadius: 14, padding: "14px 6px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 5 }}>{label}</div>
    </div>
  );
}
