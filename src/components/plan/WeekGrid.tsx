"use client";

import type { PlanDay, PlanItem } from "@/lib/plan";
import { gridHourLabels, gridPosition, splitPinned, assignLanes, GRID_START_MIN, GRID_END_MIN } from "@/lib/plan";
import { fmtDayShort } from "@/lib/dates";

interface Props {
  days: PlanDay[];
  today: string;
  onSelectItem: (item: PlanItem) => void;
}

const PX_PER_HOUR = 44;
const HEIGHT = ((GRID_END_MIN - GRID_START_MIN) / 60) * PX_PER_HOUR;

/** Visual treatment per item kind — matches the legend. */
export function itemTone(it: PlanItem): { bg: string; border: string; dashed?: boolean } {
  if (it.kind === "study" || it.kind === "ai") return { bg: "var(--soft)", border: "var(--amber)" };
  if (it.kind === "personal") {
    if (it.personalKind === "class") return { bg: "var(--purple-bg)", border: "var(--purple)" };
    if (it.personalKind === "fun" || it.personalKind === "sport" || it.personalKind === "social") return { bg: "var(--green-bg)", border: "#9CC5A1" };
    if (it.personalKind === "study_block" || it.personalKind === "study") return { bg: "var(--soft)", border: "var(--amber)" };
    if (it.personalKind === "deadline") return { bg: "#FFEEDD", border: "#FF8A7A" };
    return { bg: "var(--cream-deep)", border: "var(--checkbox)" };
  }
  // course events (exam / lab / due) — tinted with the course colour
  return { bg: `${it.color}26`, border: it.color };
}

function titleFor(it: PlanItem): { main: string; sub?: string } {
  if (it.kind === "course") return { main: it.courseCode ?? it.title, sub: it.eventType === "exam" ? "Exam" : it.eventType === "lab" ? "Lab" : it.title };
  if (it.kind === "study" || it.kind === "ai") return { main: shorten(it.title), sub: it.courseCode };
  if (it.kind === "personal" && it.personalKind === "fun") return { main: "Fun", sub: it.title };
  return { main: it.title };
}

function shorten(t: string): string {
  const map: Record<string, string> = {
    "Review lecture notes": "Review",
    "Work through practice problems": "Practice",
    "Do a past exam under time": "Past exam",
    "Build a one-page summary sheet": "Summary sheet",
    "Outline and gather sources": "Outline",
    "Draft the main sections": "Draft",
    "Revise and finalise": "Revise",
  };
  return map[t] ?? t;
}

export default function WeekGrid({ days, today, onSelectItem }: Props) {
  const hours = gridHourLabels(2);
  const split = days.map((d) => ({ day: d, ...splitPinned(d.items) }));
  const anyPinned = split.some((s) => s.pinned.length > 0);
  const n = days.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Day headers */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--grid-line)", paddingBottom: 6 }}>
        <div style={{ width: 36, flexShrink: 0 }} />
        {days.map((d) => (
          <div key={d.date} style={{ flex: 1, textAlign: "center", fontSize: n > 3 ? 14.5 : 17, fontWeight: 700, color: d.date === today ? "var(--ink)" : "var(--text-2)" }}>
            {fmtDayShort(d.date)}
          </div>
        ))}
      </div>

      {/* Pinned (all-day / due) chips */}
      {anyPinned && (
        <div style={{ display: "flex", padding: "6px 0 4px", borderBottom: "1px dashed var(--grid-line)" }}>
          <div style={{ width: 36, flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--text-3)", paddingTop: 4 }}>due</div>
          {split.map((s) => (
            <div key={s.day.date} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, padding: "0 2px" }}>
              {s.pinned.map((it) => {
                const tone = itemTone(it);
                return (
                  <button
                    key={it.id}
                    onClick={() => onSelectItem(it)}
                    title={it.title}
                    style={{
                      textAlign: "left", background: tone.bg, borderLeft: `3px solid ${tone.border}`, border: `1px solid ${tone.border}`,
                      borderLeftWidth: 3, borderRadius: 8, padding: "3px 6px", cursor: "pointer", overflow: "hidden",
                      fontSize: n > 3 ? 12 : 13.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}
                  >
                    {it.courseCode ? `${it.courseCode.replace(/^[A-Z]+\s*/i, "")} · ` : ""}{it.title}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Timed grid */}
      <div style={{ display: "flex", position: "relative", height: HEIGHT, marginTop: 6 }}>
        {/* Hour rules */}
        {hours.map((h) => (
          <div key={h.min} style={{ position: "absolute", left: 36, right: 0, top: ((h.min - GRID_START_MIN) / 60) * PX_PER_HOUR, borderTop: "1px dashed var(--grid-line)", pointerEvents: "none" }} />
        ))}
        {/* Time column */}
        <div style={{ width: 36, flexShrink: 0, position: "relative" }}>
          {hours.map((h) => (
            <span key={h.min} style={{ position: "absolute", top: ((h.min - GRID_START_MIN) / 60) * PX_PER_HOUR - 8, left: 0, fontSize: 14, fontWeight: 500, color: "var(--text-3)" }}>
              {h.label}
            </span>
          ))}
        </div>
        {/* Day columns */}
        {split.map((s) => {
          const lanes = assignLanes(s.timed);
          const isToday = s.day.date === today;
          return (
            <div
              key={s.day.date}
              style={{
                flex: 1, minWidth: 0, position: "relative", borderLeft: "1px solid var(--grid-line)",
                background: isToday && n > 1 ? "#FFF8E6" : "transparent",
              }}
            >
              {s.timed.length === 0 && s.pinned.length === 0 && (
                <span style={{ position: "absolute", top: 12, left: 0, right: 0, textAlign: "center", fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>
                  {n <= 2 ? "Nothing planned" : "Free"}
                </span>
              )}
              {lanes.map(({ item, lane, laneCount }) => {
                const pos = gridPosition(item, PX_PER_HOUR);
                if (!pos) return null;
                const tone = itemTone(item);
                const t = titleFor(item);
                const showSub = pos.height >= 40 && t.sub;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    title={item.title}
                    style={{
                      position: "absolute", top: pos.top + 1, height: pos.height - 2,
                      left: `calc(${(lane / laneCount) * 100}% + 3px)`, width: `calc(${100 / laneCount}% - 6px)`,
                      background: tone.bg, border: `1px solid ${tone.border}`, borderLeft: `3px solid ${tone.border}`,
                      borderRadius: 8, padding: "3px 6px", cursor: "pointer", textAlign: "left", overflow: "hidden",
                    }}
                  >
                    <div style={{ fontSize: n > 3 ? 12.5 : 15, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.main}
                    </div>
                    {showSub && (
                      <div style={{ fontSize: n > 3 ? 11.5 : 14, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.sub}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
