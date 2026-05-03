"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";

type InputFieldProps = {
  label: string;
  icon?: string;
  trailing?: React.ReactNode;
  /** Sobrescribe estilos del label (p. ej. legibilidad en drawers densos). */
  labelClassName?: string;
  /** Muestra botón de ojo para alternar texto / contraseña (ignora `icon` en el lado derecho). */
  passwordVisibilityToggle?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export function InputField({
  label,
  icon,
  trailing,
  labelClassName,
  className = "",
  passwordVisibilityToggle,
  type,
  ...rest
}: InputFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputType =
    passwordVisibilityToggle === true ? (passwordVisible ? "text" : "password") : type;
  const showRightPadding = Boolean(icon) || passwordVisibilityToggle === true;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-end">
        <label
          className={`font-[family-name:var(--font-label)] text-[10px] text-outline uppercase tracking-wider pl-1 ${labelClassName ?? ""}`}
        >
          {label}
        </label>
        {trailing}
      </div>
      <div className="relative group">
        <input
          type={inputType}
          className={`w-full bg-input border border-border rounded-sm text-sm font-mono text-on-surface
            focus:ring-0 focus:border-primary-container transition-colors
            placeholder:text-outline/40 px-3 py-2 ${showRightPadding ? "pr-11" : ""} ${className}`}
          {...rest}
        />
        {passwordVisibilityToggle ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xs text-outline
              hover:text-on-surface hover:bg-surface-container-high/80 transition-colors
              group-focus-within:text-primary-container"
            aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <span className="material-symbols-outlined text-xl">
              {passwordVisible ? "visibility_off" : "visibility"}
            </span>
          </button>
        ) : (
          icon && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg
                group-focus-within:text-primary-container transition-colors"
            >
              {icon}
            </span>
          )
        )}
      </div>
    </div>
  );
}
