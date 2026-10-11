"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import {
  projectWithAssumptions,
  defaultAssumption,
  letterGrade,
  neededOnRemaining,
} from "@/lib/grades";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  onBack: () => void;
}

function gradeColor(pct: number): string {
  if (pct >= 80) return "#3faf76";
  if (pct >= 70) return "#e9a319";
  if (pct >= 60) return "#e8784a";
  return "#e0564a";
}

export default function GradeCalculator({ course, onBack }: Props) {
  const [assumptions, setAssumptions] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      course.gradeComponents.map((c) => [c.id, defaultAssumption(course, c)])
    )
  );

  const projected = projectWithAssumptions(course, assumptions);
  const needed = neededOnRemaining(course, course.targetGrade);
  const projectedLetter = letterGrade(projected);
  const targetLetter = letterGrade(course.targetGrade);
  const meetsTarget = projected >= course.targetGrade;
  const gColor = gradeColor(projected);
  const c = course.color;

  function setAssumption(compId: string, val: number) {
    track.gradeCalculatorUsed(course.code);
    setAssumptions((prev) => ({ ...prev, [compId]: val }));
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header bar */}
      <div style={{ padding: "14px 16px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)",
            borderRadius: 999, padding: "7px 14px 7px 10px", cursor: "pointer", color: c, fontWeight: 600, fontSize: 15,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, color: c, fontWeight: 700, margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>{course.code}</p>
          <p style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 16, margin: 0, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Grade Calculator
          </p>
        </div>
      </div>

      {/* Projected result card */}
      <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
        <div
          style={{
            borderRadius: 18,
            background: `linear-gradient(135deg, ${c}22 0%, ${c}0a 100%)`,
            border: `1.5px solid ${c}30`,
            padding: "16px 16px 14px",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 6px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Projected grade
              </p>
              <div className="flex items-end gap-2">
                <span style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 42, color: gColor, lineHeight: 1 }}>
                  {projected.toFixed(1)}
                </span>
                <span style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 20, color: "var(--text-2)", marginBottom: 4 }}>%</span>
              </div>
            </div>
            <div style={{ textAlign: "center", background: `${gColor}18`, borderRadius: 16, padding: "10px 14px" }}>
              <div style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 30, color: gColor, lineHeight: 1 }}>
                {projectedLetter}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 4, fontWeight: 600 }}>Letter</div>
            </div>
          </div>

          {/* Progress bar toward target */}
          <div style={{ marginTop: 10 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
                Target: {course.targetGrade}% ({targetLetter})
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: meetsTarget ? "#3faf76" : "var(--text-2)" }}>
                {meetsTarget ? "✓ On track" : `${(course.targetGrade - projected).toFixed(1)}% to go`}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: `${c}20`, overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (projected / 100) * 100)}%`, background: gColor, borderRadius: 6, transition: "width .3s" }} />
              {/* Target marker */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${course.targetGrade}%`, width: 2, background: "var(--text-2)", opacity: 0.4 }} />
            </div>
          </div>

          {/* Needed hint */}
          {needed && !meetsTarget && (
            <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 10, lineHeight: 1.45 }}>
              {needed.need > 100 ? (
                <>Hitting {course.targetGrade}% from here is a stretch — protect every remaining mark.</>
              ) : (
                <>
                  Need{" "}
                  <span style={{ fontWeight: 700, color: c }}>
                    {needed.need.toFixed(0)}%
                  </span>{" "}
                  on the remaining {needed.remainingWeight}% of your grade.
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "4px 16px 120px" }}>
        <div className="flex flex-col gap-3">
          {course.gradeComponents.map((comp) => {
            const val = assumptions[comp.id] ?? 0;
            const segColor = gradeColor(val);
            return (
              <div key={comp.id} style={{ background: "var(--surface)", borderRadius: 14, padding: "12px 14px", boxShadow: "var(--shadow-card)" }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{comp.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-3)", margin: "1px 0 0" }}>{comp.weight}% of grade</p>
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontFamily: "var(--ios-font)", fontSize: 20, fontWeight: 800, color: segColor }}>{val}</span>
                    <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={val}
                  onChange={(e) => setAssumption(comp.id, Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: segColor, height: 4 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
