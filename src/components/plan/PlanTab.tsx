"use client";

import { useState } from "react";
import type { Course, PlanView } from "@/lib/types";
import { isoToday, addDays, weekDays, monthGrid, fmtMonthYear, fmtFull, fmtShort } from "@/lib/dates";
import { planItemsForDate, downloadICS, type PlanItem } from "@/lib/plan";
import { track } from "@/lib/analytics";
import { useStore } from "@/hooks/useStore";
import AddToPlanSheet from "./AddToPlanSheet";

interface Props {
  courses: Course[];
}

export default function PlanTab({ courses }: Props) {
  const { state, dispatch } = useStore();
  const view = state.planView;
  const today = isoToday();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [adding, setAdding] = useState(false);

  const completedIds = new Set(state.completedTaskIds);
  const personalEvents = state.personalEvents;

  function setView(v: PlanView) {
    dispatch({ type: "SET_PLAN_VIEW", view: v });
    track.planViewed(v);
  }

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  const toggleStudy = (id: string) =>
    dispatch({ type: completedIds.has(id) ? "UNCOMPLETE_TASK" : "COMPLETE_TASK", taskId: id });

  return (
    <div className="flex flex-col h-full" style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 10px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--ink)", margin: 0 }}>Plan</h1>
            <p style={{ fontSize: 11, color: "var(--text-3)", margin: "1px 0 0" }}>Your week, without the stress</p>
          </div>
          <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 8, padding: 2, gap: 2 }}>
            {(["day", "week", "month"] as PlanView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? "var(--paper)" : "transparent",
                  border: view === v ? "1px solid var(--line)" : "1px solid transparent",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: view === v ? 700 : 500,
                  color: view === v ? "var(--ink)" : "var(--text-3)", cursor: "pointer", textTransform: "capitalize",
                  fontFamily: "Quicksand, sans-serif",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === "day" && (
          <DayView courses={courses} personalEvents={personalEvents} date={selectedDate} completedIds={completedIds}
            onChangeDate={setSelectedDate} onToggleStudy={toggleStudy}
            onDeletePersonal={(id) => dispatch({ type: "DELETE_PERSONAL_EVENT", id })} />
        )}
        {view === "week" && (
          <WeekView courses={courses} personalEvents={personalEvents} anchor={selectedDate}
            onSelectDay={(d) => { setSelectedDate(d); setView("day"); }} />
        )}
        {view === "month" && (
          <MonthView courses={courses} personalEvents={personalEvents} year={year} month={month} selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setView("day"); }}
            onPrev={() => setMonthOffset((o) => o - 1)} onNext={() => setMonthOffset((o) => o + 1)}
            onExport={() => downloadICS(courses, personalEvents)} />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAdding(true)}
        aria-label="Add to plan"
        style={{
          position: "absolute", right: 18, bottom: 18, width: 52, height: 52, borderRadius: 26,
          background: "var(--amber)", border: "none", cursor: "pointer", color: "var(--ink)",
          boxShadow: "0 6px 18px rgba(233,163,25,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 15,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {adding && (
        <AddToPlanSheet
          defaultDate={selectedDate}
          onAdd={(ev) => { dispatch({ type: "ADD_PERSONAL_EVENT", event: ev }); track.planItemOpened(ev.kind); setAdding(false); setSelectedDate(ev.date); }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

// ─── Day ────────────────────────────────────────────────────────────────────

function DayView({
  courses, personalEvents, date, completedIds, onChangeDate, onToggleStudy, onDeletePersonal,
}: {
  courses: Course[]; personalEvents: import("@/lib/types").PersonalEvent[]; date: string;
  completedIds: Set<string>; onChangeDate: (d: string) => void; onToggleStudy: (id: string) => void; onDeletePersonal: (id: string) => void;
}) {
  const items = planItemsForDate(courses, personalEvents, date);
  const isToday = date === isoToday();

  return (
    <div style={{ padding: "12px 16px 90px" }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onChangeDate(addDays(date, -1))} style={navBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg></button>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--ink)", margin: 0 }}>{fmtFull(date)}</p>
          {isToday && <span style={{ fontSize: 11, color: "var(--amber-ink)", fontWeight: 700 }}>Today</span>}
        </div>
        <button onClick={() => onChangeDate(addDays(date, 1))} style={navBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg></button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-3)" }}>
          <p style={{ fontSize: 30, marginBottom: 6 }}>✦</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Nothing planned — enjoy it</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((it) => <DayRow key={it.id} item={it} done={it.studyId ? completedIds.has(it.studyId) : false} onToggleStudy={onToggleStudy} onDeletePersonal={onDeletePersonal} />)}
        </div>
      )}
    </div>
  );
}

