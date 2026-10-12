"use client";

import { useState } from "react";
import type { Course, Mood } from "@/lib/types";
import { nowAgenda, upNext, greeting, daySummary, type NowItem } from "@/lib/now";
import { daysUntil, isoToday } from "@/lib/dates";
import { planItemsForDate, type PlanItem } from "@/lib/plan";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import { useScreenTime } from "@/hooks/useScreenTime";
import SummarySheet from "./SummarySheet";
import PlanItemSheet from "@/components/plan/PlanItemSheet";
import KyberLogo from "@/components/shared/KyberLogo";
import SettingsModal from "@/components/shared/SettingsModal";

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

function weekNumber(courses: Course[]): number {
  const dates = courses.flatMap((c) => c.events.map((e) => e.date)).filter(Boolean).sort();
  if (!dates.length) return 1;
  return Math.max(1, Math.floor(-daysUntil(dates[0]) / 7) + 1);
}

export default function NowTab({ courses, onAdd, onReset }: Props) {
  const { state, dispatch } = useStore();
  const completedIds = new Set(state.completedTaskIds);
  const profile = state.userProfile;
  const agenda = nowAgenda(courses, profile?.studyBlock);
  const greetingText = greeting(profile?.studyTimes);
  const summaryText = daySummary(agenda, completedIds);
  const hero = upNext(agenda, completedIds);
  const week = weekNumber(courses);
  const today = isoToday();
  const aiTasks = state.aiTasks ?? [];
  const personalEvents = state.personalEvents;
  const todayItems = planItemsForDate(courses, personalEvents, today, aiTasks);

  const [openItem, setOpenItem] = useState<NowItem | null>(null);
  const [selectedPlanItem, setSelectedPlanItem] = useState<PlanItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // The summary sheet fully replaces the Now view when an item is open.
  useScreenTime(openItem ? `now_summary:${openItem.kind}` : null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function complete(item: NowItem) {
    dispatch({ type: "COMPLETE_TASK", taskId: item.id });
    track.nowTaskCompleted(item.kind);
    showToast("✦ Nice — that's done");
  }

  function toggle(item: NowItem) {
    if (completedIds.has(item.id)) dispatch({ type: "UNCOMPLETE_TASK", taskId: item.id });
    else complete(item);
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

  return (
    <div className="flex flex-col h-full" style={{ position: "relative", minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 6px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <KyberLogo size={40} />
          <div>
            <p style={{ margin: 0, fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 22, color: "var(--orange-cta)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>Now</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
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

      {/* Greeting */}
      <div style={{ padding: "12px 16px 12px", flexShrink: 0 }}>
        <p style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
          {greetingText}
        </p>
        <p style={{ fontSize: 14, color: "var(--text-2)", margin: "4px 0 0" }}>{summaryText}</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "8px 16px calc(120px + var(--safe-bottom))" }}>
       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Up next hero */}
        {hero ? (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "18px" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Up next</div>
            <p style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.01em", color: "var(--ink)", margin: "0 0 6px", lineHeight: 1.2 }}>
              {hero.title}
            </p>
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 4px" }}>
              {hero.courseCode}{hero.minutes > 0 ? ` · ${hero.minutes} min` : ""}
            </p>
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 16px", lineHeight: 1.45 }}>{hero.note}</p>
            <button
              onClick={() => { track.nowTaskOpened(hero.kind); setOpenItem(hero); }}
              className="w-full"
              style={{ background: "var(--orange-cta)", color: "#fff", fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 17, border: "none", borderRadius: 14, padding: "15px 0", cursor: "pointer" }}
            >
              Start{hero.minutes > 0 ? ` · ${hero.minutes} min` : ""}
            </button>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "28px 18px", textAlign: "center" }}>
            <p style={{ fontSize: 30, margin: "0 0 6px" }}>✦</p>
            <p style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 20, color: "var(--ink)", margin: 0 }}>You&apos;re clear for today</p>
            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "6px 0 0" }}>Everything scheduled for today is done.</p>
          </div>
        )}

        {/* Today's plan — all items for today */}
        {todayItems.length > 0 && (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "18px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <span className="eyebrow">Today&apos;s plan</span>
              <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}>
                {todayItems.filter((it) => it.studyId && completedIds.has(it.studyId)).length} of {todayItems.length}
              </span>
            </div>
            <div className="flex flex-col">
              {todayItems.map((it, i) => {
                const done = it.studyId ? completedIds.has(it.studyId) : false;
                const isAi = it.kind === "ai";
                return (
                  <div
                    key={it.id}
                    className="flex items-center gap-3"
                    style={{ padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)", opacity: done ? 0.55 : 1 }}
                  >
                    {/* Checkbox for study items, dot for others */}
                    {it.studyId ? (
                      <button
                        onClick={() => dispatch({ type: done ? "UNCOMPLETE_TASK" : "COMPLETE_TASK", taskId: it.studyId! })}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
                        aria-label={done ? "Mark incomplete" : "Mark complete"}
                      >
                        <span style={{
                          width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          border: `2px solid ${done ? "var(--orange-cta)" : "#cbc2b2"}`, background: done ? "var(--orange-cta)" : "transparent",
                        }}>
                          {done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                      </button>
                    ) : (
                      <span style={{ width: 9, height: 9, borderRadius: isAi ? 2 : "50%", background: it.color, flexShrink: 0 }} />
                    )}
                    {/* Title — tapping opens detail sheet */}
                    <button
                      onClick={() => setSelectedPlanItem(it)}
                      className="flex-1 text-left"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", minWidth: 0 }}
                    >
                      <p style={{ fontSize: 16, fontWeight: 600, color: done ? "var(--text-3)" : "var(--ink)", margin: 0, textDecoration: done ? "line-through" : "none", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isAi ? `✦ ${it.title}` : it.title}
                      </p>
                      {it.courseCode && (
                        <p className="flex items-center gap-1.5" style={{ fontSize: 13, color: "var(--text-2)", margin: "2px 0 0" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: it.color, flexShrink: 0 }} />
                          {it.courseCode}
                        </p>
                      )}
                    </button>
                    <span style={{ fontSize: 13, color: "var(--text-2)", flexShrink: 0 }}>{it.timeLabel.replace("Due ", "")}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rough day */}
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 17, color: "var(--ink)", margin: 0 }}>Rough day yesterday?</p>
            <p style={{ fontSize: 14, color: "var(--text-2)", margin: "3px 0 0", lineHeight: 1.4 }}>See how Kyber adjusts. No lectures, ever.</p>
          </div>
          <button
            onClick={() => { track.replanTapped(); showToast("✦ Re-planned — nothing lost"); }}
            style={{ background: "var(--orange-cta)", border: "none", borderRadius: 12, padding: "11px 14px", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", flexShrink: 0 }}
          >
            I missed yesterday
          </button>
        </div>

        {/* Week check-in */}
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 18px" }}>
          <div className="flex items-center justify-between gap-12">
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 17, color: "var(--ink)", margin: 0 }}>Week {week} check-in</p>
              <p style={{ fontSize: 14, color: "var(--text-2)", margin: "3px 0 0", lineHeight: 1.4 }}>Add this week&apos;s notes to keep your plan smart.</p>
            </div>
            <button
              onClick={() => setCheckInOpen((v) => !v)}
              style={{ background: "var(--orange-cta)", border: "none", borderRadius: 12, padding: "11px 18px", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", flexShrink: 0 }}
            >
              {checkInOpen ? "Close" : "Check in"}
            </button>
          </div>

          {checkInOpen && (
            <div style={{ marginTop: 16 }}>
              <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                {MOODS.map((m) => {
                  const active = state.weekMood === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => { dispatch({ type: "SET_MOOD", mood: m.key }); track.weekMoodSet(m.key); }}
                      style={{
                        background: active ? "var(--orange-cta)" : "var(--cream-deep)",
                        color: active ? "#fff" : "var(--text-2)",
                        border: "none", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              {state.weekMood && (
                <p style={{ fontSize: 14, color: "var(--ink2)", margin: "12px 0 0", lineHeight: 1.5, background: "var(--cream-deep)", padding: "12px 14px", borderRadius: 12 }}>
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
                  width: "100%", marginTop: 12, resize: "none", borderRadius: 12, border: "1px solid var(--line)",
                  background: "var(--cream-deep)", padding: "12px 14px", fontSize: 15, color: "var(--ink)", fontFamily: "inherit",
                }}
              />
            </div>
          )}
        </div>
       </div>
      </div>

      {toast && (
        <div style={{
          position: "absolute", left: "50%", bottom: "calc(96px + var(--safe-bottom))", transform: "translateX(-50%)",
          background: "var(--ink)", color: "#fff", padding: "10px 18px", borderRadius: 24,
          fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 20,
        }}>
          {toast}
        </div>
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onAdd={onAdd}
          onReset={onReset}
        />
      )}

      {selectedPlanItem && (
        <PlanItemSheet item={selectedPlanItem} onClose={() => setSelectedPlanItem(null)} />
      )}
    </div>
  );
}
