"use client";

import { useId } from "react";

interface Props {
  /** Size of the rounded-square icon in px. */
  size?: number;
  /** Render the "kyber" wordmark beside the icon (onboarding header). */
  wordmark?: boolean;
  /** Wordmark font size; defaults to a ratio of the icon size. */
  wordmarkSize?: number;
}

/**
 * Kyber app icon — a dark charcoal rounded square with a gold-gradient
 * graduation-cap "K", matching the native iOS app icon in the screenshots.
 */
export default function KyberLogo({ size = 40, wordmark = false, wordmarkSize }: Props) {
  const uid = useId().replace(/:/g, "");
  const goldId = `kyberGold-${uid}`;
  const bgId = `kyberBg-${uid}`;
  const radius = size * 0.28;
  const wm = wordmarkSize ?? Math.round(size * 0.62);

  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
      role="img"
      aria-label="Kyber"
    >
      <defs>
        <linearGradient id={goldId} x1="25" y1="12" x2="78" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE49A" />
          <stop offset="0.45" stopColor="#F4B73C" />
          <stop offset="1" stopColor="#E08A12" />
        </linearGradient>
        <linearGradient id={bgId} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2c2920" />
          <stop offset="1" stopColor="#16140e" />
        </linearGradient>
      </defs>

      {/* Dark rounded-square tile */}
      <rect x="0" y="0" width="100" height="100" rx={100 * 0.28} fill={`url(#${bgId})`} />

      {/* Graduation cap (mortarboard) */}
      <path
        d="M50 20 L78 31 L50 42 L22 31 Z"
        fill={`url(#${goldId})`}
      />
      {/* Cap button + tassel */}
      <circle cx="50" cy="31" r="2.6" fill="#16140e" opacity="0.55" />
      <path d="M72 33.5 L72 48" stroke={`url(#${goldId})`} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="72" cy="50" r="3" fill={`url(#${goldId})`} />

      {/* Bold "K" */}
      <path
        d="M34 46 L34 82 L43 82 L43 69 L46 66 L57 82 L68 82 L51.5 59 L66.5 46 L55 46 L43 57 L43 46 Z"
        fill={`url(#${goldId})`}
      />
    </svg>
  );

  if (!wordmark) return icon;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 }}>
      {icon}
      <span
        style={{
          fontFamily: "var(--ios-font)",
          fontWeight: 600,
          fontSize: wm,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
        }}
      >
        kyber
      </span>
    </div>
  );
}
