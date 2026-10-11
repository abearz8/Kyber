"use client";

import type { Tab } from "@/lib/types";
import { track } from "@/lib/analytics";

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

function BookIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v14.5a1 1 0 0 1-1 1H6.5a1 1 0 0 0 0 2H19a1 1 0 0 1 0 2H6.5A2.5 2.5 0 0 1 4 20.5v-16z" />
      </svg>
    );
  }
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SparkleIcon({ active }: { active: boolean }) {
  // Four-point sparkle(s), matching the native "Now" icon
  const fill = active ? "currentColor" : "none";
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={active ? 0 : 1.9} strokeLinejoin="round">
      <path d="M13 2.5c.3 2.6 1.4 3.7 4 4-2.6.3-3.7 1.4-4 4-.3-2.6-1.4-3.7-4-4 2.6-.3 3.7-1.4 4-4z" />
      <path d="M7 11c.25 2.1 1.15 3 3.2 3.2C8.15 14.45 7.25 15.35 7 17.5c-.25-2.15-1.15-3.05-3.2-3.3C5.85 14 6.75 13.1 7 11z" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 1.5a1 1 0 0 1 1 1V3h8v-.5a1 1 0 1 1 2 0V3h1a2 2 0 0 1 2 2v2H3V5a2 2 0 0 1 2-2h1v-.5a1 1 0 0 1 1-1zM3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zm4 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
      </svg>
    );
  }
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; render: (active: boolean) => React.ReactNode }[] = [
  { id: "courses", label: "Courses", render: (a) => <BookIcon active={a} /> },
  { id: "now", label: "Now", render: (a) => <SparkleIcon active={a} /> },
  { id: "plan", label: "Plan", render: (a) => <CalendarIcon active={a} /> },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(var(--safe-bottom) + 14px)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 6,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRadius: 999,
        boxShadow: "0 8px 28px rgba(70,50,20,0.16), 0 1px 3px rgba(0,0,0,0.06)",
        zIndex: 30,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => {
              onChange(tab.id);
              track.tabViewed(tab.id);
            }}
            className="flex flex-col items-center justify-center"
            style={{
              gap: 3,
              minWidth: 76,
              padding: "8px 14px 7px",
              borderRadius: 999,
              background: isActive ? "var(--cream-deep)" : "transparent",
              color: isActive ? "var(--orange-cta)" : "#55514a",
              border: "none",
              cursor: "pointer",
              transition: "background .18s, color .18s",
            }}
          >
            {tab.render(isActive)}
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, letterSpacing: "0.01em" }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
