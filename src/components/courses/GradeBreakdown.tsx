"use client";

import type { Course } from "@/lib/types";
import { componentAverage, letterGrade, currentStanding } from "@/lib/grades";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  onOpenCalc: () => void;
}

const SEG_COLORS = ["#e9a319", "#f5c451", "#38bdf8", "#a78bfa", "#34d399"];

export default function GradeBreakdown({ course, onOpenCalc }: Props) {
  const { standing } = currentStanding(course);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: "16px",
        border: "1px solid var(--border)",
      }}
      onClick={() => track.courseSectionViewed(course.code, "grade_breakdown")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
          Grade Breakdown
        </span>
        {standing != null && (
          <span style={{ fontWeight: 700, fontSize: 16, color: course.color }}>
            {standing.toFixed(0)}% · {letterGrade(standing)}
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div style={{ height: 8, borderRadius: 8, overflow: "hidden", display: "flex", marginBottom: 14 }}>
        {course.gradeComponents.map((c, i) => (
          <div
            key={c.id}
            style={{
              width: `${c.weight}%`,
              background: SEG_COLORS[i % SEG_COLORS.length],
              opacity: componentAverage(c) == null ? 0.35 : 1,
            }}
          />
        ))}
      </div>

      {/* Component rows */}
      <div className="flex flex-col gap-2">
        {course.gradeComponents.map((c, i) => {
          const avg = componentAverage(c);
          const color = SEG_COLORS[i % SEG_COLORS.length];
          return (
            <div key={c.id} className="flex items-center gap-2.5">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{c.name}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)", minWidth: 32, textAlign: "right" }}>
                {c.weight}%
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: avg == null ? "var(--text-3)" : color, minWidth: 36, textAlign: "right" }}>
                {avg == null ? "—" : `${avg.toFixed(0)}%`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calculator CTA */}
      <button
        onClick={() => {
          track.gradeCalculatorUsed(course.code);
          onOpenCalc();
        }}
        className="w-full mt-4 rounded-xl py-2.5 text-sm font-semibold transition-opacity"
        style={{
          background: "var(--yellow-soft)",
          color: "var(--amber-ink)",
          border: "1px solid #f2d48a",
          fontFamily: "Quicksand, sans-serif",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        What grade do I need? →
      </button>
    </div>
  );
}
