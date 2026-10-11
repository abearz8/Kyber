"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/types";

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

export default function SemesterReveal({ courses, onEnter }: Props) {
  const [revealed, setRevealed] = useState(false);
  const stats = computeStats(courses);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex flex-col h-full items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(120% 60% at 50% 35%, #fff4cf 0%, var(--cream) 60%)",
      }}
    >
      {/* App icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kyber-logo.png"
        alt="Kyber"
        width={64}
        height={64}
        style={{ width: 64, height: 64, borderRadius: 16, objectFit: "contain", marginBottom: 20 }}
      />

      {!revealed ? (
        <>
          <p style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 20, color: "var(--ink)", margin: 0 }}>
            Reading your syllabi…
          </p>
          <div className="mt-6 w-full max-w-[260px] flex flex-col gap-2">
            {courses.slice(0, 5).map((c, i) => (
              <div
                key={c.id}
                className="shimmer"
                style={{
                  height: 14,
                  borderRadius: 7,
                  background: "var(--cream-deep)",
                  width: `${90 - i * 8}%`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes kyberPulse { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
            .shimmer { animation: kyberPulse 1.1s ease-in-out infinite; }
          `}</style>
        </>
      ) : (
        <div className="w-full flex flex-col items-center" style={{ animation: "fadeUp .45s ease both" }}>
          <h1 style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--ink)", margin: 0, textAlign: "center" }}>
            Your semester appeared.
          </h1>
          <p style={{ color: "var(--amber-ink)", fontSize: 13, marginTop: 6, textAlign: "center", maxWidth: 260 }}>
            Every date, weight and reading, pulled from your {courses.length} syllabi — now one calm plan.
          </p>

          {/* Stat tiles */}
          <div className="w-full max-w-[300px] mt-7 grid grid-cols-2 gap-2.5">
            <StatTile value={stats.deadlines} label="deadlines mapped" wide />
            <StatTile value={stats.courses} label="courses" />
            <StatTile value={stats.examsEssays} label="exams & essays" />
            <StatTile value={stats.weeks} label="weeks planned" wide />
          </div>

          <button
            onClick={onEnter}
            className="w-full max-w-[300px] mt-7 rounded-xl py-3"
            style={{
              background: "var(--amber)",
              color: "var(--ink)",
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
            }}
          >
            Show me my courses
          </button>

          <style>{`
            @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
          `}</style>
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
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--amber-ink)", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</span>
    </div>
  );
}
