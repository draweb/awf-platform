import type { ReactNode } from "react";

export type BadgeVariant = "neutral" | "danger" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-container-low text-on-surface border border-border",
  danger: "bg-error-container text-on-error-container border border-error-container/30",
  info: "bg-primary-container/15 text-primary-container border border-primary-container/25",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[10px] font-medium font-mono uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
