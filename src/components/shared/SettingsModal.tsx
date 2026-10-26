"use client";

import { useState, type ReactNode } from "react";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import type { Tab, PlanView, WeekLayout, Course } from "@/lib/types";
import ColorPaletteModal from "./ColorPaletteModal";
import { BottomSheet, Card, Label, MiniSegmented, Toggle, OutlineButton, ChevronRight, Toast } from "./ui";

interface Props {
  onClose: () => void;
  onAdd: () => void;
  onReset: () => void;
  courses?: Course[];
}

function Row({ label, sub, children, last, onClick }: { label: string; sub?: string; children?: ReactNode; last?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "13px 16px", borderBottom: last ? "none" : "1px solid var(--track)", cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 17.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{label}</div>
        {sub && <div style={{ fontSize: 15.5, fontWeight: 500, color: "var(--text-2)", marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 18 }}>
      <Label style={{ display: "block", marginBottom: 8 }}>{title}</Label>
      <Card pad={0} style={{ borderRadius: 16 }}>{children}</Card>
    </section>
  );
}

export default function SettingsModal({ onClose, onAdd, onReset, courses = [] }: Props) {
  const { state, dispatch } = useStore();
  const settings = state.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function update<K extends keyof typeof settings>(key: K, value: typeof settings[K]) {
    dispatch({ type: "UPDATE_SETTINGS", settings: { [key]: value } });
    track.appearanceCustomized("settings");
  }

  function soon() {
    setToast("Coming soon");
    setTimeout(() => setToast(null), 1800);
  }

  const paletteName =
    state.userProfile?.themeMode === "school" && state.userProfile.university
      ? state.userProfile.university
      : state.userProfile?.themeMode === "own"
        ? "My own colours"
        : "Kyber theme";

  return (
    <>
      <BottomSheet onClose={onClose} title="Settings" maxHeight="90%">
        <Section title="Preferences">
          <Row label="Open on">
            <MiniSegmented<Tab>
              label="Open on"
              value={settings.defaultTab}
              options={[{ label: "Courses", value: "courses" }, { label: "Now", value: "now" }, { label: "Plan", value: "plan" }]}
              onChange={(v) => update("defaultTab", v)}
            />
          </Row>
          <Row label="Default plan view">
            <MiniSegmented<PlanView>
              label="Default plan view"
              value={settings.defaultPlanView}
              options={[{ label: "Week", value: "week" }, { label: "Month", value: "month" }]}
              onChange={(v) => update("defaultPlanView", v)}
            />
          </Row>
          <Row label="Week layout">
            <MiniSegmented<WeekLayout>
              label="Week layout"
              value={settings.weekLayout}
              options={[{ label: "Grid", value: "grid" }, { label: "List", value: "list" }]}
              onChange={(v) => update("weekLayout", v)}
            />
          </Row>
          <Row label="Week starts on">
            <MiniSegmented<0 | 1>
              label="Week starts on"
              value={settings.weekStartsOn}
              options={[{ label: "Sun", value: 0 }, { label: "Mon", value: 1 }]}
              onChange={(v) => update("weekStartsOn", v)}
            />
          </Row>
          <Row label="Show completed steps" last>
            <Toggle label="Show completed steps" value={settings.showCompletedTasks} onChange={(v) => update("showCompletedTasks", v)} />
          </Row>
        </Section>

        <Section title="Colours">
          <Row label="Course colours" sub={paletteName} onClick={() => setShowPalette(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {courses.slice(0, 3).map((c) => (
                  <span key={c.id} style={{ width: 18, height: 18, borderRadius: "50%", background: c.color, display: "block" }} />
                ))}
              </div>
              <ChevronRight />
            </div>
          </Row>
          <Row label="Colour by type" sub="Exams, assignments and coursework" last onClick={() => update("colourByType", !settings.colourByType)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16.5, fontWeight: 700, color: "var(--ink)" }}>{settings.colourByType ? "On" : "Off"}</span>
              <ChevronRight />
            </div>
          </Row>
        </Section>

        <Section title="Reminders">
          <Row label="Today's plan" sub="Every morning at 8:00 AM">
            <Toggle label="Today's plan reminder" value={settings.remindToday} onChange={(v) => update("remindToday", v)} />
          </Row>
          <Row label="Deadline heads-up" sub="3 days before" last>
            <Toggle label="Deadline heads-up reminder" value={settings.remindDeadlines} onChange={(v) => update("remindDeadlines", v)} />
          </Row>
        </Section>

        <Section title="Courses">
          <Row label="Add syllabi" sub="PDF or Word, one per course">
            <OutlineButton label="Upload" onClick={() => { onClose(); onAdd(); }} />
          </Row>
          <Row label="Start over" sub="Removes all courses and your plan" last>
            {confirmReset ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setConfirmReset(false); onClose(); onReset(); }}
                  style={{ background: "var(--pink)", color: "var(--ink)", border: "none", borderRadius: 12, padding: "8px 12px", fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Yes, clear all
                </button>
                <OutlineButton label="Cancel" textSize={15} onClick={() => setConfirmReset(false)} />
              </div>
            ) : (
              <OutlineButton label="Clear all" onClick={() => setConfirmReset(true)} />
            )}
          </Row>
        </Section>

        <Section title="Account and plan">
          <Row label="Your plan" sub="Free during the beta">
            <OutlineButton label="Manage" onClick={soon} />
          </Row>
          <Row label="Signed in as" sub="Beta tester" last>
            <OutlineButton label="Sign out" onClick={soon} />
          </Row>
        </Section>

        <Section title="About">
          <Row label="App" last>
            <span style={{ fontSize: 16, color: "var(--text-2)", fontWeight: 500 }}>Kyber · Beta</span>
          </Row>
        </Section>
        <p style={{ fontSize: 15, color: "var(--text-3)", textAlign: "center", margin: "20px 0 0", lineHeight: 1.5, fontWeight: 500 }}>
          Your academic companion. Upload your syllabus and let Kyber handle the rest.
        </p>
      </BottomSheet>

      {showPalette && <ColorPaletteModal courses={courses} onClose={() => setShowPalette(false)} />}
      {toast && <Toast message={toast} bottom="24px" />}
    </>
  );
}
