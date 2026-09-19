import {
  Bell,
  Search,
  Menu,
  Command,
} from "lucide-react";

export default function StudentHeader({
  student,
  onOpenMobileMenu,
}) {
  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex size-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:block">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Student Dashboard
            </p>

            <p className="text-xs text-zinc-500">
              Track your academic progress
            </p>
          </div>
        </div>

        {/* Search */}
        <button
          type="button"
          className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-left text-sm text-zinc-400 transition hover:border-zinc-300 hover:bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-900"
        >
          <Search size={16} />

          <span className="flex-1">
            Search modules...
          </span>

          <span className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
            <Command size={10} /> K
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={19} />

            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-brand-500 dark:border-zinc-950" />
          </button>

          <div className="hidden h-8 w-px bg-zinc-200 sm:block dark:bg-zinc-800" />

          <div className="hidden text-right sm:block">
            <p className="max-w-40 truncate text-xs font-semibold text-zinc-900 dark:text-white">
              {student?.name || "Student"}
            </p>

            <p className="text-[11px] text-zinc-500">
              Year {student?.current_year || "—"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}