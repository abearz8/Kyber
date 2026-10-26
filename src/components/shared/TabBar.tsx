"use client";

import type { Tab } from "@/lib/types";
import { track } from "@/lib/analytics";
import Icon, { type IconName } from "./Icon";

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "courses", label: "Courses", icon: "tab-courses" },
  { id: "now", label: "Now", icon: "tab-now" },
  { id: "plan", label: "Plan", icon: "tab-plan" },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30,
        display: "flex", alignItems: "stretch", gap: 6,
        padding: "8px 12px calc(10px + var(--safe-bottom))",
        background: "var(--paper)", borderTop: "1px solid var(--line)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => { onChange(tab.id); track.tabViewed(tab.id); }}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              padding: "6px 0 5px", borderRadius: 16, border: "none", cursor: "pointer",
              background: isActive ? "var(--soft-end)" : "transparent",
              color: isActive ? "var(--ink)" : "var(--text-2)",
              transition: "background .18s, color .18s",
            }}
          >
            <Icon name={tab.icon} size={30} />
            <span style={{ fontSize: 15, fontWeight: isActive ? 700 : 500, letterSpacing: "0.01em" }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
