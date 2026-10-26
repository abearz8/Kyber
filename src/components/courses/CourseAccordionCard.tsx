"use client";

import type { Course, CourseEvent } from "@/lib/types";
import { daysUntil, fmtShort } from "@/lib/dates";
import { submittedProgress } from "@/lib/grades";
import { track } from "@/lib/analytics";
import { Label, Pill, PrimaryButton, ChevronRight } from "@/components/shared/ui";
import NoDeadlinesPanel from "./NoDeadlinesPanel";

interface Props {
  course: Course;
  open: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  onAddDeadline: () => void;
}

function nextUp(course: Course): CourseEvent | null {
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

/** Tint of the "Up next" box: exams/quizzes are amber, deliverables are blue. */
function tone(e: CourseEvent) {
  if (e.type === "exam" || e.type === "quiz") {
    return { bg: "var(--soft)", label: "var(--amber-ink)", pill: "var(--soft-end)" };
  }
  return { bg: "var(--blue-bg)", label: "var(--blue-text)", pill: "var(--blue-chip)" };
}

export default function CourseAccordionCard({ course, open, onToggle, onOpenDetail, onAddDeadline }: Props) {
  const up = nextUp(course);
  const progress = submittedProgress(course);
  const week = courseWeek(course);
  const c = course.color;
  const noDeadlines = course.events.length === 0;

  const deadlines = course.events.filter((e) => daysUntil(e.date) >= 0 && e.type !== "exam" && e.weight > 0).length;
  const exams = course.events.filter((e) => e.type === "exam" && daysUntil(e.date) >= 0).length;
  const gradeParts = course.gradeComponents.length;

  return (
    <div
      style={{
        position: "relative",
        background: "var(--surface)",
        border: open ? `1.5px solid ${c}` : "1px solid var(--card-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        transition: "border-color .2s",
      }}
    >
      {/* Course colour bar */}
      <span aria-hidden style={{ position: "absolute", left: 14, top: 18, bottom: 18, width: 4, borderRadius: 4, background: c }} />

      {/* ── Tappable header (toggle accordion) ── */}
      <div
        onClick={() => { if (!open) track.courseOpened(course.code); onToggle(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        style={{ cursor: "pointer", padding: "16px 16px 0 30px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Label>{course.code}</Label>
          <Pill text={`Week ${week}`} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span
            style={{
              fontWeight: 700, fontSize: 22, letterSpacing: "-0.3px", color: "var(--ink)", lineHeight: 1.2,
              flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {course.title}
          </span>
          <ChevronRight size={18} color="var(--text-2)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
        </div>

        {/* Up next / No deadlines */}
        <div style={{ marginTop: 12 }}>
          {noDeadlines ? (
            <NoDeadlinesPanel course={course} onAdd={onAddDeadline} compact />
          ) : up ? (
            (() => {
              const t = tone(up);
              const days = Math.max(0, daysUntil(up.date));
              return (
                <div style={{ background: t.bg, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Label color={t.label}>Up next</Label>
                    <div style={{ fontWeight: 700, fontSize: 20, color: "var(--ink)", margin: "3px 0 2px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {up.title}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-2)" }}>
                      {fmtShort(up.date)}{up.weight > 0 ? ` · ${up.weight}% of your grade` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0, background: t.pill, borderRadius: 14, padding: "8px 12px", minWidth: 72 }}>
                    <div style={{ fontWeight: 800, fontSize: 28, color: "var(--ink)", lineHeight: 1 }}>{days}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink)", marginTop: 2 }}>{days === 1 ? "DAY" : "DAYS"}</div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{ background: "var(--cream-deep)", borderRadius: 14, padding: "12px 14px" }}>
              <Label color="var(--text-3)">Nothing upcoming</Label>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-2)", marginTop: 3 }}>
                Every date in this syllabus has passed.
              </div>
            </div>
          )}
        </div>

        {/* Semester progress */}
        <div style={{ padding: "14px 0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500 }}>Semester progress</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: "var(--track)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: c, borderRadius: 6, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: "0 16px 18px 30px" }}>
          <div style={{ height: 1, background: "var(--track)", margin: "0 0 16px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
            <span style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500 }}>{course.instructor}</span>
          </div>

          <Label>Current focus</Label>
          <p style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)", margin: "4px 0 14px", lineHeight: 1.3 }}>
            {course.currentTopic}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <StatBox value={deadlines} label="Deadlines" />
            <StatBox value={exams} label="Exams" />
            <StatBox value={gradeParts} label="Components" />
          </div>

          <PrimaryButton
            label={<span style={{ display: "flex", alignItems: "center", gap: 8 }}>Open full course <ChevronRight size={18} /></span>}
            onClick={() => { track.courseSectionViewed(course.code, "full_course"); onOpenDetail(); }}
            height={50}
          />
        </div>
      )}
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ background: "var(--soft)", borderRadius: 12, padding: "12px 6px", textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 22, color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}
