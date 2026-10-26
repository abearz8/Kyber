"use client";

import { useState } from "react";
import type { Course, Mood } from "@/lib/types";
import { nowAgenda, upNext, greeting, daySummary, type NowItem } from "@/lib/now";
import { isoToday, addDays } from "@/lib/dates";
import { semesterWeek } from "@/lib/events";
import { planItemsForDate, type PlanItem } from "@/lib/plan";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import { useScreenTime } from "@/hooks/useScreenTime";
import SummarySheet from "./SummarySheet";
import PlanItemSheet from "@/components/plan/PlanItemSheet";
import RescheduleSheet from "@/components/plan/RescheduleSheet";
import SettingsModal from "@/components/shared/SettingsModal";
import {
  ScreenHeader, HighlightCard, Card, Label, SectionTitle, PrimaryButton, TextLink, ChevronRight, Checkbox, Toast, SCROLL_BOTTOM,
} from "@/components/shared/ui";

const MOODS: { key: Mood; label: string; reply: string }[] = [
  { key: "light", label: "Light", reply: "Nice — a breathing-room week. Keep the plan ticking and enjoy it." },
  { key: "good", label: "Good", reply: "Great. Your plan looks manageable — keep it steady." },
  { key: "busy", label: "Busy", reply: "Noted. Kyber keeps the plan lighter where possible this week." },
  { key: "overwhelmed", label: "Overwhelmed", reply: "I'll prioritise what actually moves your grade and protect your prep time." },
];

interface Props {
  courses: Course[];
  onAdd: () => void;
  onReset: () => void;
}

