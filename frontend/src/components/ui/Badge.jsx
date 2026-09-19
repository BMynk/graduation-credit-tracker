import { cn } from "../../lib/utils";

const variants = {
  neutral:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",

  primary:
    "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",

  success:
    "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",

  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

  danger:
    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
        "text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}