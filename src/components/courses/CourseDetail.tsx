"use client";

import { useState } from "react";
import type { Course, CourseEvent, GradeComponent } from "@/lib/types";
import { daysUntil, relativeLabel, fmtShort, isoToday, dayOfMonth } from "@/lib/dates";
import { typeLabel } from "@/lib/events";
import {
  submittedProgress,
  projectWithAssumptions,
  defaultAssumption,
  letterGrade,
  markStatus,
  enteredMark,
  componentDate,
} from "@/lib/grades";
import { allStudyTasks } from "@/lib/studyplan";
import { deriveUnits } from "@/lib/units";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import { useScreenTime } from "@/hooks/useScreenTime";
import InsightCards from "./InsightCards";
import GradeCalculator from "./GradeCalculator";
import UnitsList from "./UnitsList";
import MarkEntrySheet from "./MarkEntrySheet";
import NoDeadlinesPanel from "./NoDeadlinesPanel";
import ColorPaletteModal from "@/components/shared/ColorPaletteModal";
import AddToPlanSheet from "@/components/plan/AddToPlanSheet";
import {
  Card, HighlightCard, Label, SectionTitle, OutlineButton, ChevronRight, ChevronLeft, Toast, TextLink, SCROLL_BOTTOM,
} from "@/components/shared/ui";

interface Props {
  course: Course;
  onBack: () => void;
  onDelete: () => void;
  onAddSyllabus?: () => void;
}

const GRADE_COLORS = ["#9CC5A1", "#8FB3E0", "#E9A319", "#B48CFF", "#FFAAA5", "#DCCFB6"];

const STUDY_TILES = [
  { key: "summary", title: "Summary", caption: "Key ideas in plain language", icon: <DocIcon /> },
  { key: "practice", title: "Practice Qs", caption: "Exam-style Q&A with key", icon: <BoltIcon /> },
  { key: "flashcards", title: "Flashcards", caption: "Quick-fire recall of terms", icon: <CardsIcon /> },
  { key: "teachback", title: "Teach-back", caption: "Explain it, get probed", icon: <SpeakerIcon /> },
];

function buildStudyPrompt(course: Course, kind: string): string {
  const subjects = course.subjects.join(", ");
  const components = course.gradeComponents.map((g) => `${g.name} (${g.weight}%)`).join(", ");

  switch (kind) {
    case "summary":
      return `I'm studying ${course.title} (${course.code}), taught by ${course.instructor}. The current topic is "${course.currentTopic}".

Course subjects: ${subjects}

Please provide a comprehensive summary of "${course.currentTopic}" that includes:
- Core concepts and definitions in plain language
- Key frameworks, models, or processes
- How this topic connects to the broader course
- The 3–5 most exam-critical ideas

Keep it clear and student-friendly.`;

    case "practice":
      return `I'm preparing for exams in ${course.title} (${course.code}), taught by ${course.instructor}. Current topic: "${course.currentTopic}".

Grade breakdown: ${components}
Course subjects: ${subjects}

Generate 10 university-level practice questions for "${course.currentTopic}". For each:
1. Write the question clearly
2. Provide a detailed model answer
3. Note which concept it tests

Include a mix of short-answer, multiple-choice, and applied/case questions.`;

    case "flashcards":
      return `Create 20 flashcards for ${course.title} (${course.code}), topic: "${course.currentTopic}".

Course subjects: ${subjects}

Format each as:
CARD [#]:
Front: [term, concept, or question]
Back: [clear, concise definition or answer]

Cover key terms, formulas, frameworks, and concepts. Make each back memorable and specific.`;

    case "teachback":
      return `I'm a student in ${course.title} (${course.code}) learning "${course.currentTopic}" and I want to test my understanding by teaching it.

Recommended study method: ${course.studyMethod.name} — ${course.studyMethod.why}

Your role: Act as a rigorous professor. Start by asking me to explain one specific concept from "${course.currentTopic}". After my response, ask 2–3 targeted follow-up questions that expose gaps in my understanding. Guide me until I demonstrate real mastery. Begin now.`;

    default:
      return "";
  }
}

