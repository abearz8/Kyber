"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import {
  projectWithAssumptions,
  defaultAssumption,
  letterGrade,
  neededOnRemaining,
  hasMark,
  enteredMark,
} from "@/lib/grades";
import { track } from "@/lib/analytics";
import { Card, HighlightCard, Label, ChevronLeft, Pill } from "@/components/shared/ui";

interface Props {
  course: Course;
  onBack: () => void;
}

function gradeColor(pct: number): string {
  if (pct >= 80) return "var(--green-text)";
  if (pct >= 70) return "var(--amber-deep)";
  if (pct >= 60) return "#C7651F";
  return "#B23B3B";
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

  function setAssumption(compId: string, val: number) {
    track.gradeCalculatorUsed(course.code);
    setAssumptions((prev) => ({ ...prev, [compId]: val }));
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header bar */}
      <div style={{ padding: "14px 16px 8px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 2, fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
          <ChevronLeft /> Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "6px 16px calc(var(--tab-height) + 24px + var(--safe-bottom))" }}>
        <Label>{course.code}</Label>
        <h1 style={{ margin: "4px 0 14px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)" }}>Grade calculator</h1>

        {/* Projected result card */}
        <HighlightCard radius={20}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <Label>Projected grade</Label>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 44, color: gColor, lineHeight: 1, letterSpacing: "-1px" }}>{projected.toFixed(1)}</span>
                <span style={{ fontWeight: 700, fontSize: 22, color: "var(--text-2)", marginBottom: 4 }}>%</span>
              </div>
            </div>
            <div style={{ textAlign: "center", background: "var(--surface)", borderRadius: 14, padding: "10px 16px", border: "1px solid var(--warn-border)" }}>
              <div style={{ fontWeight: 800, fontSize: 30, color: gColor, lineHeight: 1 }}>{projectedLetter}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, fontWeight: 600 }}>Letter</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500 }}>Target: {course.targetGrade}% ({targetLetter})</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: meetsTarget ? "var(--green-text)" : "var(--text-2)" }}>
                {meetsTarget ? "✓ On track" : `${(course.targetGrade - projected).toFixed(1)}% to go`}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: "rgba(39,37,31,.08)", overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", width: `${Math.min(100, projected)}%`, background: "var(--amber)", borderRadius: 8, transition: "width .3s" }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${course.targetGrade}%`, width: 2, background: "var(--ink)", opacity: 0.45 }} />
            </div>
          </div>

          {needed && !meetsTarget && (
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "12px 0 0", lineHeight: 1.45, fontWeight: 500 }}>
              {needed.need > 100 ? (
                <>Hitting {course.targetGrade}% from here is a stretch — protect every remaining mark.</>
              ) : (
                <>Need <b style={{ color: "var(--ink)" }}>{needed.need.toFixed(0)}%</b> on the remaining {needed.remainingWeight}% of your grade.</>
              )}
            </p>
          )}
        </HighlightCard>

        {/* Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {course.gradeComponents.map((comp) => {
            const locked = hasMark(comp);
            const val = locked ? (enteredMark(comp) ?? 0) : (assumptions[comp.id] ?? 0);
            return (
              <Card key={comp.id} pad="14px 16px">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: locked ? 0 : 8, gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{comp.name}</p>
                    <p style={{ fontSize: 15, color: "var(--text-2)", margin: "2px 0 0", fontWeight: 500 }}>{comp.weight}% of grade</p>
                  </div>
                  {locked && <Pill text="Entered" bg="var(--green-bg)" color="var(--green-text)" />}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: locked ? "var(--ink)" : gradeColor(val) }}>{val}</span>
                    <span style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 600 }}>%</span>
                  </div>
                </div>
                {!locked && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={val}
                    onChange={(e) => setAssumption(comp.id, Number(e.target.value))}
                    className="w-full kyber-range"
                    style={{ ["--fill" as string]: `${val}%` }}
                  />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
