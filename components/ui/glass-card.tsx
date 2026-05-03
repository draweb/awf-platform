import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`glass-panel w-full max-w-[400px] rounded-sm shadow-2xl overflow-hidden flex flex-col ${className}`}
    >
      {children}
    </div>
  );
}