export default function NowTab({ courses, onAdd, onReset }: Props) {
  const { state, dispatch } = useStore();
  const completedIds = new Set(state.completedTaskIds);
  const profile = state.userProfile;
  const adjustments = state.planAdjustments;
  const agenda = nowAgenda(courses, profile?.studyBlock, adjustments);
  const rawGreeting = greeting(profile?.studyTimes);
  const [greetBase, greetSuffix] = rawGreeting.split(" — ");
  const summaryText = daySummary(agenda, completedIds);
  const hero = upNext(agenda, completedIds);
  const week = semesterWeek(courses);
  const today = isoToday();
  const yesterday = addDays(today, -1);
  const aiTasks = state.aiTasks ?? [];
  const personalEvents = state.personalEvents;
  const todayItems = planItemsForDate(courses, personalEvents, today, aiTasks, profile?.studyBlock, adjustments);

  const completedAt = state.completedAt ?? {};
  const doneYesterday = Object.values(completedAt).filter((d) => d === yesterday).length;
  const doneToday = Object.values(completedAt).filter((d) => d === today).length;
  const accomplishment =
    doneYesterday > 0
      ? `You finished ${doneYesterday} study block${doneYesterday === 1 ? "" : "s"} yesterday.`
      : doneToday > 0
        ? `You've finished ${doneToday} study block${doneToday === 1 ? "" : "s"} today already.`
        : "Nothing checked off yesterday — today's a fresh start.";

  const [openItem, setOpenItem] = useState<NowItem | null>(null);
  const [selectedPlanItem, setSelectedPlanItem] = useState<PlanItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  // The summary sheet fully replaces the Now view when an item is open.
  useScreenTime(openItem ? `now_summary:${openItem.kind}` : null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function complete(item: NowItem) {
    dispatch({ type: "COMPLETE_TASK", taskId: item.id });
    track.nowTaskCompleted(item.kind);
    showToast("Nice — that's done");
  }

  const courseFor = (code: string) => courses.find((c) => c.code === code);

  if (openItem) {
    return (
      <SummarySheet
        item={openItem}
        course={courseFor(openItem.courseCode)}
        onDone={() => { complete(openItem); setOpenItem(null); }}
        onClose={() => setOpenItem(null)}
      />
    );
  }

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col h-full" style={{ position: "relative", minHeight: 0 }}>
      <ScreenHeader title="Today" subtitle={`${dateLabel} · Week ${week}`} onSettings={() => setShowSettings(true)} />

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: `4px 16px ${SCROLL_BOTTOM}` }}>
        {/* Greeting */}
        <h1 style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.5px", color: "var(--ink)", margin: 0, lineHeight: 1.15 }}>
          {greetBase}.
        </h1>
        <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-2)", margin: "4px 0 0", lineHeight: 1.4 }}>
          {greetSuffix ? `${greetSuffix[0].toUpperCase()}${greetSuffix.slice(1)} · ` : ""}{summaryText}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          {/* Up next hero */}
          {hero ? (
            <HighlightCard pad="14px 16px 16px">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ background: "var(--soft-end)", border: "1px solid var(--warn-border)", borderRadius: 8, padding: "3px 10px" }}>
                  <Label color="var(--ink)">Up next</Label>
                </span>
                <Label>{hero.courseCode}</Label>
              </div>
              <button
                onClick={() => { track.nowTaskOpened(hero.kind); setOpenItem(hero); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}
              >
                <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.3px", color: "var(--ink)", lineHeight: 1.2 }}>{hero.title}</span>
                <ChevronRight size={20} />
              </button>
              <p style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)", margin: "4px 0 14px", lineHeight: 1.4 }}>{hero.note}</p>
              <PrimaryButton
                label={hero.minutes > 0 ? `Start ${hero.minutes}-minute session` : "Start now"}
                onClick={() => { track.nowTaskOpened(hero.kind); setOpenItem(hero); }}
              />
            </HighlightCard>
          ) : (
            <HighlightCard style={{ textAlign: "center", padding: "26px 18px" }}>
              <p style={{ fontWeight: 700, fontSize: 20, color: "var(--ink)", margin: 0 }}>You&apos;re clear for today</p>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--text-2)", margin: "6px 0 0" }}>Everything scheduled for today is done.</p>
            </HighlightCard>
          )}

          {/* Today's list */}
          <SectionTitle right={<TextLink label="View all" onClick={() => { dispatch({ type: "SET_TAB", tab: "plan" }); track.tabViewed("plan"); }} underline={false} color="var(--amber-deep)" />} style={{ marginTop: 6 }}>
            Today&apos;s list
          </SectionTitle>
          {todayItems.length > 0 ? (
            <Card pad="2px 14px">
              {todayItems.map((it, i) => {
                const done = it.studyId ? completedIds.has(it.studyId) : false;
                const isAi = it.kind === "ai";
                const meta = it.kind === "study" || isAi
                  ? `${it.courseCode ?? ""} · ${it.durationMin} min`
                  : `${it.courseCode ? `${it.courseCode} · ` : ""}${it.timeLabel.replace("Due ", "Due ")}`;
                return (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--track)", opacity: done ? 0.55 : 1 }}>
                    {it.studyId ? (
                      <Checkbox
                        checked={done}
                        label={done ? "Mark incomplete" : "Mark complete"}
                        onChange={() => dispatch({ type: done ? "UNCOMPLETE_TASK" : "COMPLETE_TASK", taskId: it.studyId! })}
                      />
                    ) : (
                      <span style={{ width: 26, height: 26, borderRadius: "50%", border: `2.5px solid ${it.color}`, flexShrink: 0, display: "block" }} />
                    )}
                    <button
                      onClick={() => setSelectedPlanItem(it)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", minWidth: 0, flex: 1, textAlign: "left" }}
                    >
                      <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0, textDecoration: done ? "line-through" : "none", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isAi ? `✦ ${it.title}` : it.title}
                      </p>
                      <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-2)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</p>
                    </button>
                    <ChevronRight size={16} color="var(--text-2)" />
                  </div>
                );
              })}
            </Card>
          ) : (
            <Card>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--text-2)" }}>Nothing on the list today.</p>
            </Card>
          )}

          {/* Accomplishments */}
          <SectionTitle style={{ marginTop: 6 }}>Accomplishments</SectionTitle>
          <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 16, padding: "14px 16px" }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>{accomplishment}</p>
          </div>
          <div style={{ textAlign: "center", marginTop: -2 }}>
            <TextLink label="Missed yesterday? Adjust my plan" onClick={() => setRescheduleOpen(true)} />
          </div>

          {/* Week check-in */}
          <Card style={{ marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 17.5, color: "var(--ink)", margin: 0 }}>Week {week} check-in</p>
                <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-2)", margin: "3px 0 0", lineHeight: 1.4 }}>Add this week&apos;s notes to keep your plan smart.</p>
              </div>
              <button
                onClick={() => setCheckInOpen((v) => !v)}
                style={{ background: "var(--amber-light)", border: "1.5px solid var(--warn-border)", borderRadius: 12, padding: "9px 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)", cursor: "pointer", flexShrink: 0 }}
              >
                {checkInOpen ? "Close" : "Check in"}
              </button>
            </div>

            {checkInOpen && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MOODS.map((m) => {
                    const active = state.weekMood === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => { dispatch({ type: "SET_MOOD", mood: m.key }); track.weekMoodSet(m.key); }}
                        style={{
                          background: active ? "var(--amber)" : "var(--cream-deep)",
                          color: "var(--ink)", border: "none", borderRadius: 12, padding: "9px 16px",
                          fontSize: 15.5, fontWeight: active ? 700 : 500, cursor: "pointer",
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                {state.weekMood && (
                  <p style={{ fontSize: 15.5, color: "var(--ink)", margin: "12px 0 0", lineHeight: 1.5, background: "var(--soft)", padding: "12px 14px", borderRadius: 12, fontWeight: 500 }}>
                    {MOODS.find((m) => m.key === state.weekMood)?.reply}
                  </p>
                )}
                <textarea
                  className="ph-no-capture"
                  placeholder="Add this week's notes…"
                  value={state.weekNotes}
                  onChange={(e) => dispatch({ type: "SET_WEEK_NOTES", notes: e.target.value })}
                  rows={2}
                  style={{
                    width: "100%", marginTop: 12, resize: "none", borderRadius: 14, border: "1.5px solid var(--line)",
                    background: "var(--surface)", padding: "12px 14px", fontSize: 16, color: "var(--ink)", outline: "none",
                  }}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast} />}

      {rescheduleOpen && (
        <RescheduleSheet
          source="now"
          onClose={() => setRescheduleOpen(false)}
          onApplied={() => { setRescheduleOpen(false); showToast("Plan updated. Nothing's lost."); }}
        />
      )}

      {showSettings && (
        <SettingsModal courses={courses} onClose={() => setShowSettings(false)} onAdd={onAdd} onReset={onReset} />
      )}

      {selectedPlanItem && (
        <PlanItemSheet item={selectedPlanItem} onClose={() => setSelectedPlanItem(null)} />
      )}
    </div>
  );
}
