"use client";

import { useState } from "react";
import type { Course, Mood } from "@/lib/types";
import { nowAgenda, upNext, greeting, daySummary, type NowItem } from "@/lib/now";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import SummarySheet from "./SummarySheet";

const MOODS: { key: Mood; label: string; reply: string }[] = [
  { key: "light", label: "Light", reply: "Nice — a breathing-room week. Keep the plan ticking and enjoy it." },
  { key: "good", label: "Good", reply: "Great. Your plan looks manageable — keep it steady." },
  { key: "busy", label: "Busy", reply: "Noted. Kyber keeps the plan lighter where possible this week." },
  { key: "overwhelmed", label: "Overwhelmed", reply: "I'll prioritise what actually moves your grade and protect your prep time." },
];

interface Props {
  courses: Course[];
}

export default function NowTab({ courses }: Props) {
  const { state, dispatch } = useStore();
  const completedIds = new Set(state.completedTaskIds);
  const agenda = nowAgenda(courses);
  const hero = upNext(agenda, completedIds);

  const [openItem, setOpenItem] = useState<NowItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function complete(item: NowItem) {
    dispatch({ type: "COMPLETE_TASK", taskId: item.id });
    track.nowTaskCompleted(item.kind, 0);
    showToast("✦ Nice — that's done");
  }

  function toggle(item: NowItem) {
    if (completedIds.has(item.id)) dispatch({ type: "UNCOMPLETE_TASK", taskId: item.id });
    else complete(item);
  }

  const courseFor = (code: string) => courses.find((c) => c.code === code);

  // Summary sheet overlay
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

  const now = new Date();
  const dateLine = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const doneCount = agenda.items.filter((i) => completedIds.has(i.id)).length;

  return (
    <div className="flex flex-col h-full" style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <h1 style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--ink)", margin: 0 }}>
          {greeting()}
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: "2px 0 0" }}>{dateLine}</p>
        <p style={{ fontSize: 12, color: "var(--amber-ink)", fontWeight: 600, margin: "6px 0 0" }}>
          {daySummary(agenda, completedIds)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Up next hero */}
        {hero ? (
          <section>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Up next</div>
            <div style={{ background: "var(--yellow-soft)", border: "1.5px solid #f2d48a", borderRadius: 16, padding: "14px 16px" }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: hero.courseColor }} />
                <span className="eyebrow">{hero.courseCode}{hero.minutes > 0 ? ` · ${hero.minutes} min` : ""}</span>
              </div>
              <p style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 17, color: "var(--ink)", margin: "0 0 2px" }}>
                {hero.title}
              </p>
              <p style={{ fontSize: 12, color: "var(--ink2)", margin: "0 0 12px" }}>{hero.note}</p>
              <button
                onClick={() => { track.nowTaskOpened(hero.kind); setOpenItem(hero); }}
                className="w-full rounded-xl py-2.5"
                style={{ background: "var(--amber)", color: "var(--ink)", fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}
              >
                Start{hero.minutes > 0 ? ` · ${hero.minutes} min` : ""}
              </button>
            </div>
          </section>
        ) : (
          <section>
            <div style={{ textAlign: "center", padding: "24px 16px", background: "var(--yellow-soft)", borderRadius: 16 }}>
              <p style={{ fontSize: 30, margin: "0 0 6px" }}>✦</p>
              <p style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--ink)", margin: 0 }}>
                You&apos;re clear for today
              </p>
              <p style={{ fontSize: 13, color: "var(--ink2)", margin: "4px 0 0" }}>Everything scheduled for today is done.</p>
            </div>
          </section>
        )}

        {/* Today's plan */}
        {agenda.items.length > 0 && (
          <section>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span className="eyebrow">Today&apos;s plan</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{doneCount} of {agenda.items.length}</span>
            </div>
            {/* progress dots */}
            <div className="flex gap-1" style={{ marginBottom: 10 }}>
              {agenda.items.map((i) => (
                <div key={i.id} style={{ flex: 1, height: 4, borderRadius: 4, background: completedIds.has(i.id) ? "var(--amber)" : "var(--track)" }} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {agenda.items.map((item) => {
                const done = completedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="w-full flex items-center gap-3"
                    style={{ background: done ? "var(--cream-deep)" : "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 13px", opacity: done ? 0.65 : 1 }}
                  >
                    <button onClick={() => toggle(item)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                        border: `2px solid ${done ? "var(--amber)" : "var(--text-3)"}`, background: done ? "var(--amber)" : "transparent",
                      }}>
                        {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                      </span>
                    </button>
                    <button onClick={() => { track.nowTaskOpened(item.kind); setOpenItem(item); }} className="flex-1 text-left" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: done ? "var(--text-3)" : "var(--ink)", margin: 0, textDecoration: done ? "line-through" : "none" }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-3)", margin: "1px 0 0" }}>
                        {item.courseCode}{item.minutes > 0 ? ` · ${item.minutes} min` : ""}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Rough day re-plan */}
        <section>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--ink)", margin: 0 }}>Rough day yesterday?</p>
              <p style={{ fontSize: 12, color: "var(--text-2)", margin: "2px 0 0" }}>Kyber re-plans around it — no catch-up pile, ever.</p>
            </div>
            <button
              onClick={() => showToast("✦ Re-planned — nothing lost")}
              style={{ background: "var(--yellow-soft)", border: "1px solid #f2d48a", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--amber-ink)", cursor: "pointer", flexShrink: 0 }}
            >
              I missed yesterday
            </button>
          </div>
        </section>

        {/* Weekly check-in */}
        <section>
          <div className="eyebrow" style={{ marginBottom: 8 }}>How does this week feel?</div>
          <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
            {MOODS.map((m) => {
              const active = state.weekMood === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => dispatch({ type: "SET_MOOD", mood: m.key })}
                  style={{
                    background: active ? "var(--amber)" : "var(--surface-2)",
                    color: active ? "var(--ink)" : "var(--text-2)",
                    border: `1px solid ${active ? "var(--amber)" : "var(--line)"}`,
                    borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {state.weekMood && (
            <p style={{ fontSize: 12, color: "var(--ink2)", margin: "10px 0 0", lineHeight: 1.5, background: "var(--cream-deep)", padding: "10px 12px", borderRadius: 10 }}>
              {MOODS.find((m) => m.key === state.weekMood)?.reply}
            </p>
          )}

          {/* Week notes — masked from analytics */}
          <textarea
            className="ph-no-capture"
            placeholder="Add this week's notes…"
            value={state.weekNotes}
            onChange={(e) => dispatch({ type: "SET_WEEK_NOTES", notes: e.target.value })}
            rows={2}
            style={{
              width: "100%", marginTop: 10, resize: "none", borderRadius: 10, border: "1px solid var(--line)",
              background: "var(--surface)", padding: "10px 12px", fontSize: 13, color: "var(--ink)", fontFamily: "inherit",
            }}
          />
        </section>

        <div style={{ height: 20 }} />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "absolute", left: "50%", bottom: 20, transform: "translateX(-50%)",
          background: "var(--ink)", color: "#fff", padding: "10px 18px", borderRadius: 24,
          fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 10,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
