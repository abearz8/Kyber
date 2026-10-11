"use client";

import type { Course } from "@/lib/types";
import { daysUntil, fmtShort, addDays, isoToday } from "@/lib/dates";
import { submittedProgress } from "@/lib/grades";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  open: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
}

function nextUp(course: Course) {
  return (
    course.events
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

function courseWeek(course: Course): number {
  const dates = course.events.map((e) => e.date).filter(Boolean).sort();
  if (dates.length === 0) return 1;
  const elapsed = -daysUntil(dates[0]);
  return Math.max(1, Math.floor(elapsed / 7) + 1);
}

export default function CourseAccordionCard({ course, open, onToggle, onOpenDetail }: Props) {
  const up = nextUp(course);
  const progress = submittedProgress(course);
  const week = courseWeek(course);
  const c = course.color;

  // Placeholder when no upcoming event — always show same-size card
  const placeholderDate = addDays(isoToday(), 90);
  const displayEvent = up ?? {
    id: "placeholder",
    title: "Independent study",
    date: placeholderDate,
    type: "assignment" as const,
    weight: 0,
    courseId: course.id,
  };
  const displayDays = Math.max(0, daysUntil(displayEvent.date));
  const isPlaceholder = !up;

  const deadlines = course.events.filter((e) => daysUntil(e.date) >= 0 && e.type !== "exam" && e.weight > 0).length;
  const exams = course.events.filter((e) => e.type === "exam" && daysUntil(e.date) >= 0).length;
  const gradeParts = course.gradeComponents.length;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: open ? `1.5px solid ${c}` : "1px solid var(--line)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        transition: "border-color .2s",
      }}
    >
      {/* ── Tappable header (toggle accordion) ── */}
      <div
        onClick={() => { if (!open) track.courseOpened(course.code); onToggle(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        style={{ cursor: "pointer" }}
      >
        {/* Title row */}
        <div className="flex gap-3" style={{ padding: "16px 16px 0" }}>
          <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: c, flexShrink: 0, minHeight: 44 }} />
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div className="flex items-start justify-between gap-2">
              <span className="eyebrow">{course.code}</span>
              <span
                style={{
                  fontSize: 12, fontWeight: 700, color: c,
                  background: `${c}1f`, borderRadius: 999, padding: "3px 10px", flexShrink: 0,
                }}
              >
                Week {week}
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <span
                style={{
                  fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.01em",
                  color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
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
        </div>

        {/* Up Next — always present */}
        <div style={{ padding: "12px 16px 0" }}>
          <div
            style={{
              background: `${c}14`, borderRadius: 14, padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isPlaceholder ? "var(--text-3)" : c }}>
                {isPlaceholder ? "Study ahead" : "Up next"}
              </div>
              <div
                style={{
                  fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 17,
                  color: isPlaceholder ? "var(--text-2)" : "var(--ink)",
                  margin: "3px 0 2px", lineHeight: 1.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {displayEvent.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                {isPlaceholder ? "No deadlines — get ahead" : fmtShort(displayEvent.date)}
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0, opacity: isPlaceholder ? 0.4 : 1 }}>
              <div style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 32, color: c, lineHeight: 1 }}>
                {isPlaceholder ? "—" : displayDays}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c }}>{isPlaceholder ? "" : "DAYS"}</div>
            </div>
          </div>
        </div>

        {/* Semester progress */}
        <div style={{ padding: "14px 16px 16px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
            <span style={{ fontSize: 14, color: "var(--text-2)" }}>Semester progress</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{progress}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 7, background: "#ece2d1", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: c, borderRadius: 7, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: "0 16px 18px" }}>
          <div style={{ height: 1, background: "var(--line)", margin: "0 0 16px" }} />

          {/* Instructor */}
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
            <span style={{ fontSize: 14, color: "var(--text-2)" }}>{course.instructor}</span>
          </div>

          {/* Current focus */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c, marginBottom: 4 }}>
            Current focus
          </div>
          <p style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 16, color: "var(--ink)", margin: "0 0 14px", lineHeight: 1.3 }}>
            {course.currentTopic}
          </p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <StatBox value={deadlines} label="Deadlines" color={c} />
            <StatBox value={exams} label="Exams" color={c} />
            <StatBox value={gradeParts} label="Components" color={c} />
          </div>

          {/* Open full course */}
          <button
            onClick={(e) => { e.stopPropagation(); track.courseSectionViewed(course.code, "full_course"); onOpenDetail(); }}
            className="w-full flex items-center justify-between"
            style={{
              background: c, color: "#fff", border: "none", borderRadius: 14,
              padding: "15px 18px", cursor: "pointer",
              fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 16,
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
    <div style={{ background: "var(--cream-deep)", borderRadius: 12, padding: "12px 6px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{label}</div>
    </div>
  );
}
