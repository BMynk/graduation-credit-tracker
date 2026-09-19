import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection,
  className,
}) {
  const positive = trendDirection === "up";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          "h-full p-5 transition-shadow duration-200 hover:shadow-md",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {title}
            </p>

            <p className="tabular-nums mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {value}
            </p>
          </div>

          {Icon && (
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              <Icon className="size-5" aria-hidden="true" />
            </div>
          )}
        </div>

        {(description || trend) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  positive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}

                {trend}
              </span>
            )}

            {description && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {description}
              </span>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}