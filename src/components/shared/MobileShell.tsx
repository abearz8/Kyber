"use client";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileShell({ children, className = "" }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div
        className={`relative w-full bg-[var(--bg)] overflow-hidden flex flex-col ${className}`}
        style={{
          maxWidth: 390,
          minHeight: "100dvh",
          maxHeight: "100dvh",
          // On desktop: look like a phone
          borderRadius: "clamp(0px, calc(100vw - 400px), 40px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
