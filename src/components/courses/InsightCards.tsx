"use client";

import { buildInsights, type InsightCard } from "@/lib/grades";
import type { Course } from "@/lib/types";
import { track } from "@/lib/analytics";
import { Card, Label, SectionTitle } from "@/components/shared/ui";

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
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionTitle>Insights</SectionTitle>
      {insights.map((card) => (
        <Card key={card.id} onClick={() => track.insightOpened(course.code, card.kind)}>
          <Label>{KIND_LABEL[card.kind]}</Label>
          <p style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)", margin: "6px 0 6px", lineHeight: 1.25 }}>
            {card.title}
          </p>
          <p style={{ fontSize: 15.5, color: "var(--text-2)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {card.body}
          </p>
        </Card>
      ))}
    </section>
  );
}
