"use client";

import { useState, useRef, useEffect } from "react";
import type { Course } from "@/lib/types";
import { daysUntil, relativeLabel, fmtFull } from "@/lib/dates";
import { typeLabel } from "@/lib/events";
import { nextMajor, readiness, readinessExplainer, studyTasksForCourse } from "@/lib/studyplan";
import { isoToday } from "@/lib/dates";
import GradeBreakdown from "./GradeBreakdown";
import InsightCards from "./InsightCards";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  open: boolean;
  completedIds: Set<string>;
  onToggle: () => void;
  onToggleStudyTask: (id: string) => void;
  onOpenCalc: () => void;
  onDelete: () => void;
}

export default function CourseAccordionCard({
  course,
  open,
  completedIds,
  onToggle,
  onToggleStudyTask,
  onOpenCalc,
  onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [showCalcExplain, setShowCalcExplain] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const target = nextMajor(course);
  const ready = readiness(course, completedIds);
  const tasks = studyTasksForCourse(course);
  const today = isoToday();
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayEvents = course.events.filter((e) => e.date === today);

  useEffect(() => {
    if (open && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* ── Header (always visible, tap to toggle) ── */}
      <button
        onClick={() => {
          if (!open) track.courseOpened(course.code);
          onToggle();
        }}
        className="w-full text-left"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "14px 16px 0" }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: course.color, flexShrink: 0 }} />
          <span className="eyebrow">{course.code}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
            {course.title}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* ── NEXT EXAM countdown ── */}
      {target && (
        <div style={{ padding: "12px 16px 0" }}>
          <div
            style={{
              background: "var(--yellow-soft)",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: 2 }}>Next {target.type === "exam" ? "exam" : "deadline"}</div>
              <div style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                {target.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 1 }}>
                {fmtFull(target.date)}{target.weight > 0 ? ` · worth ${target.weight}%` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 30, color: "var(--amber-ink)", lineHeight: 1 }}>
                {Math.max(0, daysUntil(target.date))}
              </div>
              <div className="eyebrow">days</div>
            </div>
          </div>

          {/* Readiness bar */}
          {ready != null && (
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 6, borderRadius: 6, background: "var(--track)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${ready}%`, background: "var(--amber)", borderRadius: 6, transition: "width .3s" }} />
              </div>
              <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text-2)" }}>
                  <b style={{ color: "var(--ink)" }}>{ready}% ready</b> for {target.title.toLowerCase()}
                </span>
                <button
                  onClick={() => setShowCalcExplain((v) => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber-ink)", fontSize: 11, padding: 0 }}
                >
                  How is this calculated?
                </button>
              </div>
              {showCalcExplain && (
                <p style={{ fontSize: 11, color: "var(--text-2)", margin: "6px 0 0", lineHeight: 1.5, background: "var(--cream-deep)", padding: "8px 10px", borderRadius: 8 }}>
                  {readinessExplainer(course)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* TODAY */}
          <section>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Today</div>
            {todayTasks.length === 0 && todayEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>Nothing today — you&apos;re clear here. ✦</p>
            ) : (
              <div className="flex flex-col gap-2">
                {todayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--ink)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: course.color }} />
                    {typeLabel(e.type)}: {e.title}
                  </div>
                ))}
                {todayTasks.map((t) => (
                  <StudyRow key={t.id} id={t.id} label={t.label} minutes={t.minutes}
                    done={completedIds.has(t.id)} onToggle={() => onToggleStudyTask(t.id)} />
                ))}
              </div>
            )}
          </section>

          {/* STUDY PLAN */}
          {target && tasks.length > 0 && (
            <section>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Study plan</div>
              <div style={{ background: "var(--yellow-soft)", borderRadius: 12, padding: "12px 14px" }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>✦ This week</div>
                <p style={{ fontSize: 13, color: "var(--ink2)", margin: 0, lineHeight: 1.5 }}>
                  Stay on top of {target.title} — it&apos;s {relativeLabel(target.date).toLowerCase()}. These steps get you ready before prep time runs out.
                </p>
              </div>
              <button
                onClick={() => setPlanOpen((v) => !v)}
                className="w-full flex items-center justify-between"
                style={{ background: "var(--cream-deep)", border: "none", borderRadius: 10, padding: "10px 14px", marginTop: 8, cursor: "pointer" }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  Full {target.type === "exam" ? "exam" : "deadline"} plan · {tasks.length} steps
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"
                  style={{ transform: planOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {planOpen && (
                <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
                  {tasks.map((t) => (
                    <StudyRow key={t.id} id={t.id} label={t.label} minutes={t.minutes} dateLabel={relativeLabel(t.date)}
                      done={completedIds.has(t.id)} onToggle={() => onToggleStudyTask(t.id)} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* GRADE BREAKDOWN + calculator */}
          <GradeBreakdown course={course} onOpenCalc={onOpenCalc} />

          {/* KYBER NOTICED (insights) */}
          <InsightCards course={course} />

          {/* FROM YOUR SYLLABUS */}
          {course.policies.length > 0 && (
            <section onClick={() => track.courseSectionViewed(course.code, "policies")}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>From your syllabus</div>
              <div className="flex flex-col gap-2">
                {course.policies.map((p) => (
                  <div key={p.label} className="rounded-xl" style={{ background: "var(--cream-deep)", padding: "10px 12px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-ink)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.label}</p>
                    <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>{p.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Study method + tips */}
          {course.studyMethod && (
            <section>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Study method</div>
              <p style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", margin: "0 0 4px" }}>{course.studyMethod.name}</p>
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{course.studyMethod.why}</p>
            </section>
          )}

          {/* Remove course */}
          <button
            onClick={() => { if (confirm(`Remove ${course.code}?`)) onDelete(); }}
            style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, padding: 0 }}
          >
            Remove course
          </button>
        </div>
      )}

      {/* bottom spacing when collapsed */}
      {!open && <div style={{ height: 14 }} />}
    </div>
  );
}

function StudyRow({
  label, minutes, dateLabel, done, onToggle,
}: {
  id: string; label: string; minutes: number; dateLabel?: string; done: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left flex items-center gap-3"
      style={{ background: "var(--cream-deep)", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", opacity: done ? 0.6 : 1 }}
    >
      <span
        style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
          border: `2px solid ${done ? "var(--amber)" : "var(--text-3)"}`,
          background: done ? "var(--amber)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
        )}
      </span>
      <span style={{ flex: 1, fontSize: 13, color: done ? "var(--text-3)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>
        {label}
      </span>
      <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
        {dateLabel ? `${dateLabel} · ` : ""}{minutes} min
      </span>
    </button>
  );
}
