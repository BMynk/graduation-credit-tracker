import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    className,
    id,
    ...props
  },
  ref,
) {
  const inputId =
    id || props.name || `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3",
          "text-sm text-zinc-950 placeholder:text-zinc-400",
          "transition duration-200",
          "border-zinc-200 hover:border-zinc-300",
          "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
          "dark:hover:border-zinc-600",
          error &&
            "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />

      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
});