"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import GradeBreakdown from "./GradeBreakdown";
import InsightCards from "./InsightCards";
import GradeCalculator from "./GradeCalculator";
import { upcoming } from "@/lib/events";
import { fmtFull, relativeLabel } from "@/lib/dates";
import { typeLabel } from "@/lib/events";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const EVENT_COLORS: Record<string, string> = {
  exam: "#ef4444",
  quiz: "#f97316",
  assignment: "#38bdf8",
  lab: "#34d399",
  reading: "#a78bfa",
};

export default function CourseDetail({ course, onBack, onDelete }: Props) {
  const [showCalc, setShowCalc] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  if (showCalc) {
    return <GradeCalculator course={course} onBack={() => setShowCalc(false)} />;
  }

  const upcomingEvents = upcoming(course);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0, marginTop: 3 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: course.color, fontWeight: 600, margin: "0 0 2px", letterSpacing: "0.04em" }}>
              {course.code}
            </p>
            <h1
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {course.title}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: "3px 0 0" }}>
              {course.instructor} · {course.term}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm(`Remove ${course.code}?`)) onDelete(course.id);
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, marginTop: 2 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>

        {/* Color accent bar */}
        <div style={{ height: 3, borderRadius: 2, background: course.color, marginTop: 12 }} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Grade breakdown */}
        <GradeBreakdown course={course} onOpenCalc={() => setShowCalc(true)} />

        {/* Insights */}
        <InsightCards course={course} />

        {/* Study method */}
        {course.studyMethod && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid var(--border)",
            }}
            onClick={() => track.courseSectionViewed(course.code, "study_method")}
          >
            <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", margin: "0 0 8px" }}>
              📖 Recommended Approach
            </h3>
            <p style={{ fontWeight: 600, fontSize: 14, color: course.color, margin: "0 0 4px" }}>
              {course.studyMethod.name}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>
              {course.studyMethod.why}
            </p>
          </div>
        )}

        {/* Tips */}
        {course.tips.length > 0 && (
          <div
            style={{ background: "var(--surface)", borderRadius: 16, padding: 16, border: "1px solid var(--border)" }}
            onClick={() => track.courseSectionViewed(course.code, "tips")}
          >
            <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", margin: "0 0 10px" }}>
              💡 Tips
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {course.tips.map((tip, i) => (
                <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: course.color, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <div onClick={() => track.courseSectionViewed(course.code, "events")}>
            <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", margin: "0 0 10px" }}>
              Upcoming Dates
            </h3>
            <div className="flex flex-col gap-2">
              {upcomingEvents.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: EVENT_COLORS[e.type] || course.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>{e.title}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 0" }}>
                      {typeLabel(e.type)} · {fmtFull(e.date)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      background: "var(--surface-2)",
                      borderRadius: 6,
                      padding: "2px 6px",
                      flexShrink: 0,
                    }}
                  >
                    {relativeLabel(e.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policies */}
        {course.policies.length > 0 && (
          <div onClick={() => track.courseSectionViewed(course.code, "policies")}>
            <button
              onClick={() => setPoliciesOpen(!policiesOpen)}
              className="w-full flex items-center justify-between"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 10px" }}
            >
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", margin: 0 }}>
                Policies
              </h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-3)"
                strokeWidth="2"
                style={{ transform: policiesOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {policiesOpen && (
              <div className="flex flex-col gap-2">
                {course.policies.map((p) => (
                  <div
                    key={p.label}
                    className="rounded-xl p-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {p.label}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{p.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
