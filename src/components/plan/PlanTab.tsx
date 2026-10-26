"use client";

import { useState } from "react";
import type { Course, PlanView, PersonalEvent, AiTask, CourseEvent } from "@/lib/types";
import { isoToday, monthGrid, fmtMonthYear, addDays, fmtRange } from "@/lib/dates";
import { semesterWeek } from "@/lib/events";
import { planItemsForDate, downloadICS, fmtTime, type PlanItem } from "@/lib/plan";
import { allStudyTasks } from "@/lib/studyplan";
import { track } from "@/lib/analytics";
import { useStore } from "@/hooks/useStore";
import AddToPlanSheet from "./AddToPlanSheet";
import PlanItemSheet from "./PlanItemSheet";
import RescheduleSheet from "./RescheduleSheet";
import WeekView from "./WeekView";
import { itemTone } from "./WeekGrid";
import SettingsModal from "@/components/shared/SettingsModal";
import { ScreenHeader, Segmented, OutlineButton, Card, Toast, SCROLL_BOTTOM, ChevronLeft, ChevronRight } from "@/components/shared/ui";

interface Props {
  courses: Course[];
  onAdd: () => void;
  onReset: () => void;
}

export default function PlanTab({ courses, onAdd, onReset }: Props) {
  const { state, dispatch } = useStore();
  const view = state.planView;
  const today = isoToday();
  const [rangeStart, setRangeStart] = useState<string>(today);
  const [dayCount, setDayCount] = useState(3);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [adding, setAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const personalEvents = state.personalEvents;
  const aiTasks = state.aiTasks ?? [];
  const studyBlock = state.userProfile?.studyBlock;
  const adjustments = state.planAdjustments;
  const week = semesterWeek(courses);

  function setView(v: PlanView) {
    dispatch({ type: "SET_PLAN_VIEW", view: v });
    track.planViewed(v);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function goToday() {
    setRangeStart(today);
    setSelectedDate(today);
    setMonthOffset(0);
  }

  function exportCalendar() {
    track.calendarExported("plan");
    downloadICS(courses, personalEvents);
  }

  function addCourseEvent(courseId: string, event: CourseEvent) {
    const course = courses.find((c) => c.id === courseId);
    dispatch({ type: "ADD_COURSE_EVENT", courseId, event });
    track.deadlineAddedManually(course?.code ?? courseId, event.type);
    setAdding(false);
    setSelectedDate(event.date);
    showToast("Deadline added. Kyber will plan around it.");
  }

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;

  const subtitle = view === "week"
    ? `Week ${week} · ${fmtRange(today, addDays(today, 6))}`
    : `Week ${week} · ${fmtMonthYear(year, month)}`;

  const isAtToday = view === "week" ? rangeStart === today : monthOffset === 0 && selectedDate === today;

  return (
    <div className="flex flex-col h-full" style={{ position: "relative", minHeight: 0 }}>
      <ScreenHeader
        title="Your plan"
        subtitle={subtitle}
        onSettings={() => setShowSettings(true)}
        right={!isAtToday ? <OutlineButton label="Today" height={38} textSize={16} onClick={goToday} /> : undefined}
      />

      <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
        <Segmented<PlanView>
          value={view}
          onChange={setView}
          options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]}
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: `2px 16px ${SCROLL_BOTTOM}` }}>
        {view === "week" ? (
          <WeekView
            courses={courses}
            personalEvents={personalEvents}
            aiTasks={aiTasks}
            studyBlock={studyBlock}
            adjustments={adjustments}
            layout={state.settings.weekLayout ?? "grid"}
            today={today}
            rangeStart={rangeStart}
            dayCount={dayCount}
            onSelectDay={(d) => { setRangeStart(d); setSelectedDate(d); }}
            onDayCountChange={(n) => { setDayCount(n); track.planRangeChanged(n); }}
            onSelectItem={setSelectedItem}
            onAdd={() => setAdding(true)}
            onReschedule={() => setRescheduleOpen(true)}
            onExport={exportCalendar}
          />
        ) : (
          <MonthView
            courses={courses} personalEvents={personalEvents} aiTasks={aiTasks} year={year} month={month} selected={selectedDate}
            onSelect={(d) => setSelectedDate(d)}
            onPrev={() => setMonthOffset((o) => o - 1)} onNext={() => setMonthOffset((o) => o + 1)}
            onExport={exportCalendar}
            onSelectItem={setSelectedItem} studyBlock={studyBlock} adjustments={adjustments}
            onAdd={() => setAdding(true)}
          />
        )}
      </div>

      {adding && (
        <AddToPlanSheet
          defaultDate={selectedDate}
          courses={courses}
          onAddCourseEvent={addCourseEvent}
          onAdd={(ev) => { dispatch({ type: "ADD_PERSONAL_EVENT", event: ev }); track.planItemOpened(ev.kind); setAdding(false); setSelectedDate(ev.date); if (view === "week") setRangeStart(ev.date <= today ? today : ev.date); }}
          onAddSyllabus={() => { setAdding(false); onAdd(); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {rescheduleOpen && (
        <RescheduleSheet
          source="plan"
          onClose={() => setRescheduleOpen(false)}
          onApplied={() => { setRescheduleOpen(false); showToast("Plan updated. Nothing's lost."); }}
        />
      )}

      {showSettings && (
        <SettingsModal courses={courses} onClose={() => setShowSettings(false)} onAdd={onAdd} onReset={onReset} />
      )}

      {selectedItem && (
        <PlanItemSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ─── Month ──────────────────────────────────────────────────────────────────

function MonthView({ courses, personalEvents, aiTasks, year, month, selected, onSelect, onPrev, onNext, onExport, onSelectItem, studyBlock, adjustments, onAdd }: {
  courses: Course[]; personalEvents: PersonalEvent[]; aiTasks: AiTask[]; year: number; month: number; selected: string;
  onSelect: (d: string) => void;
  onPrev: () => void; onNext: () => void; onExport: () => void;
  onSelectItem: (item: PlanItem) => void; studyBlock?: string; adjustments?: Record<string, import("@/lib/types").PlanAdjustment>;
  onAdd: () => void;
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
  for (const t of allStudyTasks(courses, studyBlock, adjustments)) {
    const existing = dotMap.get(t.date) ?? [];
    if (!existing.includes(t.courseColor)) existing.push(t.courseColor);
    dotMap.set(t.date, existing);
  }
  for (const p of personalEvents) {
    const a = dotMap.get(p.date) ?? []; a.push("#8B8475"); dotMap.set(p.date, a);
  }
  for (const t of aiTasks) {
    const existing = dotMap.get(t.date) ?? [];
    if (!existing.includes(t.courseColor)) existing.push(t.courseColor);
    dotMap.set(t.date, existing);
  }

  const selectedItems = planItemsForDate(courses, personalEvents, selected, aiTasks, studyBlock, adjustments);
  const selDate = new Date(selected + "T12:00:00");
  const selLabel = selDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card pad="14px 12px">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={onPrev} aria-label="Previous month" style={navBtn}><ChevronLeft /></button>
          <span style={{ fontWeight: 700, fontSize: 17.5, color: "var(--ink)" }}>{fmtMonthYear(year, month)}</span>
          <button onClick={onNext} aria-label="Next month" style={navBtn}><ChevronRight /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DOW.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--text-3)", padding: "2px 0" }}>{d}</div>)}
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
                background: isSel ? "var(--amber)" : isToday ? "var(--soft)" : "transparent",
                border: isExam && !isSel ? "1.5px solid var(--pink)" : "1.5px solid transparent",
                cursor: "pointer", position: "relative",
              }}>
                <span style={{ fontSize: 15, fontWeight: isSel || isToday || isExam ? 700 : 500, color: "var(--ink)" }}>{parseInt(cell.split("-")[2])}</span>
                {dots.length > 0 && (
                  <div style={{ display: "flex", gap: 2 }}>
                    {dots.slice(0, 3).map((color, di) => <div key={di} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "var(--ink)" : color }} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected day items */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{selected === today ? `Today · ${selLabel}` : selLabel}</div>
        {selectedItems.length === 0 ? (
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)", padding: "2px 0 4px" }}>Nothing planned</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedItems.map((it) => {
              const tone = itemTone(it);
              const isAi = it.kind === "ai";
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
                    {isAi ? "✦ " : ""}{it.courseCode ? `${it.courseCode} · ` : ""}{it.title}
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

      <OutlineButton label="Add to your plan" height={52} onClick={onAdd} style={{ width: "100%" }} />
      <button onClick={onExport} style={{ background: "var(--surface)", border: "1px solid var(--card-border)", boxShadow: "var(--shadow-card)", borderRadius: 14, padding: "14px 0", cursor: "pointer", color: "var(--ink)", fontSize: 16.5, fontWeight: 600, width: "100%" }}>
        Add to Google Calendar
      </button>
      <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center", margin: "-4px 0 0", fontWeight: 500 }}>Downloads a kyber-plan.ics file to import.</p>
    </div>
  );
}

const navBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--ink)", padding: 4, display: "flex" };
