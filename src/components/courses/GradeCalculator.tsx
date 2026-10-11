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

export default function GradeCalculator({ course, onBack }: Props) {
  const [assumptions, setAssumptions] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      course.gradeComponents.map((c) => [c.id, defaultAssumption(course, c)])
    )
  );

  const projected = projectWithAssumptions(course, assumptions);
  const needed = neededOnRemaining(course, course.targetGrade);

  function setAssumption(compId: string, val: number) {
    track.gradeCalculatorUsed(course.code);
    setAssumptions((prev) => ({ ...prev, [compId]: val }));
  }

  const projectedLetter = letterGrade(projected);
  const meetsTarget = projected >= course.targetGrade;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p style={{ fontSize: 11, color: course.color, fontWeight: 600, margin: 0 }}>{course.code}</p>
            <h2 style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 17, margin: 0, color: "var(--text)" }}>
              Grade Calculator
            </h2>
          </div>
        </div>
      </div>

      {/* Projected result — amber-gradient card (spec p.11), no red */}
      <div
        style={{
          padding: "20px 16px",
          background: "linear-gradient(135deg, #fff4cf 0%, #ffe6a6 100%)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <p style={{ color: "var(--amber-ink)", fontSize: 13, margin: "0 0 4px" }}>Projected final grade</p>
        <div className="flex items-end gap-3">
          <span
            style={{
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 700,
              fontSize: 50,
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            {projected.toFixed(1)}%
          </span>
          <span style={{ fontWeight: 700, fontSize: 22, color: "var(--amber-ink)", marginBottom: 4 }}>
            {projectedLetter}
          </span>
        </div>
        {needed && (
          <p style={{ fontSize: 12, color: "var(--ink2)", marginTop: 6 }}>
            {needed.need > 100 ? (
              <>Hitting {course.targetGrade}% from here is a stretch — aim to protect every remaining mark.</>
            ) : (
              <>
                Need{" "}
                <span style={{ fontWeight: 700, color: "var(--amber-ink)" }}>
                  {needed.need.toFixed(0)}%
                </span>{" "}
                on remaining {needed.remainingWeight}% to hit your {course.targetGrade}% target.
              </>
            )}
          </p>
        )}
      </div>

      {/* Sliders */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "16px" }}>
        <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 12 }}>
          Drag sliders to set your expected grade on each component.
        </p>
        <div className="flex flex-col gap-5">
          {course.gradeComponents.map((c) => {
            const val = assumptions[c.id] ?? 0;
            return (
              <div key={c.id}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: course.color }}>
                    {val}% <span style={{ color: "var(--text-3)", fontWeight: 400, fontSize: 11 }}>({c.weight}% of grade)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={val}
                  onChange={(e) => setAssumption(c.id, Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: course.color }}
                />
                <div className="flex justify-between">
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>0%</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>100%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
