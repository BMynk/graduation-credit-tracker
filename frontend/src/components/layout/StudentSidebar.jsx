import {
  LayoutDashboard,
  History,
  GraduationCap,
  CalendarDays,
  Calculator,
  BookOpenCheck,
  Trophy,
  Users,
  ChartNoAxesColumnIncreasing,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  MessagesSquare,
} from "lucide-react";

import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";

const navigation = [
  {
    label: "Overview",
    items: [
      {
        id: "summary",
        label: "Summary",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Academics",
    items: [
      {
        id: "history",
        label: "History",
        icon: History,
      },
      {
        id: "planning",
        label: "Planning",
        icon: GraduationCap,
      },
      {
        id: "timeline",
        label: "Timeline",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        id: "predictor",
        label: "Predictor",
        icon: Calculator,
      },
      {
        id: "planner",
        label: "Planner",
        icon: BookOpenCheck,
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        id: "community",
        label: "Community",
        icon: MessagesSquare,
      },
    ],
  },
  {
    label: "Progress",
    items: [
      {
        id: "achievements",
        label: "Achievements",
        icon: Trophy,
      },
      {
        id: "peers",
        label: "Peers",
        icon: Users,
      },
      {
        id: "yearly",
        label: "Yearly",
        icon: ChartNoAxesColumnIncreasing,
      },
    ],
  },
];

export default function StudentSidebar({
  activeTab,
  onTabChange,
  student,
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) {
  const { theme, toggleTheme } = useTheme();

  const initials =
    student?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out lg:flex lg:flex-col dark:border-zinc-800 dark:bg-zinc-950 ${
        collapsed ? "w-[80px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div
        className={`relative flex h-[72px] shrink-0 items-center border-b border-zinc-100 dark:border-zinc-800 ${
          collapsed ? "justify-center px-3" : "px-6"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <GraduationCap
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              collapsed
                ? "w-0 opacity-0"
                : "w-[145px] opacity-100"
            }`}
          >
            <p className="whitespace-nowrap text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Graduation
            </p>

            <p className="-mt-0.5 whitespace-nowrap text-sm font-bold tracking-tight text-brand-500">
              Credit Tracker
            </p>
          </div>
        </div>
      </div>

      {/* Collapse button */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
        aria-label={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
        className="absolute -right-3 top-[86px] z-50 flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-brand-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
      >
        {collapsed ? (
          <PanelLeftOpen size={14} />
        ) : (
          <PanelLeftClose size={14} />
        )}
      </button>

      {/* Navigation */}
      <nav
        className={`flex-1 overflow-x-hidden overflow-y-auto py-5 ${
          collapsed ? "px-2" : "px-3"
        }`}
        aria-label="Student navigation"
      >
        <div
          className={
            collapsed ? "space-y-4" : "space-y-6"
          }
        >
          {navigation.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </p>
              )}

              {collapsed && (
                <div className="mx-auto mb-2 h-px w-7 bg-zinc-100 first:hidden dark:bg-zinc-800" />
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onTabChange(item.id)
                      }
                      title={
                        collapsed
                          ? item.label
                          : undefined
                      }
                      aria-label={item.label}
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      className={`relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                        collapsed
                          ? "justify-center px-2"
                          : "gap-3 px-3"
                      } ${
                        active
                          ? "text-brand-700 dark:text-brand-300"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="student-sidebar-active"
                          className="absolute inset-0 rounded-lg bg-brand-50 dark:bg-brand-500/10"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35,
                          }}
                        />
                      )}

                      <Icon
                        className="relative z-10 size-[18px] shrink-0"
                        strokeWidth={
                          active ? 2.3 : 1.9
                        }
                        aria-hidden="true"
                      />

                      {!collapsed && (
                        <>
                          <span className="relative z-10 whitespace-nowrap">
                            {item.label}
                          </span>

                          {item.id ===
                            "achievements" && (
                            <Sparkles
                              className="relative z-10 ml-auto size-3.5 text-amber-500"
                              aria-hidden="true"
                            />
                          )}
                        </>
                      )}

                      {collapsed &&
                        item.id ===
                          "achievements" && (
                          <span className="absolute right-2 top-2 z-20 size-1.5 rounded-full bg-amber-500" />
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom controls */}
      <div
        className={`shrink-0 border-t border-zinc-100 dark:border-zinc-800 ${
          collapsed ? "p-2" : "p-3"
        }`}
      >
        {/* Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          title={
            collapsed
              ? theme === "dark"
                ? "Light mode"
                : "Dark mode"
              : undefined
          }
          className={`mb-2 flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white ${
            collapsed
              ? "justify-center px-2"
              : "gap-3 px-3"
          }`}
          aria-label={`Switch to ${
            theme === "dark"
              ? "light"
              : "dark"
          } mode`}
        >
          {theme === "dark" ? (
            <Sun className="size-[18px] shrink-0" />
          ) : (
            <Moon className="size-[18px] shrink-0" />
          )}

          {!collapsed && (
            <span className="whitespace-nowrap">
              {theme === "dark"
                ? "Light mode"
                : "Dark mode"}
            </span>
          )}
        </button>

        {/* Student */}
        {collapsed ? (
          <div className="space-y-2">
            <div
              title={`${student?.name || "Student"} — ${
                student?.student_number ||
                "Student account"
              }`}
              className="flex justify-center"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {initials}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="flex w-full items-center justify-center rounded-lg py-2.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <LogOut size={17} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5 dark:border-zinc-800">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white">
                {student?.name || "Student"}
              </p>

              <p className="truncate text-[11px] text-zinc-500">
                {student?.student_number ||
                  "Student account"}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}