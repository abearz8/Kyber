"use client";

import { useEffect } from "react";
import type { RescheduleMode } from "@/lib/types";
import { isoToday } from "@/lib/dates";
import { allStudyTasks, previewReschedule } from "@/lib/studyplan";
import { useStore } from "@/hooks/useStore";
import { track } from "@/lib/analytics";
import { useScreenTime } from "@/hooks/useScreenTime";
import { BottomSheet, Card, ChevronRight, OutlineButton, TextLink } from "@/components/shared/ui";

interface Props {
  source: "now" | "plan";
  onClose: () => void;
  onApplied: (mode: RescheduleMode) => void;
}

export default function RescheduleSheet({ source, onClose, onApplied }: Props) {
  useScreenTime("reschedule");
  const { state, dispatch } = useStore();
  const today = isoToday();
  const studyBlock = state.userProfile?.studyBlock;
  const adjustments = state.planAdjustments ?? {};
  const completed = new Set(state.completedTaskIds);
  const tasks = allStudyTasks(state.courses, studyBlock, adjustments);
  const lighter = previewReschedule(tasks, adjustments, "lighter", today, completed);
  const push = previewReschedule(tasks, adjustments, "push", today, completed);
  const hasAdjustments = Object.keys(adjustments).length > 0;

  useEffect(() => { track.replanOpened(source); }, [source]);

  function apply(mode: RescheduleMode) {
    dispatch({ type: "APPLY_RESCHEDULE", mode, fromDate: today });
    track.replanTapped(mode);
    onApplied(mode);
  }

  const options: { mode: RescheduleMode; title: string; sub: string; disabled: boolean }[] = [
    {
      mode: "lighter",
      title: "Make it lighter",
      sub: lighter.affected
        ? `Shortens ${lighter.affected} study block${lighter.affected === 1 ? "" : "s"} · saves ${lighter.minutesSaved} min`
        : "No study blocks left to shorten",
      disabled: lighter.affected === 0,
    },
    {
      mode: "push",
      title: "Push to tomorrow",
      sub: push.affected
        ? `Moves ${push.affected} study block${push.affected === 1 ? "" : "s"} one day later`
        : "Nothing this week can move later",
      disabled: push.affected === 0,
    },
  ];

  return (
    <BottomSheet onClose={onClose} title="Reschedule this week" subtitle={<>Study blocks only. <span className="hi">Nothing&apos;s lost</span> — deadlines stay where they are.</>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {options.map((o) => (
          <Card
            key={o.mode}
            pad="14px 16px"
            onClick={o.disabled ? undefined : () => apply(o.mode)}
            style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, opacity: o.disabled ? 0.5 : 1 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17.5, fontWeight: 700, color: "var(--ink)" }}>{o.title}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-2)", marginTop: 2 }}>{o.sub}</div>
            </div>
            <ChevronRight />
          </Card>
        ))}
      </div>
      <OutlineButton label="Cancel" onClick={onClose} height={52} style={{ width: "100%", marginTop: 16 }} />
      {hasAdjustments && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <TextLink label="Reset to the original plan" size={16} color="var(--text-2)" onClick={() => { dispatch({ type: "CLEAR_ADJUSTMENTS" }); onClose(); }} />
        </div>
      )}
    </BottomSheet>
  );
}
