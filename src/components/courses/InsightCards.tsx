"use client";

import { buildInsights, type InsightCard } from "@/lib/grades";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";

const KIND_LABEL: Record<InsightCard["kind"], string> = {
  strategy: "Grade strategy",
  weighting: "Grade weighting",
  method: "Study method",
  focus: "Where to focus",
};

interface Props {
  course: Course;
}

export default function InsightCards({ course }: Props) {
  const insights = buildInsights(course);
  if (!insights.length) return null;

  return (
    <section>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Insights</div>
      <div className="flex flex-col gap-3">
        {insights.map((card) => (
          <div
            key={card.id}
            className="w-full text-left"
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              padding: "16px 18px",
              boxShadow: "var(--shadow-card)",
            }}
            onClick={() => track.insightOpened(course.code, card.kind)}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              {KIND_LABEL[card.kind]}
            </div>
            <p style={{ fontFamily: "var(--ios-font)", fontWeight: 700, fontSize: 18, color: "var(--ink)", margin: "0 0 6px", lineHeight: 1.25 }}>
              {card.title}
            </p>
            <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
