"use client";

import type { CSSProperties, ReactNode } from "react";
import KyberLogo from "./KyberLogo";
import Icon, { type IconName } from "./Icon";

// ─── Text ────────────────────────────────────────────────────────────────────

export function Label({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <span className="label" style={{ color, ...style }}>{children}</span>;
}

export function SectionTitle({ children, right, style }: { children: ReactNode; right?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, ...style }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)", lineHeight: 1.2 }}>
        {children}
      </h2>
      {right}
    </div>
  );
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

export function Card({ children, style, onClick, pad = 16, className }: {
  children: ReactNode; style?: CSSProperties; onClick?: () => void; pad?: number | string; className?: string;
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      style={{
        background: "var(--surface)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)", padding: pad, cursor: onClick ? "pointer" : undefined, ...style,
      }}
    >
      {children}
    </div>
  );
}

export function HighlightCard({ children, style, onClick, radius = 16, pad = 16 }: {
  children: ReactNode; style?: CSSProperties; onClick?: () => void; radius?: number; pad?: number | string;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      style={{
        background: "var(--grad-soft)", border: "1.5px solid var(--warn-border)", borderRadius: radius,
        boxShadow: "var(--shadow-card)", padding: pad, cursor: onClick ? "pointer" : undefined, ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Soft square tile holding an illustrated icon. */
export function IconTile({ name, size = 56, icon = 32, bg = "var(--soft)", radius, style }: {
  name: IconName; size?: number; icon?: number; bg?: string; radius?: number; style?: CSSProperties;
}) {
  return (
    <span style={{
      width: size, height: size, borderRadius: radius ?? Math.round(size * 0.28), background: bg,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, ...style,
    }}>
      <Icon name={name} size={icon} />
    </span>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export function PrimaryButton({ label, onClick, disabled, style, height = 52, textSize = 17 }: {
  label: ReactNode; onClick?: () => void; disabled?: boolean; style?: CSSProperties; height?: number; textSize?: number;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height,
        background: "var(--amber)", color: "var(--ink)", border: "none", borderRadius: 14,
        fontWeight: 700, fontSize: textSize, cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "var(--shadow-amber)", opacity: disabled ? 0.45 : 1,
        transition: "opacity .15s, background .15s", padding: "0 18px", ...style,
      }}
      onPointerDown={(e) => { if (!disabled) (e.currentTarget.style.background = "var(--amber-deep)"); }}
      onPointerUp={(e) => { e.currentTarget.style.background = "var(--amber)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.background = "var(--amber)"; }}
    >
      {label}
    </button>
  );
}

export function OutlineButton({ label, onClick, height = 38, style, textSize = 17, disabled, dashed }: {
  label: ReactNode; onClick?: (e: React.MouseEvent) => void; height?: number; style?: CSSProperties; textSize?: number; disabled?: boolean; dashed?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", height,
        background: "var(--surface)", color: "var(--ink)", border: `1.5px ${dashed ? "dashed" : "solid"} var(--ink)`,
        borderRadius: 12, padding: "0 14px", fontWeight: 600, fontSize: textSize,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1, whiteSpace: "nowrap", ...style,
      }}
    >
      {label}
    </button>
  );
}

export function TextLink({ label, onClick, color = "var(--ink)", underline = true, size = 17, style }: {
  label: ReactNode; onClick?: () => void; color?: string; underline?: boolean; size?: number; style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="text-link"
      style={{ color, fontSize: size, textDecoration: underline ? "underline" : "none", ...style }}
    >
      {label}
    </button>
  );
}

export function Pill({ text, bg = "var(--amber-light)", color = "var(--ink)", style }: {
  text: ReactNode; bg?: string; color?: string; style?: CSSProperties;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", background: bg, color, borderRadius: 8,
      padding: "3px 10px", fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, ...style,
    }}>
      {text}
    </span>
  );
}

export function ChevronRight({ size = 18, color = "var(--ink)", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeft({ size = 20, color = "var(--ink)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function CheckIcon({ size = 14, color = "#fff", strokeWidth = 2.4 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// ─── Controls ────────────────────────────────────────────────────────────────

export function Segmented<T extends string | number>({ options, value, onChange, style, height = 48 }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: CSSProperties; height?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--cream-deep)", borderRadius: 14, padding: 4, ...style }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            style={{
              flex: 1, height: height - 8, border: "none", borderRadius: 11, cursor: "pointer",
              background: active ? "var(--amber)" : "transparent", color: active ? "var(--ink)" : "var(--text-2)",
              fontWeight: active ? 700 : 500, fontSize: 17,
              boxShadow: active ? "0 2px 6px rgba(233,163,25,.3)" : "none", transition: "background .15s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function MiniSegmented<T extends string | number>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label?: string;
}) {
  return (
    <div aria-label={label} style={{ display: "flex", gap: 2, background: "var(--cream-deep)", borderRadius: 10, padding: 3, flexShrink: 0 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            style={{
              border: "none", borderRadius: 7, padding: "5px 9px", cursor: "pointer",
              background: active ? "var(--amber)" : "transparent", color: active ? "var(--ink)" : "var(--text-2)",
              fontWeight: active ? 600 : 500, fontSize: 16,
              boxShadow: active ? "0 2px 5px rgba(233,163,25,.3)" : "none", whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={{
        width: 52, height: 30, borderRadius: 999, background: value ? "var(--amber)" : "var(--line)",
        border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 25 : 3, width: 24, height: 24, borderRadius: "50%",
        background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.18)",
      }} />
    </button>
  );
}

export function Checkbox({ checked, onChange, color = "var(--amber)", size = 26, label }: {
  checked: boolean; onChange?: () => void; color?: string; size?: number; label?: string;
}) {
  return (
    <button
      onClick={onChange}
      aria-label={label}
      aria-pressed={checked}
      style={{ background: "none", border: "none", padding: 0, cursor: onChange ? "pointer" : "default", flexShrink: 0, display: "flex" }}
    >
      <span style={{
        width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${checked ? color : "var(--ink)"}`, background: checked ? color : "transparent", transition: "background .15s",
      }}>
        {checked && <CheckIcon size={size * 0.55} color="var(--ink)" />}
      </span>
    </button>
  );
}

// ─── Overlays ────────────────────────────────────────────────────────────────

export function BottomSheet({ onClose, children, maxHeight = "88%", zIndex = 50, pad = 20, title, subtitle }: {
  onClose: () => void; children: ReactNode; maxHeight?: string; zIndex?: number; pad?: number | string; title?: ReactNode; subtitle?: ReactNode;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(39,37,31,0.32)" }} />
      <div
        className="no-scrollbar"
        style={{
          position: "relative", background: "var(--paper)", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: pad, paddingBottom: `calc(${typeof pad === "number" ? `${pad}px` : pad} + var(--safe-bottom))`,
          maxHeight, overflowY: "auto", boxShadow: "0 -8px 40px rgba(39,37,31,0.18)",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--checkbox)", margin: "0 auto 16px", opacity: 0.7 }} />
        {title !== undefined && (
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--ink)" }}>{title}</h2>
        )}
        {subtitle !== undefined && (
          <p style={{ margin: "6px 0 0", fontSize: 17, fontWeight: 500, color: "var(--ink)", lineHeight: 1.4 }}>{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, bottom }: { message: string; bottom?: string }) {
  return (
    <div style={{
      position: "absolute", left: "50%", bottom: bottom ?? "calc(var(--tab-height) + 12px + var(--safe-bottom))", transform: "translateX(-50%)",
      background: "var(--ink)", color: "#fff", padding: "11px 18px", borderRadius: 14,
      fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 60,
      maxWidth: "calc(100% - 32px)", overflow: "hidden", textOverflow: "ellipsis",
    }}>
      {message}
    </div>
  );
}

// ─── Screen header (Courses / Today / Plan) ──────────────────────────────────

export function ScreenHeader({ title, subtitle, onSettings, right }: {
  title: string; subtitle?: ReactNode; onSettings?: () => void; right?: ReactNode;
}) {
  return (
    <div style={{ padding: "14px 16px 10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <KyberLogo size={40} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.4px", lineHeight: 1.15, whiteSpace: "nowrap" }}>{title}</p>
          {subtitle && (
            <p style={{ margin: "1px 0 0", fontSize: 15, color: "var(--text-2)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {right}
        {onSettings && (
          <button
            onClick={onSettings}
            aria-label="Settings"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          >
            <Icon name="settings" size={32} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Bottom padding for scroll areas so the last card clears the tab bar. */
export const SCROLL_BOTTOM = "calc(var(--tab-height) + 24px + var(--safe-bottom))";

/** Shared divider between rows inside a card. */
export const ROW_DIVIDER = "1px solid var(--track)";
