"use client";

import type { ReactNode } from "react";
import KyberLogo from "@/components/shared/KyberLogo";
import Icon from "@/components/shared/Icon";
import { Label, TextLink } from "@/components/shared/ui";

export const ONBOARDING_TOTAL = 7;

interface Props {
  step?: number; // 1-based; omit for screens without progress
  stepName?: string; // "Your school"
  lastStep?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
  contentStyle?: React.CSSProperties;
}

/** Shared chrome for every onboarding screen: top bar, progress, eyebrow, headline, sticky footer. */
export default function OnboardingFrame({ step, stepName, lastStep, onBack, onSkip, title, sub, children, footer, centered, contentStyle }: Props) {
  const pct = step ? Math.round((step / ONBOARDING_TOTAL) * 100) : null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--cream)" }}>
      {/* Top bar */}
      <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 48px", alignItems: "center", padding: "16px 12px 0", flexShrink: 0 }}>
        <div>
          {onBack && (
            <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
              <Icon name="back" size={22} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <KyberLogo size={36} wordmark wordmarkSize={26} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {onSkip && <TextLink label="Skip" onClick={onSkip} size={16} />}
        </div>
      </div>

      {pct !== null && (
        <div style={{ margin: "18px 20px 0", height: 6, borderRadius: 99, background: "var(--line)", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--amber)", borderRadius: 99, transition: "width .3s" }} />
        </div>
      )}

      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "22px 20px 16px", display: "flex", flexDirection: "column", ...contentStyle }}>
        {(step || lastStep) && (
          <Label style={{ display: "block", marginBottom: 8, letterSpacing: "0.12em" }}>
            {lastStep ? "Last step" : `Step ${step} of ${ONBOARDING_TOTAL}`}{stepName ? ` · ${stepName}` : ""}
          </Label>
        )}
        {title && (
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.2, color: "var(--ink)", textAlign: centered ? "center" : "left" }}>
            {title}
          </h1>
        )}
        {sub && (
          <p style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 500, lineHeight: 1.45, color: "var(--ink)", textAlign: centered ? "center" : "left" }}>
            {sub}
          </p>
        )}
        {children}
      </div>

      {footer && (
        <div style={{ padding: "10px 20px calc(16px + var(--safe-bottom))", flexShrink: 0, background: "var(--cream)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
