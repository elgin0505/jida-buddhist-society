"use client";

import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

// ── Validation State ─────────────────────────────────────────
export type ValidationState = "default" | "success" | "error" | "warning";

const ringStyles: Record<ValidationState, string> = {
  default: "border-ocher/40 focus:ring-golden-deep/30 focus:border-golden-deep",
  success: "border-jade-light focus:ring-jade/20 focus:border-jade",
  error: "border-carmine focus:ring-carmine/20 focus:border-carmine",
  warning: "border-golden-candle focus:ring-golden-candle/20 focus:border-golden-candle",
};

const messageStyles: Record<Exclude<ValidationState, "default">, string> = {
  success: "text-jade",
  error: "text-carmine",
  warning: "text-golden-rich",
};

// ── Form Field Wrapper ───────────────────────────────────────
interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  successMessage?: string;
  warningMessage?: string;
  hint?: string;
  state?: ValidationState;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  successMessage,
  warningMessage,
  hint,
  state = "default",
  children,
  className,
  required,
}) => {
  const message =
    state === "error"
      ? error
      : state === "success"
      ? successMessage
      : state === "warning"
      ? warningMessage
      : null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-charcoal"
        >
          {label}
          {required && <span className="ml-0.5 text-carmine">*</span>}
        </label>
      )}
      {children}
      {hint && state === "default" && (
        <p className="text-xs text-muted">{hint}</p>
      )}
      {message && state !== "default" && (
        <p className={cn("flex items-center gap-1 text-xs font-medium", messageStyles[state as Exclude<ValidationState, "default">])}>
          {state === "error" && "✕"}
          {state === "success" && "✓"}
          {state === "warning" && "⚠"}
          {message}
        </p>
      )}
    </div>
  );
};

// ── Input ────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: ValidationState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, state = "default", leftIcon, rightIcon, ...props }, ref) => (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 text-muted">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-warm-white/80 px-3 py-2.5 text-sm text-charcoal transition-all duration-200",
          "placeholder:text-muted/60 focus:outline-none focus:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          ringStyles[state],
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          className
        )}
        {...props}
      />
      {rightIcon && (
        <span className="pointer-events-none absolute right-3 text-muted">
          {rightIcon}
        </span>
      )}
    </div>
  )
);
Input.displayName = "Input";

// ── Textarea ─────────────────────────────────────────────────
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: ValidationState;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state = "default", ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-xl border bg-warm-white/80 px-3 py-2.5 text-sm text-charcoal transition-all duration-200",
        "placeholder:text-muted/60 focus:outline-none focus:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        ringStyles[state],
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ── Select ───────────────────────────────────────────────────
interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  state?: ValidationState;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, state = "default", children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-xl border bg-warm-white/80 px-3 py-2.5 pr-10 text-sm text-charcoal transition-all duration-200",
          "focus:outline-none focus:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          ringStyles[state],
          className
        )}
        {...props}
      >
        {children}
      </select>
      {/* 自定义箭头 */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
);
Select.displayName = "Select";

// ── Button ───────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "zen";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-golden-deep to-golden-rich text-white shadow-[0_4px_14px_rgba(201,162,39,0.35)] hover:shadow-[0_6px_20px_rgba(201,162,39,0.45)] hover:from-golden-rich hover:to-golden-deep",
  secondary:
    "border border-ocher/50 bg-warm-white/80 text-charcoal hover:bg-ocher-light/30",
  ghost: "bg-transparent text-charcoal hover:bg-ocher-light/20",
  danger:
    "bg-carmine text-white shadow-[0_4px_14px_rgba(193,18,31,0.25)] hover:bg-carmine-soft",
  zen:
    "border border-golden-deep/30 bg-gradient-to-br from-ocher-light/20 to-warm-cream text-golden-rich hover:from-ocher-light/40",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-golden-deep/30 focus:ring-offset-1",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";

// ── Checkbox ─────────────────────────────────────────────────
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-ocher/40 text-golden-deep accent-golden-deep",
            "focus:ring-2 focus:ring-golden-deep/30",
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="cursor-pointer select-none text-sm text-charcoal">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
