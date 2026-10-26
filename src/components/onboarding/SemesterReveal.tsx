"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/types";
import { summarizeCourseEvents } from "@/lib/events";
import { downloadICS } from "@/lib/plan";
import { track } from "@/lib/analytics";
import OnboardingFrame from "./OnboardingFrame";
import Icon, { type IconName } from "@/components/shared/Icon";
import { PrimaryButton, TextLink, CheckIcon } from "@/components/shared/ui";

interface Props {
  courses: Course[];
  onEnter: () => void;
  /** Uploads already showed real progress; demo loads get the short simulated tick. */
  skipReading?: boolean;
}

function computeStats(courses: Course[]) {
  const allEvents = courses.flatMap((c) => c.events);
  const deadlines = allEvents.length;
  const exams = allEvents.filter((e) => e.type === "exam").length;
  const coursesWithoutDates = courses.filter((c) => c.events.length === 0).length;

  const dates = allEvents.map((e) => e.date).filter(Boolean).sort();
  let weeks: number | null = null;
  if (dates.length > 1) {
    const [y1, m1, d1] = dates[0].split("-").map(Number);
    const [y2, m2, d2] = dates[dates.length - 1].split("-").map(Number);
    const ms = new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
    weeks = Math.max(1, Math.round(ms / (7 * 86_400_000)));
  }
  return { deadlines, courses: courses.length, exams, weeks, coursesWithoutDates };
}

export default function SemesterReveal({ courses, onEnter, skipReading }: Props) {
  const [revealed, setRevealed] = useState(!!skipReading);
  const [checked, setChecked] = useState(0);
  const [info, setInfo] = useState<string | null>(null);
  const stats = computeStats(courses);
  const shown = courses.slice(0, 5);

  // Demo path: tick a check onto each course row, then reveal the stats.
  useEffect(() => {
    if (revealed) return;
    if (checked < shown.length) {
      const t = setTimeout(() => setChecked((c) => c + 1), checked === 0 ? 500 : 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed(true), 650);
    return () => clearTimeout(t);
  }, [checked, shown.length, revealed]);

  if (!revealed) {
    return (
      <OnboardingFrame>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--ink)" }}>Reading your syllabi</h1>
          <span style={{ display: "inline-flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", animation: `kyberPulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
            ))}
          </span>
        </div>
        <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 16, color: "var(--ink)" }}>This can take a minute.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {shown.map((c, i) => {
            const done = i < checked;
            const now = i === checked;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: done ? "var(--soft)" : "var(--surface)", border: `1.5px solid ${done || now ? "var(--amber)" : "var(--line)"}`, transition: "background .3s" }}>
                <span style={{ width: 56, height: 56, borderRadius: "50%", background: done ? "var(--amber-light)" : "var(--soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="reading" size={28} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{c.code} · {c.title}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 500, color: "var(--ink)", marginTop: 3 }}>{done ? summarizeCourseEvents(c) : now ? "Reading now" : "Up next"}</div>
                </div>
                {done ? (
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckIcon size={15} /></span>
                ) : now ? (
                  <span style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid rgba(233,163,25,.25)", borderTopColor: "var(--amber)", animation: "kyberSpin .9s linear infinite", flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--line)", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </OnboardingFrame>
    );
  }

  const tiles: { key: string; value: number | null; label: string; icon: IconName; info: string }[] = [
    { key: "deadlines", value: stats.deadlines, label: "deadlines mapped", icon: "deadlines", info: "Every dated assignment, quiz, lab, reading and exam Kyber read from your syllabi." },
    { key: "courses", value: stats.courses, label: stats.courses === 1 ? "course" : "courses", icon: "tab-courses", info: "One course per syllabus. You can add more any time from Settings." },
    { key: "exams", value: stats.exams, label: stats.exams === 1 ? "exam found" : "exams found", icon: "reading", info: "Midterms and finals, including ones scheduled inside an exam period." },
    { key: "weeks", value: stats.weeks, label: "weeks planned", icon: "weeks", info: "From your first deadline to your last. Kyber spreads study blocks across them." },
  ];

  return (
    <OnboardingFrame
      centered
      title={<>Your semester <em className="marker">appeared</em>.</>}
      sub={`Here's what Kyber found in your ${courses.length} ${courses.length === 1 ? "syllabus" : "syllabi"}.`}
      contentStyle={{ animation: "fadeUp .45s ease both" }}
      footer={
        <>
          <PrimaryButton label="Continue" onClick={onEnter} />
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <TextLink label="Add important dates to your calendar" size={15} onClick={() => { track.calendarExported("reveal"); downloadICS(courses, []); }} />
          </div>
        </>
      }
    >
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {tiles.filter((t) => t.value !== null).map((t) => (
          <StatTile key={t.key} value={t.value!} label={t.label} icon={t.icon} open={info === t.key} onInfo={() => setInfo(info === t.key ? null : t.key)} info={t.info} />
        ))}
      </div>
      {stats.coursesWithoutDates > 0 && (
        <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--amber-ink)", textAlign: "center", margin: "16px 0 0", lineHeight: 1.45 }}>
          {stats.coursesWithoutDates} {stats.coursesWithoutDates === 1 ? "course has" : "courses have"} no dates — add them from the course page.
        </p>
      )}
    </OnboardingFrame>
  );
}

function StatTile({ value, label, icon, info, open, onInfo }: { value: number; label: string; icon: IconName; info: string; open: boolean; onInfo: () => void }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--grad-soft)", border: "1.5px solid var(--warn-border)", borderRadius: 18, padding: "16px 14px", minHeight: 150, display: "flex", flexDirection: "column" }}>
      {/* Diagonal sheen */}
      <span aria-hidden style={{ position: "absolute", width: 220, height: 120, right: -70, bottom: -40, background: "var(--soft-end)", transform: "rotate(-35deg)", opacity: 0.8 }} />
      <span style={{ position: "absolute", top: 12, right: 12, width: 48, height: 48, borderRadius: "50%", background: "var(--amber-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={26} />
      </span>
      <div style={{ position: "relative", fontWeight: 700, fontSize: 44, letterSpacing: "-1px", color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      <button onClick={onInfo} aria-expanded={open} style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 17.5, fontWeight: 700, color: "var(--ink)" }}>
        {label}
        <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid var(--ink)", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>i</span>
      </button>
      {open && <p style={{ position: "relative", margin: "8px 0 0", fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.4 }}>{info}</p>}
    </div>
  );
}
