"use client";

import type { Course, NowTask } from "@/lib/types";
import { generateNowTasks } from "@/lib/now";
import { useStore } from "@/hooks/useStore";
import { relativeLabel, fmtFull } from "@/lib/dates";
import { typeLabel } from "@/lib/events";
import { track } from "@/lib/analytics";

const TYPE_ICON: Record<string, string> = {
  exam: "📋",
  quiz: "✏️",
  assignment: "📝",
  lab: "🧪",
  reading: "📖",
};

interface TaskItemProps {
  task: NowTask;
  done: boolean;
  onToggle: () => void;
}

function TaskItem({ task, done, onToggle }: TaskItemProps) {
  const isUrgent = task.daysUntil <= 1 && !done;
  return (
    <button
      className="w-full text-left flex items-start gap-3 rounded-2xl p-3.5 transition-all"
      style={{
        background: done ? "var(--surface-2)" : "var(--surface)",
        border: `1px solid ${isUrgent ? task.courseColor + "40" : "var(--border)"}`,
        opacity: done ? 0.55 : 1,
      }}
      onClick={() => {
        track.nowTaskOpened(task.type);
        onToggle();
        if (!done) track.nowTaskCompleted(task.type, task.daysUntil);
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${done ? task.courseColor : "var(--border)"}`,
          background: done ? task.courseColor : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: task.courseColor,
              background: task.courseColor + "18",
              borderRadius: 4,
              padding: "1px 5px",
              letterSpacing: "0.04em",
            }}
          >
            {task.courseCode}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {TYPE_ICON[task.type]} {typeLabel(task.type)}
          </span>
          {task.weight > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {task.weight}%</span>
          )}
        </div>
        <p
          style={{
            fontSize: 14,
            fontWeight: done ? 400 : 600,
            color: done ? "var(--text-3)" : "var(--text)",
            margin: 0,
            textDecoration: done ? "line-through" : "none",
            lineHeight: 1.35,
          }}
        >
          {task.title}
        </p>
        <p style={{ fontSize: 11, color: isUrgent ? "#ef4444" : "var(--text-3)", margin: "2px 0 0", fontWeight: isUrgent ? 600 : 400 }}>
          {relativeLabel(task.date)} · {fmtFull(task.date)}
        </p>
      </div>
    </button>
  );
}

interface Props {
  courses: Course[];
}

export default function NowTab({ courses }: Props) {
  const { state, dispatch } = useStore();
  const completedIds = new Set(state.completedTaskIds);
  const tasks = generateNowTasks(courses);

  const todayTasks = tasks.filter((t) => t.bucket === "today");
  const tomorrowTasks = tasks.filter((t) => t.bucket === "tomorrow");
  const upcomingTasks = tasks.filter((t) => t.bucket === "upcoming");

  function toggle(task: NowTask) {
    if (completedIds.has(task.id)) {
      dispatch({ type: "UNCOMPLETE_TASK", taskId: task.id });
    } else {
      dispatch({ type: "COMPLETE_TASK", taskId: task.id });
    }
  }

  const topTask = tasks.find((t) => !completedIds.has(t.id)) ?? null;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
        <p style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text)", margin: "0 0 8px" }}>
          Nothing due this week
        </p>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.5 }}>
          Check back soon. Upcoming tasks will appear here as deadlines approach.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <h1 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text)", margin: "0 0 2px" }}>
          Now
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
          {tasks.filter((t) => !completedIds.has(t.id)).length} tasks this week
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Up Next */}
        {topTask && (
          <div>
            <SectionLabel label="Up Next" />
            <div
              style={{
                background: topTask.courseColor + "10",
                border: `1.5px solid ${topTask.courseColor}30`,
                borderRadius: 16,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 4, height: 40, borderRadius: 2, background: topTask.courseColor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: topTask.courseColor, fontWeight: 600, margin: "0 0 2px" }}>
                  {topTask.courseCode}
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 2px", lineHeight: 1.3 }}>
                  {topTask.title}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
                  {relativeLabel(topTask.date)}
                  {topTask.weight > 0 && ` · ${topTask.weight}% of grade`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Today */}
        {todayTasks.length > 0 && (
          <Section label="Today" tasks={todayTasks} completedIds={completedIds} onToggle={toggle} />
        )}

        {/* Tomorrow */}
        {tomorrowTasks.length > 0 && (
          <Section label="Tomorrow" tasks={tomorrowTasks} completedIds={completedIds} onToggle={toggle} />
        )}

        {/* Prepare ahead */}
        {upcomingTasks.length > 0 && (
          <Section label="Prepare Ahead" tasks={upcomingTasks} completedIds={completedIds} onToggle={toggle} />
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      margin: "0 0 8px",
    }}>
      {label}
    </p>
  );
}

function Section({
  label,
  tasks,
  completedIds,
  onToggle,
}: {
  label: string;
  tasks: NowTask[];
  completedIds: Set<string>;
  onToggle: (t: NowTask) => void;
}) {
  return (
    <div>
      <SectionLabel label={label} />
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} done={completedIds.has(t.id)} onToggle={() => onToggle(t)} />
        ))}
      </div>
    </div>
  );
}
