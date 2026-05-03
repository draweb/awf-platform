import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "danger";

type ButtonProps = {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-white font-semibold rounded-xs shadow-inner hover:brightness-110 active:scale-[0.99]",
  ghost:
    "bg-surface-container-low hover:bg-surface-container border border-border text-on-surface rounded-xs active:scale-[0.98]",
  danger:
    "bg-error-container text-on-error-container font-semibold rounded-xs shadow-inner hover:brightness-110 active:scale-[0.99]",
};

const variantGap: Record<ButtonVariant, string> = {
  primary: "gap-2",
  ghost: "gap-3",
  danger: "gap-2",
};

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`w-full h-10 flex items-center justify-center ${variantGap[variant]} text-sm transition-all duration-200 disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