function DayRow({ item, done, onToggleStudy, onDeletePersonal }: { item: PlanItem; done: boolean; onToggleStudy: (id: string) => void; onDeletePersonal: (id: string) => void; }) {
  const dashed = item.kind === "study";
  return (
    <div className="flex gap-3 items-start" style={{
      background: item.kind === "personal" ? "var(--cream-deep)" : `${item.color}12`,
      border: dashed ? "1px dashed #e9a319" : "1px solid var(--line)",
      borderRadius: 14, padding: "11px 13px",
    }}>
      <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: item.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 1 }}>
          <span className="eyebrow">{item.subtitle}</span>
          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{item.timeLabel}</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: done ? "var(--text-3)" : "var(--ink)", margin: 0, textDecoration: done ? "line-through" : "none" }}>{item.title}</p>
      </div>
      {item.studyId && (
        <button onClick={() => onToggleStudy(item.studyId!)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${done ? "var(--amber)" : "var(--text-3)"}`, background: done ? "var(--amber)" : "transparent" }}>
            {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>}
          </span>
        </button>
      )}
      {item.personalId && (
        <button onClick={() => onDeletePersonal(item.personalId!)} aria-label="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

// ─── Week ───────────────────────────────────────────────────────────────────

function WeekView({ courses, personalEvents, anchor, onSelectDay }: { courses: Course[]; personalEvents: import("@/lib/types").PersonalEvent[]; anchor: string; onSelectDay: (d: string) => void; }) {
  const today = isoToday();
  const days = weekDays(anchor);
  return (
    <div style={{ padding: "12px 16px 90px" }}>
      <p style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--ink)", margin: "0 0 12px" }}>
        {fmtShort(days[0])} – {fmtShort(days[6])}
      </p>
      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const items = planItemsForDate(courses, personalEvents, day);
          const isToday = day === today;
          return (
            <button key={day} onClick={() => onSelectDay(day)} className="w-full text-left rounded-2xl overflow-hidden"
              style={{ border: isToday ? "1.5px solid var(--amber)" : "1px solid var(--line)", background: "var(--surface)" }}>
              <div style={{ padding: "8px 12px 6px", background: isToday ? "var(--yellow-soft)" : "transparent", borderBottom: items.length ? "1px solid var(--line)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 600, color: isToday ? "var(--amber-ink)" : "var(--ink)", fontFamily: "Quicksand, sans-serif" }}>
                  {new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                {items.length > 0 && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{items.length} item{items.length > 1 ? "s" : ""}</span>}
              </div>
              {items.length > 0 && (
                <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {items.map((it) => (
                    <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: it.kind === "study" ? 1 : "50%", background: it.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto", flexShrink: 0 }}>{it.timeLabel.replace("Due ", "")}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month ──────────────────────────────────────────────────────────────────

function MonthView({ courses, personalEvents, year, month, selected, onSelect, onPrev, onNext, onExport }: {
  courses: Course[]; personalEvents: import("@/lib/types").PersonalEvent[]; year: number; month: number; selected: string;
  onSelect: (d: string) => void; onPrev: () => void; onNext: () => void; onExport: () => void;
}) {
  const today = isoToday();
  const cells = monthGrid(year, month);
  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const dotMap = new Map<string, string[]>();
  for (const c of courses) for (const e of c.events) {
    const a = dotMap.get(e.date) ?? []; a.push(c.color); dotMap.set(e.date, a);
  }
  for (const p of personalEvents) {
    const a = dotMap.get(p.date) ?? []; a.push("#8a8a8a"); dotMap.set(p.date, a);
  }

  return (
    <div style={{ padding: "12px 16px 90px" }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} style={navBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg></button>
        <span style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{fmtMonthYear(year, month)}</span>
        <button onClick={onNext} style={navBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DOW.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-3)", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const dots = dotMap.get(cell) ?? [];
          const isToday = cell === today;
          const isSel = cell === selected;
          return (
            <button key={cell} onClick={() => onSelect(cell)} style={{
              aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              borderRadius: 8, background: isSel ? "var(--amber)" : isToday ? "var(--yellow-soft)" : "transparent", border: "none", cursor: "pointer",
            }}>
              <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isSel ? "#fff" : isToday ? "var(--amber-ink)" : "var(--ink)" }}>{parseInt(cell.split("-")[2])}</span>
              {dots.length > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {dots.slice(0, 3).map((color, di) => <div key={di} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "#fff" : color }} />)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button onClick={onExport} className="w-full flex items-center justify-center gap-2" style={{ marginTop: 18, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 0", cursor: "pointer", color: "var(--ink)", fontSize: 13, fontWeight: 600, fontFamily: "Quicksand, sans-serif" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-ink)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        Add to Google Calendar
      </button>
      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", margin: "6px 0 0" }}>Downloads a kyber-plan.ics file to import.</p>
    </div>
  );
}

const navBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4 };
