"use client";

import { useState } from "react";
import type { Course, PlanView } from "@/lib/types";
import { isoToday, addDays, weekDays, monthGrid, fmtMonthYear } from "@/lib/dates";
import { eventsOnDate, allUpcoming } from "@/lib/events";
import { fmtFull, relativeLabel, fmtShort } from "@/lib/dates";
import { typeLabel } from "@/lib/events";
import { track } from "@/lib/analytics";
import { useStore } from "@/hooks/useStore";

const EVENT_DOT_COLORS: Record<string, string> = {
  exam: "#ef4444",
  quiz: "#f97316",
  assignment: "#38bdf8",
  lab: "#34d399",
  reading: "#a78bfa",
};

interface Props {
  courses: Course[];
}

export default function PlanTab({ courses }: Props) {
  const { state, dispatch } = useStore();
  const view = state.planView;
  const today = isoToday();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [monthOffset, setMonthOffset] = useState(0);

  function setView(v: PlanView) {
    dispatch({ type: "SET_PLAN_VIEW", view: v });
    track.planViewed(v);
  }

  // Build the month to display
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{ padding: "16px 16px 0", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text)", margin: 0 }}>
            Plan
          </h1>
          {/* View switcher */}
          <div
            style={{
              display: "flex",
              background: "var(--surface-2)",
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {(["month", "week", "day"] as PlanView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? "var(--surface)" : "transparent",
                  border: view === v ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: view === v ? 600 : 400,
                  color: view === v ? "var(--text)" : "var(--text-3)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === "month" && (
          <MonthView
            courses={courses}
            year={year}
            month={month}
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setView("day");
            }}
            onPrev={() => setMonthOffset((o) => o - 1)}
            onNext={() => setMonthOffset((o) => o + 1)}
          />
        )}
        {view === "week" && (
          <WeekView
            courses={courses}
            anchor={selectedDate}
            onSelectDay={(d) => {
              setSelectedDate(d);
              setView("day");
            }}
          />
        )}
        {view === "day" && (
          <DayView
            courses={courses}
            date={selectedDate}
            onChangeDate={setSelectedDate}
          />
        )}
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  courses,
  year,
  month,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  courses: Course[];
  year: number;
  month: number;
  selected: string;
  onSelect: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const today = isoToday();
  const cells = monthGrid(year, month);
  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Build event map: date → array of colors
  const eventMap = new Map<string, string[]>();
  for (const c of courses) {
    for (const e of c.events) {
      const arr = eventMap.get(e.date) ?? [];
      arr.push(EVENT_DOT_COLORS[e.type] ?? c.color);
      eventMap.set(e.date, arr);
    }
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>
          {fmtMonthYear(year, month)}
        </span>
        <button onClick={onNext} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day of week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DOW.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--text-3)", padding: "2px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const dots = eventMap.get(cell) ?? [];
          const isToday = cell === today;
          const isSelected = cell === selected;
          return (
            <button
              key={cell}
              onClick={() => onSelect(cell)}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                borderRadius: 8,
                background: isSelected ? "#f97316" : isToday ? "#f9731620" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 400,
                  color: isSelected ? "#fff" : isToday ? "#f97316" : "var(--text)",
                }}
              >
                {parseInt(cell.split("-")[2])}
              </span>
              {dots.length > 0 && (
                <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                  {dots.slice(0, 3).map((color, di) => (
                    <div
                      key={di}
                      style={{ width: 4, height: 4, borderRadius: "50%", background: isSelected ? "#fff" : color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Upcoming list */}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Upcoming
        </p>
        <UpcomingList courses={courses} limit={6} />
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  courses,
  anchor,
  onSelectDay,
}: {
  courses: Course[];
  anchor: string;
  onSelectDay: (d: string) => void;
}) {
  const today = isoToday();
  const days = weekDays(anchor);

  return (
    <div style={{ padding: "12px 16px" }}>
      <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", margin: "0 0 12px" }}>
        {fmtShort(days[0])} – {fmtShort(days[6])}
      </p>
      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const events = eventsOnDate(courses, day);
          const isToday = day === today;
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className="w-full text-left rounded-2xl overflow-hidden transition-all"
              style={{
                border: isToday ? "1.5px solid #f97316" : "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              <div
                style={{
                  padding: "8px 12px 6px",
                  background: isToday ? "#f9731610" : "transparent",
                  borderBottom: events.length ? "1px solid var(--border)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? "#f97316" : "var(--text)" }}>
                  {new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                {events.length > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{events.length} item{events.length > 1 ? "s" : ""}</span>
                )}
              </div>
              {events.length > 0 && (
                <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {events.map((e) => {
                    const course = courses.find((c) => c.id === e.courseId);
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: EVENT_DOT_COLORS[e.type] ?? course?.color ?? "#f97316", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{e.title}</span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{course?.code}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  courses,
  date,
  onChangeDate,
}: {
  courses: Course[];
  date: string;
  onChangeDate: (d: string) => void;
}) {
  const events = eventsOnDate(courses, date);
  const today = isoToday();
  const isToday = date === today;

  return (
    <div style={{ padding: "12px 16px" }}>
      {/* Day navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onChangeDate(addDays(date, -1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text)", margin: 0 }}>
            {fmtFull(date)}
          </p>
          {isToday && (
            <span style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>Today</span>
          )}
        </div>
        <button onClick={() => onChangeDate(addDays(date, 1))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-3)" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>Nothing due</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e) => {
            const course = courses.find((c) => c.id === e.courseId);
            const color = EVENT_DOT_COLORS[e.type] ?? course?.color ?? "#f97316";
            return (
              <button
                key={e.id}
                className="w-full text-left flex gap-3 rounded-2xl p-4 transition-all"
                style={{ background: "var(--surface)", border: `1px solid ${color}30` }}
                onClick={() => track.planItemOpened(e.type)}
              >
                <div style={{ width: 4, borderRadius: 2, background: color, flexShrink: 0, alignSelf: "stretch" }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: course?.color ?? "#f97316", background: (course?.color ?? "#f97316") + "18", borderRadius: 4, padding: "1px 5px" }}>
                      {course?.code ?? e.courseId}
                    </span>
                    <span style={{ fontSize: 11, color, fontWeight: 600 }}>{typeLabel(e.type)}</span>
                    {e.weight > 0 && <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {e.weight}%</span>}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>{e.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shared: Upcoming list ────────────────────────────────────────────────────

function UpcomingList({ courses, limit }: { courses: Course[]; limit: number }) {
  const events = allUpcoming(courses).slice(0, limit);
  if (!events.length) return <p style={{ color: "var(--text-3)", fontSize: 13 }}>No upcoming events.</p>;

  return (
    <div className="flex flex-col gap-2">
      {events.map((e) => {
        const course = courses.find((c) => c.id === e.courseId);
        const color = EVENT_DOT_COLORS[e.type] ?? course?.color ?? "#f97316";
        return (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{e.title}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 6 }}>· {course?.code}</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{relativeLabel(e.date)}</span>
          </div>
        );
      })}
    </div>
  );
}
