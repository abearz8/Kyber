"use client";

import Image from "next/image";

interface Props {
  size?: number;
  wordmark?: boolean;
  wordmarkSize?: number;
}

export default function KyberLogo({ size = 40, wordmark = false, wordmarkSize }: Props) {
  const wm = wordmarkSize ?? Math.round(size * 0.62);
  const r = Math.round(size * 0.22);

  const icon = (
    <Image
      src="/kyber-logo.png"
      alt="Kyber"
      width={size}
      height={size}
      style={{ borderRadius: r, display: "block", flexShrink: 0 }}
      priority
    />
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
        Kyber
      </span>
    </div>
  );
}
