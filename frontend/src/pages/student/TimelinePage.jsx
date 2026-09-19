import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Layers3,
  TrendingUp,
} from "lucide-react";

import { api } from "../../api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function getSemesterLabel(semester) {
  if (!semester) return "Semester";

  const value = String(semester);

  if (value.includes("-S1")) {
    return value.replace("-S1", " · Semester 1");
  }

  if (value.includes("-S2")) {
    return value.replace("-S2", " · Semester 2");
  }

  return value;
}

function getStatusConfig(status) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        badge: "success",
        dot: "bg-emerald-500",
        iconStyle:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };

    case "has_failed":
      return {
        label: "Needs attention",
        icon: AlertTriangle,
        badge: "danger",
        dot: "bg-red-500",
        iconStyle:
          "bg-red-500/10 text-red-600 dark:text-red-400",
      };

    default:
      return {
        label: "In progress",
        icon: Clock3,
        badge: "warning",
        dot: "bg-amber-500",
        iconStyle:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
  }
}

function getModuleStatus(status) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };

    case "failed":
      return {
        label: "Failed",
        className:
          "bg-red-500/10 text-red-700 dark:text-red-400",
      };

    case "in-progress":
      return {
        label: "In progress",
        className:
          "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };

    case "planned":
      return {
        label: "Planned",
        className:
          "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      };

    default:
      return {
        label: status || "Unknown",
        className:
          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      };
  }
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          {helper && (
            <p className="mt-1 text-xs text-zinc-400">
              {helper}
            </p>
          )}
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function ModuleRow({ item, onModuleClick }) {
  const module = item.module || {};
  const status = getModuleStatus(item.status);

  return (
    <button
      type="button"
      onClick={() => onModuleClick?.(module.code)}
      className="group flex w-full flex-col gap-4 px-4 py-4 text-left transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:px-5 dark:hover:bg-zinc-900/60"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <BookOpen className="size-4" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
              {module.code}
            </p>

            {module.level != null && (
              <span className="text-[10px] font-medium text-zinc-400">
                Level {module.level}
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {module.name}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-5 pl-12 sm:justify-end sm:pl-0">
        <div className="hidden text-right md:block">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">
            Credits
          </p>

          <p className="mt-0.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {module.credits ?? "—"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">
            Grade
          </p>

          <p
            className={`mt-0.5 text-sm font-bold ${
              item.grade != null
                ? item.grade >= 50
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
                : "text-zinc-400"
            }`}
          >
            {item.grade != null
              ? `${Number(item.grade).toFixed(0)}%`
              : "—"}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </button>
  );
}

function SemesterCard({
  semester,
  index,
  isOpen,
  onToggle,
  onModuleClick,
  isLast,
}) {
  const status = getStatusConfig(semester.status);
  const StatusIcon = status.icon;

  return (
    <motion.div
      variants={fadeUp}
      className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-4"
    >
      <div className="relative flex justify-center">
        {!isLast && (
          <div className="absolute bottom-[-24px] top-10 w-px bg-zinc-200 dark:bg-zinc-800" />
        )}

        <div
          className={`relative z-10 mt-5 flex size-8 items-center justify-center rounded-full border-4 border-zinc-50 sm:size-9 dark:border-zinc-950 ${status.dot}`}
        >
          <StatusIcon className="size-3.5 text-white sm:size-4" />
        </div>
      </div>

      <Card className="mb-6 overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col gap-5 p-5 text-left transition hover:bg-zinc-50/60 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:hover:bg-zinc-900/30"
        >
          <div className="flex items-start gap-3">
            <div
              className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${status.iconStyle}`}
            >
              <CalendarDays className="size-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {getSemesterLabel(semester.semester)}
                </h2>

                <Badge variant={status.badge}>
                  {status.label}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                {semester.module_count ??
                  semester.modules?.length ??
                  0}{" "}
                modules recorded
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                Credits
              </p>

              <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">
                {semester.credits_completed ?? 0}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                Average
              </p>

              <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">
                {semester.average != null
                  ? `${Number(semester.average).toFixed(1)}%`
                  : "—"}
              </p>
            </div>

            <div
              className={`flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-transform dark:bg-zinc-800 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="size-4" />
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-100 dark:border-zinc-800">
                {semester.modules?.length > 0 ? (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {semester.modules.map((item) => (
                      <ModuleRow
                        key={item.id}
                        item={item}
                        onModuleClick={onModuleClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-zinc-500">
                    No modules recorded for this semester.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function TimelinePage({
  onModuleClick,
}) {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSemesters, setOpenSemesters] =
    useState({});

  useEffect(() => {
    let active = true;

    async function loadTimeline() {
      try {
        setLoading(true);
        setError("");

        const data = await api.getSemesters();

        if (!active) return;

        const result = Array.isArray(data)
          ? data
          : [];

        setSemesters(result);

        if (result.length > 0) {
          const latest =
            result[result.length - 1];

          setOpenSemesters({
            [latest.semester]: true,
          });
        }
      } catch (err) {
        if (!active) return;

        setError(
          err?.message ||
            "Unable to load academic timeline.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTimeline();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    let totalModules = 0;
    let totalCredits = 0;
    let completedModules = 0;
    const grades = [];

    semesters.forEach((semester) => {
      totalCredits += Number(
        semester.credits_completed || 0,
      );

      const modules = Array.isArray(
        semester.modules,
      )
        ? semester.modules
        : [];

      totalModules += modules.length;

      modules.forEach((item) => {
        if (item.status === "completed") {
          completedModules += 1;
        }

        if (item.grade != null) {
          grades.push(Number(item.grade));
        }
      });
    });

    const overallAverage =
      grades.length > 0
        ? grades.reduce(
            (sum, grade) => sum + grade,
            0,
          ) / grades.length
        : null;

    return {
      totalModules,
      totalCredits,
      completedModules,
      overallAverage,
    };
  }, [semesters]);

  function toggleSemester(semester) {
    setOpenSemesters((current) => ({
      ...current,
      [semester]: !current[semester],
    }));
  }

  function expandAll() {
    const expanded = {};

    semesters.forEach((semester) => {
      expanded[semester.semester] = true;
    });

    setOpenSemesters(expanded);
  }

  function collapseAll() {
    setOpenSemesters({});
  }

  const allExpanded =
    semesters.length > 0 &&
    semesters.every(
      (semester) =>
        openSemesters[semester.semester],
    );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-white">
              Unable to load timeline
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {error}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
      className="space-y-6"
    >
      {/* Page Heading */}

      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <Badge variant="primary">
            <CalendarDays className="size-3.5" />
            Academic journey
          </Badge>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            Academic timeline
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Follow your academic journey semester by
            semester and review the modules, grades and
            credits you earned along the way.
          </p>
        </div>

        {semesters.length > 1 && (
          <button
            type="button"
            onClick={
              allExpanded
                ? collapseAll
                : expandAll
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Layers3 className="size-4" />

            {allExpanded
              ? "Collapse all"
              : "Expand all"}
          </button>
        )}
      </motion.div>

      {/* Statistics */}

      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={CalendarDays}
          label="Semesters"
          value={semesters.length}
          helper="Recorded semesters"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedModules}
          helper={`${stats.totalModules} modules recorded`}
        />

        <StatCard
          icon={GraduationCap}
          label="Credits earned"
          value={stats.totalCredits}
          helper="Completed credits"
        />

        <StatCard
          icon={TrendingUp}
          label="Average mark"
          value={
            stats.overallAverage != null
              ? `${stats.overallAverage.toFixed(1)}%`
              : "—"
          }
          helper="Across graded modules"
        />
      </motion.div>

      {/* Timeline */}

      <motion.div variants={fadeUp}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Semester history
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Select a semester to view its modules.
            </p>
          </div>
        </div>

        {semesters.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Award className="size-6" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
              Your timeline is empty
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              Your academic semesters will appear here
              once module enrolments are recorded.
            </p>
          </Card>
        ) : (
          <div>
            {semesters.map(
              (semester, index) => (
                <SemesterCard
                  key={semester.semester}
                  semester={semester}
                  index={index}
                  isOpen={
                    !!openSemesters[
                      semester.semester
                    ]
                  }
                  onToggle={() =>
                    toggleSemester(
                      semester.semester,
                    )
                  }
                  onModuleClick={
                    onModuleClick
                  }
                  isLast={
                    index ===
                    semesters.length - 1
                  }
                />
              ),
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}