"use client";

import type { Course } from "@/lib/types";
import { submittedProgress } from "@/lib/grades";
import { nextEvent } from "@/lib/events";
import { relativeLabel, fmtShort } from "@/lib/dates";
import { track } from "@/lib/analytics";

interface Props {
  course: Course;
  onClick: () => void;
}

export default function CourseCard({ course, onClick }: Props) {
  const progress = submittedProgress(course);
  const next = nextEvent(course);

  return (
    <button
      onClick={() => {
        track.courseOpened(course.code);
        onClick();
      }}
      className="w-full text-left rounded-2xl p-4 flex flex-col gap-2.5 transition-transform active:scale-[0.98]"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: course.color,
              letterSpacing: "0.04em",
            }}
          >
            {course.code}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text)",
              lineHeight: 1.3,
              marginTop: 1,
            }}
          >
            {course.title}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {progress > 0 ? `${progress}% submitted` : "No grades yet"}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: course.color,
              borderRadius: 4,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Next event */}
      {next && (
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: course.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>
            <span style={{ fontWeight: 500 }}>{next.title}</span>
            {" · "}
            <span style={{ color: "var(--text-3)" }}>
              {relativeLabel(next.date)} ({fmtShort(next.date)})
            </span>
          </span>
        </div>
      )}
    </button>
  );
}
