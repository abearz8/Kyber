"use client";

import type { Course, PersonalEvent, AiTask, PlanAdjustment, WeekLayout } from "@/lib/types";
import { planItemsForRange, summarizeRange, fmtRangeSummary, type PlanItem } from "@/lib/plan";
import { nextSevenDays } from "@/lib/dates";
import DayStrip from "./DayStrip";
import WeekGrid from "./WeekGrid";
import WeekList from "./WeekList";
import { Card, PrimaryButton, TextLink } from "@/components/shared/ui";

interface Props {
  courses: Course[];
  personalEvents: PersonalEvent[];
  aiTasks: AiTask[];
  studyBlock?: string;
  adjustments?: Record<string, PlanAdjustment>;
  layout: WeekLayout;
  today: string;
  rangeStart: string;
  dayCount: number;
  onSelectDay: (iso: string) => void;
  onDayCountChange: (n: number) => void;
  onSelectItem: (item: PlanItem) => void;
  onAdd: () => void;
  onReschedule: () => void;
  onExport: () => void;
}

const LEGEND = [
  { label: "Class", bg: "var(--purple-bg)", border: "var(--purple)" },
  { label: "Study block", bg: "var(--soft)", border: "var(--amber)" },
  { label: "Something fun", bg: "var(--green-bg)", border: "#9CC5A1" },
  { label: "Free time", bg: "#F7F1E5", border: "#DCCFB6", dashed: true },
];

export default function WeekView({
  courses, personalEvents, aiTasks, studyBlock, adjustments, layout, today, rangeStart, dayCount,
  onSelectDay, onDayCountChange, onSelectItem, onAdd, onReschedule, onExport,
}: Props) {
  const strip = nextSevenDays(today);
  const days = planItemsForRange(courses, personalEvents, rangeStart, dayCount, aiTasks, studyBlock, adjustments);
  const summary = fmtRangeSummary(summarizeRange(days));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DayStrip days={strip} today={today} rangeStart={rangeStart} dayCount={dayCount} onSelect={onSelectDay} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 4px" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Days</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={dayCount}
          onChange={(e) => onDayCountChange(Number(e.target.value))}
          className="kyber-range"
          aria-label="Number of days shown"
          style={{ flex: 1, ["--fill" as string]: `${((dayCount - 1) / 4) * 100}%` }}
        />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", flexShrink: 0, minWidth: 52, textAlign: "right" }}>
          {dayCount} day{dayCount === 1 ? "" : "s"}
        </span>
      </div>

      <Card pad="12px 10px 14px">
        <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: 15.5, fontWeight: 500, color: "var(--text-2)" }}>{summary}</p>
        {layout === "grid"
          ? <WeekGrid days={days} today={today} onSelectItem={onSelectItem} />
          : <div style={{ padding: "0 4px" }}><WeekList days={days} today={today} onSelectItem={onSelectItem} /></div>}
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "0 2px" }}>
        {LEGEND.map((l) => (
          <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
            <span style={{ width: 18, height: 14, borderRadius: 4, background: l.bg, borderLeft: l.dashed ? undefined : `3px solid ${l.border}`, border: l.dashed ? `1px dashed ${l.border}` : undefined, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>

      <PrimaryButton label="Add to your plan" onClick={onAdd} style={{ marginTop: 4 }} />
      <div style={{ textAlign: "center" }}>
        <TextLink label="Reschedule this week" onClick={onReschedule} />
      </div>
      <div style={{ textAlign: "center", marginTop: -4 }}>
        <TextLink label="Export to calendar" onClick={onExport} size={15} color="var(--text-2)" />
      </div>
    </div>
  );
}