export default function CourseDetail({ course, onBack, onDelete, onAddSyllabus }: Props) {
  const { state, dispatch } = useStore();
  const [calcOpen, setCalcOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [markFor, setMarkFor] = useState<GradeComponent | null>(null);
  const [addingDeadline, setAddingDeadline] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Takeover screens replace the detail view.
  useScreenTime(calcOpen ? `grade_calculator:${course.code}` : unitsOpen ? `units:${course.code}` : null);

  const c = course.color;
  const today = isoToday();
  const progress = submittedProgress(course);
  const assumptions = Object.fromEntries(
    course.gradeComponents.map((gc) => [gc.id, defaultAssumption(course, gc)])
  );
  const projected = projectWithAssumptions(course, assumptions);
  const sortedEvents = [...course.events].sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = sortedEvents.find((e) => daysUntil(e.date) >= 0) ?? null;

  const studyTasks = allStudyTasks([course], state.userProfile?.studyBlock, state.planAdjustments);
  const unitsInfo = deriveUnits(course, today, studyTasks);
  const completed = new Set(state.completedTaskIds);
  const currentUnit = unitsInfo ? unitsInfo.units[unitsInfo.currentIndex] : null;
  const currentUnitDone = currentUnit
    ? studyTasks.filter((t) => t.date >= currentUnit.start && t.date < currentUnit.end && completed.has(t.id)).length
    : 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function copyPrompt(kind: string, title: string) {
    const prompt = buildStudyPrompt(course, kind);
    try {
      await navigator.clipboard.writeText(prompt);
      showToast(`${title} prompt copied`);
    } catch {
      showToast("Copy failed — try long-pressing");
    }
    track.courseSectionViewed(course.code, `study_${kind}`);
  }

  function addEvent(e: CourseEvent) {
    dispatch({
      type: "ADD_PERSONAL_EVENT",
      event: { id: `evt-${e.id}`, kind: "study", title: e.title, date: e.date },
    });
    track.courseDatesAdded(course.code, 1);
    showToast("Added to your plan");
  }

  function addAll() {
    for (const e of sortedEvents) {
      dispatch({
        type: "ADD_PERSONAL_EVENT",
        event: { id: `evt-${e.id}`, kind: "study", title: e.title, date: e.date },
      });
    }
    track.courseDatesAdded(course.code, sortedEvents.length);
    showToast(`Added ${sortedEvents.length} dates to your plan`);
  }

  function addCourseEvent(courseId: string, event: CourseEvent) {
    dispatch({ type: "ADD_COURSE_EVENT", courseId, event });
    track.deadlineAddedManually(course.code, event.type);
    setAddingDeadline(false);
    showToast("Deadline added. Kyber will plan around it.");
  }

  function removeManual(e: CourseEvent) {
    dispatch({ type: "DELETE_COURSE_EVENT", courseId: course.id, eventId: e.id });
    showToast("Deadline removed");
  }

  if (calcOpen) {
    return <GradeCalculator course={course} onBack={() => setCalcOpen(false)} />;
  }
  if (unitsOpen && unitsInfo) {
    return <UnitsList course={course} info={unitsInfo} onBack={() => setUnitsOpen(false)} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ position: "relative", minHeight: 0 }}>
      {/* Top row */}
      <div style={{ padding: "14px 16px 8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 2, fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>
          <ChevronLeft /> Courses
        </button>
        <OutlineButton label="Course colour" height={40} onClick={() => setShowPalette(true)} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: `6px 16px ${SCROLL_BOTTOM}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Header card */}
          <Card pad={0} style={{ overflow: "hidden", textAlign: "center" }}>
            <div style={{ height: 10, background: c }} />
            <div style={{ padding: "16px 18px 18px" }}>
              <Label>{course.code}</Label>
              <h1 style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.6px", color: "var(--ink)", margin: "6px 0 6px", lineHeight: 1.15 }}>
                {course.title}
              </h1>
              <p style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
                {course.instructor} · {course.term}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 6, background: "var(--track)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: c, borderRadius: 6 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", flexShrink: 0 }}>{progress}% submitted</span>
              </div>
            </div>
          </Card>

          {/* Units */}
          {unitsInfo && currentUnit && (
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionTitle right={<span style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>Unit {unitsInfo.currentIndex + 1} of {unitsInfo.total}</span>}>
                Units
              </SectionTitle>
              <HighlightCard>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {unitsInfo.units.map((u) => (
                    <span key={u.index} style={{
                      flex: 1, height: 8, borderRadius: 8,
                      background: u.index < unitsInfo.currentIndex ? c : u.index === unitsInfo.currentIndex ? "var(--amber)" : "var(--line)",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17.5, color: "var(--ink)", flexShrink: 0 }}>
                    {unitsInfo.currentIndex + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {unitsInfo.anchored && <Label>This week</Label>}
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentUnit.title}
                    </div>
                  </div>
                  {currentUnit.onFinal && (
                    <span style={{ background: "var(--amber)", color: "var(--ink)", borderRadius: 8, padding: "5px 10px", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>On the final</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 600, color: "var(--ink)" }}>
                    {currentUnit.steps > 0 ? `${currentUnitDone} of ${currentUnit.steps} steps · ` : ""}
                    {currentUnit.readings} reading{currentUnit.readings === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={() => { track.unitsViewed(course.code); setUnitsOpen(true); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 16.5, fontWeight: 700, color: "var(--ink)" }}
                  >
                    All units <ChevronRight size={16} />
                  </button>
                </div>
              </HighlightCard>
            </section>
          )}

          {/* Grades */}
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionTitle>Grades</SectionTitle>
            <Card>
              <div style={{ height: 14, borderRadius: 8, overflow: "hidden", display: "flex", gap: 2 }}>
                {course.gradeComponents.map((gc, i) => (
                  <div key={gc.id} style={{ width: `${gc.weight}%`, background: GRADE_COLORS[i % GRADE_COLORS.length] }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
                {course.gradeComponents.map((gc, i) => (
                  <span key={gc.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: GRADE_COLORS[i % GRADE_COLORS.length] }} />
                    {shortName(gc.name)} {gc.weight}%
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                {course.gradeComponents.map((gc, i) => {
                  const status = markStatus(course, gc, today);
                  const date = componentDate(course, gc);
                  const sub = date
                    ? `${gc.weight}% · ${fmtShort(date)}${daysUntil(date) > 0 ? `, in ${daysUntil(date)} day${daysUntil(date) === 1 ? "" : "s"}` : ""}`
                    : `${gc.weight}% · end of term`;
                  return (
                    <div key={gc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: i === 0 ? "none" : "1px solid var(--track)" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: GRADE_COLORS[i % GRADE_COLORS.length], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>{gc.name}</div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", marginTop: 2 }}>{sub}</div>
                      </div>
                      {status === "entered" ? (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>{enteredMark(gc)}%</div>
                          <TextLink label="Edit" onClick={() => setMarkFor(gc)} size={16} />
                        </div>
                      ) : status === "not_yet" ? (
                        <OutlineButton label="Not yet" dashed height={38} textSize={16.5} onClick={() => setMarkFor(gc)} />
                      ) : (
                        <button
                          onClick={() => setMarkFor(gc)}
                          style={{ background: "var(--amber-light)", border: "1.5px solid var(--warn-border)", borderRadius: 12, padding: "9px 14px", fontSize: 17, fontWeight: 700, color: "var(--ink)", cursor: "pointer", flexShrink: 0 }}
                        >
                          Enter mark
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <HighlightCard onClick={() => { track.gradeCalculatorUsed(course.code); setCalcOpen(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 17.5, fontWeight: 700, color: "var(--ink)" }}>Grade calculator</div>
                <div style={{ fontSize: 16.5, fontWeight: 500, color: "var(--ink)", marginTop: 3 }}>Projected {projected.toFixed(1)}% · {letterGrade(projected)}</div>
              </div>
              <ChevronRight size={20} />
            </HighlightCard>
          </section>

          {/* Insights */}
          <InsightCards course={course} />

          {/* Things to know */}
          {course.tips.length > 0 && (
            <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionTitle>Things to know</SectionTitle>
              <Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {course.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0, marginTop: 8 }} />
                      <span style={{ fontSize: 16, color: "var(--ink)", lineHeight: 1.45, fontWeight: 500 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* Study with AI */}
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionTitle>Study with AI</SectionTitle>
            <Card>
              <p style={{ fontSize: 16, color: "var(--text-2)", margin: "0 0 14px", lineHeight: 1.5, fontWeight: 500 }}>
                Tap a tile to copy a ready-made prompt for{" "}
                <b style={{ color: "var(--ink)" }}>{course.currentTopic}</b>{" "}
                — paste it into ChatGPT, Claude, or any AI to start studying.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {STUDY_TILES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => copyPrompt(t.key, t.title)}
                    style={{
                      background: "var(--soft)", borderRadius: 16, padding: "14px 14px 14px",
                      border: "1.5px solid transparent", cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "border-color .15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--warn-border)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                  >
                    <div style={{ color: "var(--amber-deep)", marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ fontSize: 16.5, fontWeight: 700, color: "var(--ink)" }}>{t.title}</div>
                    <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 3, lineHeight: 1.35, fontWeight: 500 }}>{t.caption}</div>
                    <div style={{ fontSize: 13, color: "var(--amber-deep)", marginTop: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy prompt
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </section>

          {/* Important dates */}
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionTitle right={sortedEvents.length > 0 ? <OutlineButton label="Add to calendar" height={36} textSize={16} onClick={addAll} /> : undefined}>
              Important dates
            </SectionTitle>
            {sortedEvents.length === 0 ? (
              <NoDeadlinesPanel course={course} onAdd={() => setAddingDeadline(true)} />
            ) : (
              <>
                <Card pad="4px 16px">
                  {sortedEvents.map((e, i) => {
                    const isNext = nextEvent?.id === e.id;
                    const past = daysUntil(e.date) < 0;
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--track)", opacity: past ? 0.6 : 1 }}>
                        <div style={{
                          width: 48, height: 50, borderRadius: 12, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          background: isNext ? "var(--soft)" : "var(--cream-deep)", border: isNext ? "1px solid var(--warn-border)" : "1px solid transparent",
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-2)", textTransform: "uppercase" }}>{monthAbbr(e.date)}</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>{dayOfMonth(e.date)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</p>
                          <p style={{ fontSize: 15, color: "var(--text-2)", margin: "2px 0 0", fontWeight: 500 }}>
                            {typeLabel(e.type)}{e.weight > 0 ? ` · ${e.weight}%` : ""}{e.manual ? " · added by you" : ""}{e.estimated ? " · estimated" : ""}
                          </p>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-2)", flexShrink: 0 }}>{relativeLabel(e.date)}</span>
                        {e.manual ? (
                          <button onClick={() => removeManual(e)} aria-label={`Remove ${e.title}`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                          </button>
                        ) : (
                          <button onClick={() => addEvent(e)} aria-label={`Add ${e.title} to plan`} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--amber-deep)", padding: 0, flexShrink: 0, display: "flex" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </Card>
                <div style={{ textAlign: "center" }}>
                  <TextLink label="Add another deadline" onClick={() => setAddingDeadline(true)} size={16} />
                </div>
              </>
            )}
          </section>

          {/* Remove */}
          {confirmDelete ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => { setConfirmDelete(false); onDelete(); }}
                style={{ background: "var(--pink)", color: "var(--ink)", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
              >
                Yes, remove
              </button>
              <OutlineButton label="Cancel" onClick={() => setConfirmDelete(false)} height={42} textSize={16} />
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <TextLink label="Remove this course" onClick={() => setConfirmDelete(true)} size={16} color="#B23B3B" />
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} />}

      {markFor && <MarkEntrySheet course={course} component={markFor} onClose={() => setMarkFor(null)} />}

      {addingDeadline && (
        <AddToPlanSheet
          defaultDate={today}
          preset={{ kind: "deadline", courseId: course.id }}
          courses={[course]}
          onAddCourseEvent={addCourseEvent}
          onAdd={(ev) => { dispatch({ type: "ADD_PERSONAL_EVENT", event: ev }); track.planItemOpened(ev.kind); setAddingDeadline(false); showToast("Added to your plan"); }}
          onAddSyllabus={onAddSyllabus ? () => { setAddingDeadline(false); onAddSyllabus(); } : undefined}
          onCancel={() => setAddingDeadline(false)}
        />
      )}

      {showPalette && (
        <ColorPaletteModal courses={[course]} focusCourseId={course.id} onClose={() => setShowPalette(false)} />
      )}
    </div>
  );
}

function monthAbbr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short" });
}

/** "Class contribution" → "Class" for the legend; keeps short names as-is. */
function shortName(name: string): string {
  const first = name.split(/[\s(/]+/)[0];
  return first.length >= 3 ? first : name;
}

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" /></svg>
  );
}
function CardsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="13" rx="2" /><path d="M7 7V5a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}
