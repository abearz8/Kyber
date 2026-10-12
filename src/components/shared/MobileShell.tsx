"use client";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileShell({ children, className = "" }: MobileShellProps) {
  return (
    <div className="mobile-shell-outer">
      <div className={`mobile-shell-inner ${className}`}>
        {children}
      </div>
    </div>
  );
}
