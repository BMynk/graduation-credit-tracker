import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200/80",
        "bg-white shadow-card",
        "dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <h2
      className={cn(
        "text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function CardDescription({ className, children }) {
  return (
    <p
      className={cn(
        "mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children }) {
  return (
    <div className={cn("p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}