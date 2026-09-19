import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function Progress({
  value = 0,
  className,
  indicatorClassName,
  label,
  showValue = false,
}) {
  const normalized = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </span>
          )}

          {showValue && (
            <span className="tabular-nums text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              {normalized.toFixed(0)}%
            </span>
          )}
        </div>
      )}

      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            "h-full rounded-full bg-brand-500",
            indicatorClassName,
          )}
        />
      </div>
    </div>
  );
}