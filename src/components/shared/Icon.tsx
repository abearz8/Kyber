"use client";

import Image from "next/image";

export type IconName =
  | "tab-courses" | "tab-now" | "tab-plan"
  | "settings" | "back" | "chevron" | "alert" | "search" | "upload" | "reading"
  | "deadlines" | "weeks" | "help" | "step-done" | "step-todo"
  | "colours-school" | "colours-theme" | "colours-own"
  | "time-morning" | "time-afternoon" | "time-evening" | "time-late" | "time-weekends" | "time-any"
  | "goal-strong" | "goal-improve" | "goal-on-top" | "goal-scholarship"
  | "length-short" | "length-medium" | "length-long" | "length-mix";

interface Props {
  name: IconName;
  size?: number;
  style?: React.CSSProperties;
}

/** Illustrated PNG icon from the reference design (public/icons). */
export default function Icon({ name, size = 24, style }: Props) {
  return (
    <Image
      src={`/icons/${name}.png`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0, ...style }}
    />
  );
}
