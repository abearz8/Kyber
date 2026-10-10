import type { Course, GradeComponent } from "./types";

export function componentAverage(
  component: GradeComponent,
  overrideScores?: (number | null)[]
): number | null {
  const scores = (overrideScores ?? component.scores).filter(
    (s): s is number => s !== null && s !== undefined
  );
  if (scores.length === 0) return null;
  let kept = [...scores].sort((a, b) => a - b);
  const drop = Math.min(
    component.dropLowest || 0,
    Math.max(kept.length - 1, 0)
  );
  if (drop > 0) kept = kept.slice(drop);
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}

type Sim = Record<string, (number | null)[]>;

export function currentStanding(
  course: Course,
  sim?: Sim
): { earned: number; weightGraded: number; standing: number | null } {
  let earned = 0;
  let weightGraded = 0;
  for (const c of course.gradeComponents) {
    const avg = componentAverage(c, sim?.[c.id]);
    if (avg !== null) {
      earned += (avg / 100) * c.weight;
      weightGraded += c.weight;
    }
  }
  const standing = weightGraded > 0 ? (earned / weightGraded) * 100 : null;
  return { earned, weightGraded, standing };
}

export function projectedGrade(
  course: Course,
  sim?: Sim,
  assume?: number
): number {
  const { standing } = currentStanding(course, sim);
  const fill = assume ?? standing ?? 0;
  let total = 0;
  for (const c of course.gradeComponents) {
    const avg = componentAverage(c, sim?.[c.id]);
    total += ((avg === null ? fill : avg) / 100) * c.weight;
  }
  return total;
}

export function neededOnRemaining(
  course: Course,
  target: number,
  sim?: Sim
): { need: number; remainingWeight: number; locked: number } | null {
  let locked = 0;
  let remainingWeight = 0;
  for (const c of course.gradeComponents) {
    const avg = componentAverage(c, sim?.[c.id]);
    if (avg === null) remainingWeight += c.weight;
    else locked += (avg / 100) * c.weight;
  }
  if (remainingWeight === 0) return null;
  const need = ((target - locked) / remainingWeight) * 100;
  return { need, remainingWeight, locked };
}

export function skippableCount(
  course: Course,
  target: number,
  sim?: Sim
): number {
  const { standing } = currentStanding(course, sim);
  const base = standing ?? 0;
  const items: number[] = [];
  for (const c of course.gradeComponents) {
    if (c.type === "exam") continue;
    const scores = sim?.[c.id] ?? c.scores;
    const ungraded = scores.filter((s) => s === null || s === undefined).length;
    const perItemWeight = c.weight / scores.length;
    for (let i = 0; i < ungraded; i++) items.push(perItemWeight);
  }
  items.sort((a, b) => b - a);
  let projected = projectedGrade(course, sim, base);
  let count = 0;
  for (const w of items) {
    const loss = (base / 100) * w;
    if (projected - loss >= target) {
      projected -= loss;
      count++;
    } else break;
  }
  return count;
}

export function componentWithAssumption(
  component: GradeComponent,
  assumed: number
): number | null {
  const filled = component.scores.map((s) => (s == null ? assumed : s));
  return componentAverage(component, filled);
}

export function projectWithAssumptions(
  course: Course,
  assumptions: Record<string, number>
): number {
  let total = 0;
  for (const c of course.gradeComponents) {
    const avg = componentWithAssumption(c, assumptions[c.id] ?? 0);
    total += ((avg ?? 0) / 100) * c.weight;
  }
  return total;
}

export function defaultAssumption(
  course: Course,
  component: GradeComponent
): number {
  const own = componentAverage(component);
  if (own !== null) return Math.round(own);
  const { standing } = currentStanding(course);
  return Math.round(standing ?? course.targetGrade);
}

export function letterGrade(pct: number | null): string {
  if (pct == null) return "—";
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 77) return "B+";
  if (pct >= 73) return "B";
  if (pct >= 70) return "B-";
  if (pct >= 67) return "C+";
  if (pct >= 63) return "C";
  if (pct >= 60) return "C-";
  if (pct >= 50) return "D";
  return "F";
}

export interface InsightCard {
  id: string;
  kind: "strategy" | "weighting" | "method" | "focus";
  title: string;
  body: string;
}

export function buildInsights(course: Course): InsightCard[] {
  const out: InsightCard[] = [];
  const { standing } = currentStanding(course);
  const skip = skippableCount(course, course.targetGrade);

  if (skip > 0) {
    out.push({
      id: "skip",
      kind: "strategy",
      title: `You can miss up to ${skip} assignment${skip > 1 ? "s" : ""} and still hit your ${letterGrade(course.targetGrade)}.`,
      body: `Based on your ${standing ? standing.toFixed(0) : "—"}% standing and the ${course.targetGrade}% goal. Low-weight work like quizzes has the least impact.`,
    });
  }

  const lightest = [...course.gradeComponents]
    .filter((c) => c.type !== "exam")
    .sort((a, b) => a.weight - b.weight)[0];
  if (lightest && lightest.weight <= 10) {
    out.push({
      id: "light",
      kind: "weighting",
      title: `${lightest.name} are only ${lightest.weight}% — low stakes.`,
      body: `Do them, but don't over-invest. An extra 10% on ${lightest.name.toLowerCase()} moves your final grade by just ${(lightest.weight * 0.1).toFixed(1)} points.`,
    });
  }

  out.push({
    id: "method",
    kind: "method",
    title: `Try ${course.studyMethod.name} for this course.`,
    body: course.studyMethod.why,
  });

  const heaviest = [...course.gradeComponents].sort(
    (a, b) => b.weight - a.weight
  )[0];
  if (heaviest) {
    out.push({
      id: "lever",
      kind: "focus",
      title: `${heaviest.name} is your biggest lever at ${heaviest.weight}%.`,
      body: `Together with the next-largest component it decides most of your grade. Protect prep time for it above everything else.`,
    });
  }

  return out;
}

export function submittedProgress(course: Course): number {
  let total = 0;
  for (const c of course.gradeComponents) {
    const scored = c.scores.filter((s) => s != null).length;
    const frac = c.scores.length > 0 ? scored / c.scores.length : 0;
    total += frac * c.weight;
  }
  return Math.round(total);
}
