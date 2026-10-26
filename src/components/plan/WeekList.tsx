"use client";

import type { PlanDay, PlanItem } from "@/lib/plan";
import { fmtTime } from "@/lib/plan";
import { fmtDayShort } from "@/lib/dates";
import { itemTone } from "./WeekGrid";

interface Props {
  days: PlanDay[];
  today: string;
  onSelectItem: (item: PlanItem) => void;
}

function rowTitle(it: PlanItem): string {
  if (it.kind === "course") return `${it.courseCode ?? ""} · ${it.title}`.replace(/^ · /, "");
  if (it.kind === "study" || it.kind === "ai") return `${it.kind === "ai" ? "✦ " : ""}${it.title}${it.courseCode ? ` · ${it.courseCode}` : ""}`;
  return it.title;
}

export default function WeekList({ days, today, onSelectItem }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {days.map((d) => {
        const isToday = d.date === today;
        return (
          <div key={d.date}>
            <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? "var(--ink)" : "var(--text-2)", marginBottom: 8 }}>
              {isToday ? `Today · ${fmtDayShort(d.date)}` : fmtDayShort(d.date)}
            </div>
            {d.items.length === 0 ? (
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)", padding: "2px 0 4px" }}>Nothing planned</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {d.items.map((it) => {
                  const tone = itemTone(it);
                  return (
                    <button
                      key={it.id}
                      onClick={() => onSelectItem(it)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%",
                        background: "#FFF8EA", border: "1px solid var(--grid-line)", borderLeft: `4px solid ${tone.border}`,
                        borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {rowTitle(it)}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>
                        {it.durationMin === 0 && it.kind === "course" ? "Due" : fmtTime(it.startMin)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
