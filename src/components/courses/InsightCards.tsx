"use client";

import { buildInsights, type InsightCard } from "@/lib/grades";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";

const KIND_ICON: Record<InsightCard["kind"], string> = {
  strategy: "🎯",
  weighting: "⚖️",
  method: "📚",
  focus: "🔑",
};

interface Props {
  course: Course;
}

export default function InsightCards({ course }: Props) {
  const insights = buildInsights(course);
  if (!insights.length) return null;

  return (
    <div>
      <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text)", margin: "0 0 10px" }}>
        Insights
      </h3>
      <div className="flex flex-col gap-2.5">
        {insights.map((card) => (
          <button
            key={card.id}
            className="w-full text-left rounded-2xl p-4 transition-all"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={() => track.insightOpened(course.code, card.kind)}
          >
            <div className="flex gap-3">
              <span style={{ fontSize: 18, flexShrink: 0 }}>{KIND_ICON[card.kind]}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", margin: "0 0 4px" }}>
                  {card.title}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
                  {card.body}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
