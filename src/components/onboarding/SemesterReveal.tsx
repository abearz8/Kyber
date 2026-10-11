"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/types";
import KyberLogo from "@/components/shared/KyberLogo";
import { downloadICS } from "@/lib/plan";

interface Props {
  courses: Course[];
  onEnter: () => void;
}

function computeStats(courses: Course[]) {
  const allEvents = courses.flatMap((c) => c.events);
  const deadlines = allEvents.length;
  const examsEssays = allEvents.filter(
    (e) => e.type === "exam" || (e.type === "assignment" && e.weight >= 15)
  ).length;

  const dates = allEvents.map((e) => e.date).filter(Boolean).sort();
  let weeks = 15;
  if (dates.length > 1) {
    const [y1, m1, d1] = dates[0].split("-").map(Number);
    const [y2, m2, d2] = dates[dates.length - 1].split("-").map(Number);
    const ms = new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
    weeks = Math.max(1, Math.round(ms / (7 * 86_400_000)));
  }
  return { deadlines, courses: courses.length, examsEssays, weeks };
}

/** Short "12 quizzes · 2 exams · grade weights" summary line per course. */
function summarize(course: Course): string {
  const counts: Record<string, number> = {};
  for (const e of course.events) counts[e.type] = (counts[e.type] ?? 0) + 1;
  const plural: Record<string, [string, string]> = {
    quiz: ["quiz", "quizzes"],
    exam: ["exam", "exams"],
    assignment: ["assignment", "assignments"],
    lab: ["lab", "labs"],
    reading: ["reading", "readings"],
  };
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type, n]) => {
      const forms = plural[type];
      const word = forms ? forms[n === 1 ? 0 : 1] : type;
      return `${n} ${word}`;
    });
  if (course.gradeComponents.length > 0) parts.push("grade weights");
  return parts.join(" · ");
}

export default function SemesterReveal({ courses, onEnter }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(0);
  const stats = computeStats(courses);
  const shown = courses.slice(0, 5);

  // Tick a green check onto each course row, then reveal the stats.
  useEffect(() => {
    if (checked < shown.length) {
      const t = setTimeout(() => setChecked((c) => c + 1), checked === 0 ? 500 : 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed(true), 650);
    return () => clearTimeout(t);
  }, [checked, shown.length]);

  return (
    <div
      className="flex flex-col h-full px-6"
      style={{ background: "var(--bg-gradient)", overflowY: "auto" }}
    >
      {!revealed ? (
        <div className="flex-1 flex flex-col" style={{ paddingTop: 80 }}>
          <div className="flex flex-col items-center">
            <KyberLogo size={64} />
            <h1
              style={{
                fontFamily: "var(--ios-font)",
                fontWeight: 800,
                fontSize: 27,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                margin: "26px 0 0",
              }}
            >
              Reading your syllabi…
            </h1>
          </div>

          <div className="flex flex-col gap-4" style={{ marginTop: 40 }}>
            {shown.map((c, i) => {
              const done = i < checked;
              return (
                <div key={c.id} className="flex items-start gap-3" style={{ opacity: done ? 1 : 0.5, transition: "opacity .3s" }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      marginTop: 1,
                      background: done ? "var(--green)" : "transparent",
                      border: done ? "none" : "2px solid #d8cdba",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background .3s",
                    }}
                  >
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.25 }}>
                      {c.code} · {c.title}
                    </p>
                    <p style={{ fontSize: 14, color: "var(--text-2)", margin: "2px 0 0", lineHeight: 1.35 }}>
                      {summarize(c)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ paddingTop: 70, paddingBottom: 30, animation: "fadeUp .45s ease both" }}>
          <div className="flex flex-col items-center text-center">
            <KyberLogo size={64} />
            <h1
              style={{
                fontFamily: "var(--ios-font)",
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: "-0.02em",
                color: "var(--orange-cta)",
                margin: "24px 0 0",
              }}
            >
              Your semester appeared.
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: 16, marginTop: 10, lineHeight: 1.45, maxWidth: 300 }}>
              Every date, weight, and reading from {courses.length} syllabi, now one calm plan.
            </p>
          </div>

          {/* Stat tiles */}
          <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatTile value={stats.deadlines} label="deadlines mapped" wide />
            <StatTile value={stats.courses} label="courses" />
            <StatTile value={stats.examsEssays} label="exams, formats known" />
            <StatTile value={stats.weeks} label="weeks planned" wide />
          </div>

          <div style={{ flex: 1, minHeight: 24 }} />

          <button
            onClick={onEnter}
            className="w-full"
            style={{
              marginTop: 28,
              background: "var(--orange-cta)",
              color: "#fff",
              fontFamily: "var(--ios-font)",
              fontWeight: 700,
              fontSize: 18,
              border: "none",
              borderRadius: 16,
              padding: "16px 0",
              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(232,146,30,0.32)",
            }}
          >
            Show me my courses
          </button>

          <button
            onClick={() => downloadICS(courses, [])}
            className="w-full flex items-center justify-center gap-2"
            style={{
              marginTop: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--orange-cta)",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M12 14v4M10 16h4" />
            </svg>
            Add important dates to your calendar
          </button>

          <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }`}</style>
        </div>
      )}
    </div>
  );
}

function StatTile({ value, label, wide }: { value: number; label: string; wide?: boolean }) {
  return (
    <div
      style={{
        gridColumn: wide ? "span 2" : "span 1",
        background: "#f6ead6",
        borderRadius: 18,
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: "var(--ios-font)",
          fontWeight: 800,
          fontSize: 34,
          color: "var(--orange-cta)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 15, color: "var(--ink2)", lineHeight: 1.25 }}>{label}</span>
    </div>
  );
}
