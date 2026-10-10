"use client";

import type { Tab } from "@/lib/types";
import { track } from "@/lib/analytics";

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "courses",
    label: "Courses",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: "now",
    label: "Now",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "plan",
    label: "Plan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      style={{
        height: "var(--tab-height)",
        paddingBottom: "var(--safe-bottom)",
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}
      className="flex items-stretch"
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
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{
              color: isActive ? "#e9a319" : "var(--text-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-display, Manrope, sans-serif)",
            }}
          >
            <span style={{ opacity: isActive ? 1 : 0.7 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
