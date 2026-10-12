"use client";

import { useState } from "react";
import type { Course, PlanView, PersonalEvent } from "@/lib/types";
import { isoToday, nextSevenDays, monthGrid, fmtMonthYear } from "@/lib/dates";
import { planItemsForDate, downloadICS, type PlanItem } from "@/lib/plan";
import { allStudyTasks } from "@/lib/studyplan";
import { track } from "@/lib/analytics";
import { useStore } from "@/hooks/useStore";
import AddToPlanSheet from "./AddToPlanSheet";
import PlanItemSheet from "./PlanItemSheet";
import KyberLogo from "@/components/shared/KyberLogo";
import ColorPaletteModal from "@/components/shared/ColorPaletteModal";
import SettingsModal from "@/components/shared/SettingsModal";

interface Props {
  courses: Course[];
  onAdd: () => void;
  onReset: () => void;
}

export default function PlanTab({ courses, onAdd, onReset }: Props) {
  const { state, dispatch } = useStore();
  const view = state.planView;
  const today = isoToday();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [adding, setAdding] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null);

  const completedIds = new Set(state.completedTaskIds);
  const personalEvents = state.personalEvents;
  const aiTasks = state.aiTasks ?? [];

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
    <div className="flex flex-col h-full" style={{ position: "relative", minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", flexShrink: 0 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <KyberLogo size={40} />
          <div className="flex items-center gap-2">
            {/* Export calendar */}
            <button
              onClick={() => downloadICS(courses, personalEvents)}
              aria-label="Export calendar"
              style={{
                width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
                border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55514a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                <polyline points="8 14 12 18 16 14" /><line x1="12" y1="12" x2="12" y2="18" />
              </svg>
            </button>
            {/* Colour palette */}
            <button
              onClick={() => setShowPalette(true)}
              aria-label="Course colours"
              style={{
                width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
                border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55514a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="13.5" r="2.5" />
                <circle cx="8.5" cy="7.5" r="2.5" />
                <circle cx="6.5" cy="14.5" r="2.5" />
                <path d="M12 2a10 10 0 0 0 0 20c1.4 0 2.3-.8 2.3-2 0-.6-.2-1.1-.2-1.6 0-.7.6-1.4 1.4-1.4H17a5 5 0 0 0 5-5c0-5-4.5-9-10-9z" />
              </svg>
            </button>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              style={{
                width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
                border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55514a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week / Month */}
        <div style={{ display: "flex", gap: 4, background: "var(--cream-deep)", borderRadius: 14, padding: 4 }}>
          {(["week", "month"] as PlanView[]).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex-1"
                style={{
                  background: active ? "var(--orange-cta)" : "transparent",
                  color: active ? "#fff" : "var(--text-2)",
                  border: "none", borderRadius: 11, padding: "10px 0",
                  fontSize: 16, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === "week" && (
          <WeekView courses={courses} personalEvents={personalEvents} aiTasks={aiTasks}
            onSelectItem={setSelectedItem} />
        )}
        {view === "month" && (
          <MonthView courses={courses} personalEvents={personalEvents} aiTasks={aiTasks} year={year} month={month} selected={selectedDate}
            onSelect={(d) => setSelectedDate(d)}
            onPrev={() => setMonthOffset((o) => o - 1)} onNext={() => setMonthOffset((o) => o + 1)}
            onExport={() => downloadICS(courses, personalEvents)}
            onSelectItem={setSelectedItem} />
        )}
      </div>

      {/* FAB — always visible unless add sheet is open */}
      {!adding && !showPalette && !showSettings && (
        <button
          onClick={() => setAdding(true)}
          aria-label="Add to plan"
          style={{
            position: "absolute", right: 20, bottom: "calc(110px + var(--safe-bottom))", width: 56, height: 56, borderRadius: 28,
            background: "var(--orange-cta)", border: "none", cursor: "pointer", color: "#fff",
            boxShadow: "0 8px 22px rgba(232,146,30,0.42)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 25,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      )}

      {adding && (
        <AddToPlanSheet
          defaultDate={selectedDate}
          onAdd={(ev) => { dispatch({ type: "ADD_PERSONAL_EVENT", event: ev }); track.planItemOpened(ev.kind); setAdding(false); setSelectedDate(ev.date); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {showPalette && (
        <ColorPaletteModal
          courses={courses}
          onClose={() => setShowPalette(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onAdd={onAdd}
          onReset={onReset}
        />
      )}

      {selectedItem && (
        <PlanItemSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

// ─── Week ───────────────────────────────────────────────────────────────────

function WeekView({ courses, personalEvents, aiTasks, onSelectItem }: {
  courses: Course[]; personalEvents: PersonalEvent[]; aiTasks: import("@/lib/types").AiTask[];
  onSelectItem: (item: PlanItem) => void;
}) {
  const today = isoToday();
  const days = nextSevenDays(today);
  return (
    <div style={{ padding: "6px 16px calc(130px + var(--safe-bottom))" }}>
      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const items = planItemsForDate(courses, personalEvents, day, aiTasks);
          const isToday = day === today;
          const dayLabel = isToday
            ? "Today"
            : new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          return (
            <div key={day}
              style={{
                borderRadius: "var(--radius-card)", overflow: "hidden", background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
                border: isToday ? "1.5px solid var(--orange-cta)" : "1px solid var(--line)",
              }}>
              {/* Day header */}
              <div
                className="flex justify-between items-center"
                style={{
                  padding: "13px 16px",
                  borderBottom: items.length > 0 ? "1px solid var(--line)" : "none",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: isToday ? "var(--orange-cta)" : "var(--ink)", fontFamily: "var(--ios-font)" }}>
                  {dayLabel}
                </span>
                {items.length > 0 && <span style={{ fontSize: 13, color: "var(--text-3)" }}>{items.length} item{items.length > 1 ? "s" : ""}</span>}
              </div>
              {/* Items — each individually tappable */}
              {items.map((it, i) => {
                const isAi = it.kind === "ai";
                return (
                  <div
                    key={it.id}
                    onClick={() => onSelectItem(it)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onSelectItem(it)}
                    className="flex items-center gap-3"
                    style={{
                      padding: "10px 16px", cursor: "pointer",
                      borderTop: i === 0 ? "none" : "1px solid var(--line)",
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: (it.kind === "study" || isAi) ? 1 : "50%", background: it.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {isAi ? `✦ ${it.title}` : it.title}
                    </span>
                    {it.courseCode && <span style={{ fontSize: 12, color: it.color, fontWeight: 700, flexShrink: 0 }}>{it.courseCode}</span>}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month ──────────────────────────────────────────────────────────────────

function MonthView({ courses, personalEvents, aiTasks, year, month, selected, onSelect, onPrev, onNext, onExport, onSelectItem }: {
  courses: Course[]; personalEvents: PersonalEvent[]; aiTasks: import("@/lib/types").AiTask[]; year: number; month: number; selected: string;
  onSelect: (d: string) => void;
  onPrev: () => void; onNext: () => void; onExport: () => void;
  onSelectItem: (item: PlanItem) => void;
}) {
  const today = isoToday();
  const cells = monthGrid(year, month);
  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const dotMap = new Map<string, string[]>();
  const examDates = new Set<string>();

  for (const c of courses) for (const e of c.events) {
    const a = dotMap.get(e.date) ?? []; a.push(c.color); dotMap.set(e.date, a);
    if (e.type === "exam") examDates.add(e.date);
  }
  for (const t of allStudyTasks(courses)) {
    const existing = dotMap.get(t.date) ?? [];
    if (!existing.includes(t.courseColor)) existing.push(t.courseColor);
    dotMap.set(t.date, existing);
  }
  for (const p of personalEvents) {
    const a = dotMap.get(p.date) ?? []; a.push("#8a8a8a"); dotMap.set(p.date, a);
  }
  for (const t of aiTasks) {
    const existing = dotMap.get(t.date) ?? [];
    if (!existing.includes(t.courseColor)) existing.push(t.courseColor);
    dotMap.set(t.date, existing);
  }

  const selectedItems = planItemsForDate(courses, personalEvents, selected, aiTasks);
  const selDate = new Date(selected + "T12:00:00");
  const selLabel = selDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ padding: "6px 16px calc(130px + var(--safe-bottom))" }}>
      {/* Calendar grid */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 14px" }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onPrev} style={navBtn}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg></button>
          <span style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>{fmtMonthYear(year, month)}</span>
          <button onClick={onNext} style={navBtn}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DOW.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-3)", padding: "2px 0" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const dots = dotMap.get(cell) ?? [];
            const isToday = cell === today;
            const isSel = cell === selected;
            const isExam = examDates.has(cell);
            return (
              <button key={cell} onClick={() => onSelect(cell)} style={{
                aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                borderRadius: 10,
                background: isSel ? "var(--orange-cta)" : isToday ? "var(--cream-deep)" : "transparent",
                border: isExam && !isSel ? "1.5px solid #e8474a" : "none",
                cursor: "pointer",
                position: "relative",
              }}>
                {isExam && !isSel && (
                  <span style={{ position: "absolute", top: 2, right: 3, fontSize: 7, color: "#e8474a", lineHeight: 1 }}>▲</span>
                )}
                <span style={{ fontSize: 14, fontWeight: (isExam || isToday) && !isSel ? 700 : 400, color: isSel ? "#fff" : isToday ? "var(--orange-cta)" : isExam ? "#e8474a" : "var(--ink)" }}>{parseInt(cell.split("-")[2])}</span>
                {dots.length > 0 && (
                  <div style={{ display: "flex", gap: 2 }}>
                    {dots.slice(0, 3).map((color, di) => <div key={di} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "#fff" : color }} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day items */}
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{selLabel}</span>
        </div>
        <div style={{ background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          {selectedItems.length === 0 ? (
            <div style={{ padding: "16px 14px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0 }}>Nothing scheduled</p>
            </div>
          ) : (
            selectedItems.map((it, i) => {
              const isAi = it.kind === "ai";
              return (
                <div
                  key={it.id}
                  onClick={() => onSelectItem(it)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelectItem(it)}
                  className="flex items-center gap-3"
                  style={{ padding: "11px 14px", borderTop: i === 0 ? "none" : "1px solid var(--line)", cursor: "pointer" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: (it.kind === "study" || isAi) ? 2 : "50%", background: it.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {isAi ? `✦ ${it.title}` : it.title}
                  </span>
                  {it.courseCode && <span style={{ fontSize: 12, color: it.color, fontWeight: 700, flexShrink: 0 }}>{it.courseCode}</span>}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button onClick={onExport} className="w-full flex items-center justify-center gap-2" style={{ marginTop: 12, background: "var(--surface)", boxShadow: "var(--shadow-card)", border: "none", borderRadius: 14, padding: "14px 0", cursor: "pointer", color: "var(--ink)", fontSize: 15, fontWeight: 600 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange-cta)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        Add to Google Calendar
      </button>
      <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", margin: "8px 0 0" }}>Downloads a kyber-plan.ics file to import.</p>
    </div>
  );
}

const navBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 4 };
