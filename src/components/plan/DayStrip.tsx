"use client";

import { fmtWeekdayShort, dayOfMonth, addDays } from "@/lib/dates";

interface Props {
  days: string[]; // 7 ISO dates, today first
  today: string;
  rangeStart: string;
  dayCount: number;
  onSelect: (iso: string) => void;
}

/** Seven-day strip. Today is the leftmost chip; the highlighted chips are the days shown below. */
export default function DayStrip({ days, today, rangeStart, dayCount, onSelect }: Props) {
  const rangeEnd = addDays(rangeStart, dayCount - 1);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {days.map((d) => {
        const isToday = d === today;
        const inRange = d >= rangeStart && d <= rangeEnd;
        const isStart = d === rangeStart;
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            aria-pressed={isStart}
            aria-label={`${fmtWeekdayShort(d)} ${dayOfMonth(d)}${isToday ? ", today" : ""}`}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "8px 0 6px", borderRadius: 12, border: "none", cursor: "pointer",
              background: inRange ? "var(--soft)" : "transparent",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: isToday || isStart ? 700 : 500, color: inRange ? "var(--ink)" : "var(--text-2)" }}>
              {fmtWeekdayShort(d)}
            </span>
            <span style={{
              width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: isToday ? "var(--amber)" : "transparent",
              fontSize: 16, fontWeight: 600, color: "var(--ink)",
            }}>
              {dayOfMonth(d)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
