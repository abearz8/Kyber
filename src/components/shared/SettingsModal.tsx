"use client";

import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import type { Tab, PlanView } from "@/lib/types";

interface Props {
  onClose: () => void;
  onAdd: () => void;
  onReset: () => void;
}

function Row({ label, children, divider = true }: { label: string; children: React.ReactNode; divider?: boolean }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "11px 16px", borderBottom: divider ? "1px solid var(--line)" : "none", gap: 12 }}
    >
      <span style={{ fontSize: 15, color: "var(--ink)" }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 999,
        background: value ? "var(--orange-cta)" : "var(--line)",
        border: "none", cursor: "pointer", position: "relative", transition: "background .2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.18)",
      }} />
    </button>
  );
}

function SegmentPicker<T extends string | number>({
  value, options, onChange,
}: { value: T; options: { label: string; value: T }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 2, background: "var(--cream-deep)", borderRadius: 999, padding: 3 }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            background: value === o.value ? "var(--surface)" : "transparent",
            color: value === o.value ? "var(--ink)" : "var(--text-2)",
            boxShadow: value === o.value ? "var(--shadow-card)" : "none",
            border: "none", borderRadius: 999, padding: "5px 10px",
            fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsModal({ onClose, onAdd, onReset }: Props) {
  const { state, dispatch } = useStore();
  const settings = state.settings;
  const [confirmReset, setConfirmReset] = useState(false);

  function update<K extends keyof typeof settings>(key: K, value: typeof settings[K]) {
    dispatch({ type: "UPDATE_SETTINGS", settings: { [key]: value } });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 51,
          background: "var(--bg)", borderRadius: "20px 20px 0 0",
          padding: "0 0 40px",
          maxHeight: "82%",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)" }} />
        </div>

        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: "var(--ios-font)", fontWeight: 800, fontSize: 22, color: "var(--ink)", margin: 0 }}>
              Settings
            </h2>
            <button
              onClick={onClose}
              style={{ background: "var(--cream-deep)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "8px 20px" }}>

          {/* Preferences section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "12px 0 4px" }}>
            Preferences
          </div>
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: "0", boxShadow: "var(--shadow-card)" }}>
            <Row label="Open app on">
              <SegmentPicker<Tab>
                value={settings.defaultTab}
                options={[
                  { label: "Courses", value: "courses" },
                  { label: "Now", value: "now" },
                  { label: "Plan", value: "plan" },
                ]}
                onChange={(v) => update("defaultTab", v)}
              />
            </Row>
            <Row label="Default plan view">
              <SegmentPicker<PlanView>
                value={settings.defaultPlanView}
                options={[
                  { label: "Week", value: "week" },
                  { label: "Month", value: "month" },
                ]}
                onChange={(v) => update("defaultPlanView", v)}
              />
            </Row>
            <Row label="Week starts on">
              <SegmentPicker<0 | 1>
                value={settings.weekStartsOn}
                options={[
                  { label: "Sun", value: 0 },
                  { label: "Mon", value: 1 },
                ]}
                onChange={(v) => update("weekStartsOn", v)}
              />
            </Row>
            <Row label="Show completed tasks" divider={false}>
              <Toggle
                value={settings.showCompletedTasks}
                onChange={(v) => update("showCompletedTasks", v)}
              />
            </Row>
          </div>

          {/* Courses section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "16px 0 4px" }}>
            Courses
          </div>
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: "0", boxShadow: "var(--shadow-card)" }}>
            <Row label="Add syllabi">
              <button
                onClick={() => { onClose(); onAdd(); }}
                style={{ background: "var(--orange-cta)", color: "#fff", border: "none", borderRadius: 999, padding: "7px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Upload
              </button>
            </Row>
            <Row label="Start over" divider={false}>
              {confirmReset ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => { setConfirmReset(false); onClose(); onReset(); }}
                    style={{ background: "#fee2e2", color: "#d1544b", border: "none", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Yes, clear all
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    style={{ background: "var(--cream-deep)", color: "var(--text-2)", border: "none", borderRadius: 999, padding: "7px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{ background: "#fee2e2", color: "#d1544b", border: "none", borderRadius: 999, padding: "7px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Clear all
                </button>
              )}
            </Row>
          </div>

          {/* About */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "16px 0 4px" }}>
            About
          </div>
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: "0", boxShadow: "var(--shadow-card)" }}>
            <Row label="App" divider={false}>
              <span style={{ fontSize: 14, color: "var(--text-2)" }}>Kyber · Beta</span>
            </Row>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", margin: "20px 0 0", lineHeight: 1.5 }}>
            Your academic companion. Upload your syllabus and let Kyber handle the rest.
          </p>
        </div>
      </div>
    </>
  );
}
