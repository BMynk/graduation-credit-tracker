import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock3,
  GraduationCap,
  Layers3,
  ListChecks,
  LockKeyhole,
  Route,
  Sparkles,
} from "lucide-react";

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getModuleYear(module) {
  return toNumber(
    module?.year ?? module?.curriculum_year,
  );
}

function getModuleSemester(module) {
  return toNumber(
    module?.semester ?? module?.curriculum_semester,
  );
}

function yearStatus(year, currentYear) {
  if (year < currentYear) return "previous";
  if (year === currentYear) return "current";
  return "future";
}

function statusLabel(status) {
  if (status === "previous") return "Previous year";
  if (status === "current") return "Current year";
  return "Future";
}

function sortModules(modules = []) {
  return [...modules].sort((a, b) => {
    const semesterA =
      getModuleSemester(a) ?? 99;

    const semesterB =
      getModuleSemester(b) ?? 99;

    if (semesterA !== semesterB) {
      return semesterA - semesterB;
    }

    return String(a?.code || "").localeCompare(
      String(b?.code || ""),
    );
  });
}

function groupMissingByYear(modules = []) {
  const grouped = {};

  for (const module of modules) {
    const year = getModuleYear(module);
    const semester = getModuleSemester(module);

    if (!year) continue;

    if (!grouped[year]) {
      grouped[year] = {};
    }

    const semesterKey = semester || "other";

    if (!grouped[year][semesterKey]) {
      grouped[year][semesterKey] = [];
    }

    grouped[year][semesterKey].push(module);
  }

  return grouped;
}

function flattenCurriculum(curriculum = {}) {
  const modules = [];

  Object.entries(curriculum || {}).forEach(
    ([yearKey, semesters]) => {
      Object.entries(semesters || {}).forEach(
        ([semesterKey, semesterModules]) => {
          for (const module of semesterModules || []) {
            modules.push({
              ...module,
              year:
                getModuleYear(module) ??
                toNumber(yearKey),
              semester:
                getModuleSemester(module) ??
                toNumber(semesterKey),
            });
          }
        },
      );
    },
  );

  return modules;
}

// ---------------------------------------------------------
// Requirement Card
// ---------------------------------------------------------

function RequirementCard({
  title,
  requirement,
  icon: Icon,
  tone = "blue",
}) {
  const data = requirement || {};

  const completed = Number(data.completed || 0);
  const total = Number(data.total || 0);
  const percentage = Number(data.percentage || 0);

  const tones = {
    blue:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Degree requirement
          </p>
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <span className="tabular-nums text-3xl font-bold text-zinc-950 dark:text-white">
            {completed}
          </span>

          <span className="ml-1 text-sm text-zinc-500">
            / {total}
          </span>
        </div>

        <span className="tabular-nums text-sm font-semibold text-brand-600 dark:text-brand-400">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="mt-4">
        <Progress value={percentage} />
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {Math.max(total - completed, 0)} remaining
      </p>
    </Card>
  );
}

// ---------------------------------------------------------
// Mini Statistic
// ---------------------------------------------------------

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="size-4" />

        <span className="text-xs">{label}</span>
      </div>

      <p className="mt-2 tabular-nums text-xl font-semibold text-zinc-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------
// Roadmap Module
// ---------------------------------------------------------

function RoadmapModule({
  module,
  status,
  onModuleClick,
}) {
  const completed = Boolean(module.is_completed);
  const compulsory =
    module.is_compulsory !== false;

  return (
    <button
      type="button"
      onClick={() =>
        onModuleClick?.(module.code)
      }
      className={`group flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        completed
          ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]"
          : status === "previous"
            ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 dark:border-amber-500/20 dark:bg-amber-500/[0.05]"
            : status === "current"
              ? "border-brand-200 bg-brand-50/40 hover:border-brand-300 dark:border-brand-500/20 dark:bg-brand-500/[0.05]"
              : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40"
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          completed
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : status === "previous"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : status === "current"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                : "bg-zinc-200/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="size-4" />
        ) : status === "future" ? (
          <LockKeyhole className="size-4" />
        ) : compulsory ? (
          <BookOpen className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`font-mono text-xs font-bold ${
              completed
                ? "text-emerald-600 dark:text-emerald-400"
                : status === "previous"
                  ? "text-amber-700 dark:text-amber-400"
                  : status === "current"
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {module.code}
          </p>

          {!compulsory && (
            <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Elective
            </span>
          )}

          {completed && (
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Completed
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {module.name}
        </p>

        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-400">
          {module.credits != null && (
            <span>{module.credits} credits</span>
          )}

          {module.category && (
            <span>{module.category}</span>
          )}
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-zinc-600" />
    </button>
  );
}

// ---------------------------------------------------------
// Semester Section
// ---------------------------------------------------------

function SemesterSection({
  semester,
  modules,
  status,
  onModuleClick,
}) {
  const completedCount = modules.filter(
    (module) => module.is_completed,
  ).length;

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            {semester === "other"
              ? "Other"
              : `Semester ${semester}`}
          </p>

          <p className="mt-0.5 text-[11px] text-zinc-500">
            {completedCount} of {modules.length} completed
          </p>
        </div>

        <span className="text-xs font-medium text-zinc-400">
          {modules.length}{" "}
          {modules.length === 1
            ? "module"
            : "modules"}
        </span>
      </div>

      <div className="space-y-2">
        {sortModules(modules).map((module) => (
          <RoadmapModule
            key={module.code}
            module={module}
            status={status}
            onModuleClick={onModuleClick}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Curriculum Year
// ---------------------------------------------------------

function CurriculumYear({
  year,
  semesters,
  currentYear,
  onModuleClick,
  defaultOpen = false,
}) {
  const status = yearStatus(year, currentYear);

  const [open, setOpen] = useState(
    defaultOpen || status === "current",
  );

  const modules = Object.values(
    semesters || {},
  ).flat();

  const completed = modules.filter(
    (module) => module.is_completed,
  ).length;

  const outstanding =
    modules.length - completed;

  const statusStyles = {
    previous: {
      icon:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      border:
        "border-amber-200/70 dark:border-amber-500/20",
      badge: "warning",
    },
    current: {
      icon:
        "bg-brand-500/10 text-brand-600 dark:text-brand-400",
      border:
        "border-brand-200/80 dark:border-brand-500/25",
      badge: "primary",
    },
    future: {
      icon:
        "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      border:
        "border-zinc-200 dark:border-zinc-800",
      badge: "neutral",
    },
  };

  const styles = statusStyles[status];

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900/40 ${styles.border}`}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
      >
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {status === "future" ? (
            <LockKeyhole className="size-5" />
          ) : (
            <GraduationCap className="size-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
              Year {year}
            </h3>

            <Badge variant={styles.badge}>
              {statusLabel(status)}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            {completed} completed
            <span className="mx-1.5">•</span>
            {outstanding} outstanding
            <span className="mx-1.5">•</span>
            {modules.length} total
          </p>
        </div>

        {open ? (
          <ChevronUp className="size-5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-100 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/20 sm:p-5">
          {status === "previous" &&
            outstanding > 0 && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.06]">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

                <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
                  You still have {outstanding}{" "}
                  outstanding{" "}
                  {outstanding === 1
                    ? "requirement"
                    : "requirements"}{" "}
                  from Year {year}. These remain part
                  of your graduation pathway.
                </p>
              </div>
            )}

          {status === "current" && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3.5 py-3 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
              <Route className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" />

              <p className="text-xs leading-5 text-brand-800 dark:text-brand-300">
                This is your current curriculum year.
                Prioritise these requirements together
                with any outstanding modules from
                previous years.
              </p>
            </div>
          )}

          {status === "future" && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-zinc-400" />

              <p className="text-xs leading-5 text-zinc-500">
                These modules belong to a future
                curriculum year. They are shown here
                so you can see what comes next.
              </p>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {Object.entries(semesters || {})
              .sort(([a], [b]) => {
                if (a === "other") return 1;
                if (b === "other") return -1;

                return Number(a) - Number(b);
              })
              .map(
                ([
                  semester,
                  semesterModules,
                ]) => (
                  <SemesterSection
                    key={semester}
                    semester={semester}
                    modules={semesterModules}
                    status={status}
                    onModuleClick={
                      onModuleClick
                    }
                  />
                ),
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Outstanding Module
// ---------------------------------------------------------

function OutstandingModule({
  module,
  currentYear,
  onModuleClick,
}) {
  const year = getModuleYear(module);
  const semester = getModuleSemester(module);

  const status = year
    ? yearStatus(year, currentYear)
    : "current";

  const elective =
    module.is_compulsory === false;

  return (
    <button
      type="button"
      onClick={() =>
        onModuleClick?.(module.code)
      }
      className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-left transition hover:border-brand-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-brand-500/40"
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          status === "previous"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : status === "future"
              ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              : elective
                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
        }`}
      >
        {status === "future" ? (
          <LockKeyhole className="size-4" />
        ) : elective ? (
          <Sparkles className="size-4" />
        ) : (
          <BookOpen className="size-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {module.code}
          </p>

          {status === "previous" && (
            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Carry-over
            </span>
          )}

          {status === "future" && (
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Future
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {module.name}
        </p>

        <p className="mt-1 text-[10px] text-zinc-400">
          {year ? `Year ${year}` : "Year —"}
          {semester
            ? ` • Semester ${semester}`
            : ""}
          {module.credits != null
            ? ` • ${module.credits} credits`
            : ""}
        </p>
      </div>

      <ArrowRight className="size-3.5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-zinc-600" />
    </button>
  );
}

// ---------------------------------------------------------
// Insight Row
// ---------------------------------------------------------

function InsightRow({ insight }) {
  const config = {
    carryover: {
      icon: CircleAlert,
      label: "Carry-over priority",
      iconStyle:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    current: {
      icon: Route,
      label: "Current-year priority",
      iconStyle:
        "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    },
    prerequisite: {
      icon: AlertTriangle,
      label: "Prerequisite",
      iconStyle:
        "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    future: {
      icon: LockKeyhole,
      label: "Future roadmap",
      iconStyle:
        "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    },
    urgent: {
      icon: CircleAlert,
      label: "Attention",
      iconStyle:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    info: {
      icon: ArrowRight,
      label: "Planning note",
      iconStyle:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
  };

  const item =
    config[insight.type] || config.info;

  const Icon = item.icon;

  return (
    <div className="flex items-start gap-3 px-1 py-3.5">
      <div
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${item.iconStyle}`}
      >
        <Icon className="size-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            {item.label}
          </p>

          {insight.year && (
            <span className="text-[10px] font-medium text-zinc-400">
              Year {insight.year}
              {insight.semester
                ? ` • Semester ${insight.semester}`
                : ""}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
          {insight.text}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Eligible Module Card
// ---------------------------------------------------------

function EligibleModule({
  module,
  onModuleClick,
}) {
  return (
    <motion.button
      type="button"
      onClick={() =>
        onModuleClick?.(module.code)
      }
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="group rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-brand-500/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <BookOpen className="size-5" />
        </div>

        <ArrowRight className="size-4 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-brand-500 dark:text-zinc-600" />
      </div>

      <p className="mt-5 font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
        {module.code}
      </p>

      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-950 dark:text-white">
        {module.name}
      </h3>

      <div className="mt-5 flex flex-wrap gap-2">
        {module.credits != null && (
          <Badge variant="neutral">
            {module.credits} credits
          </Badge>
        )}

        {module.level != null && (
          <Badge variant="neutral">
            Level {module.level}
          </Badge>
        )}

        {module.category && (
          <Badge variant="primary">
            {module.category}
          </Badge>
        )}
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          Prerequisites satisfied
        </div>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------
// Main Planning Page
// ---------------------------------------------------------

export default function PlanningPage({
  audit,
  eligible = [],
  onModuleClick,
  onNavigate,
}) {
  const [showAllInsights, setShowAllInsights] =
    useState(false);

  const [showFullRoadmap, setShowFullRoadmap] =
    useState(false);

  if (!audit) {
    return (
      <Card className="p-8">
        <p className="text-sm text-zinc-500">
          Graduation planning information is not
          available.
        </p>
      </Card>
    );
  }

  const requirements =
    audit.requirements_breakdown || {};

  const compulsory =
    requirements.compulsory || {};

  const elective =
    requirements.elective || {};

  const compulsoryMissing = Array.isArray(
    compulsory.missing_modules,
  )
    ? compulsory.missing_modules
    : [];

  const electiveMissing = Array.isArray(
    elective.missing_modules,
  )
    ? elective.missing_modules
    : [];

  const allMissing = useMemo(
    () => [
      ...compulsoryMissing.map((module) => ({
        ...module,
        is_compulsory: true,
      })),
      ...electiveMissing.map((module) => ({
        ...module,
        is_compulsory: false,
      })),
    ],
    [compulsoryMissing, electiveMissing],
  );

  const currentYear =
    toNumber(audit?.summary?.current_year, 1) || 1;

  const curriculum = audit.curriculum_by_year || {};

  const curriculumModules = useMemo(
    () => flattenCurriculum(curriculum),
    [curriculum],
  );

  const roadmap = useMemo(() => {
    const grouped = {};

    for (const module of curriculumModules) {
      const year = getModuleYear(module);
      const semester =
        getModuleSemester(module) || "other";

      if (!year) continue;

      if (!grouped[year]) {
        grouped[year] = {};
      }

      if (!grouped[year][semester]) {
        grouped[year][semester] = [];
      }

      grouped[year][semester].push(module);
    }

    return grouped;
  }, [curriculumModules]);

  const groupedOutstanding = useMemo(
    () => groupMissingByYear(allMissing),
    [allMissing],
  );

  const previousOutstanding =
    allMissing.filter((module) => {
      const year = getModuleYear(module);

      return year && year < currentYear;
    });

  const currentOutstanding =
    allMissing.filter((module) => {
      const year = getModuleYear(module);

      return year === currentYear;
    });

  const futureOutstanding =
    allMissing.filter((module) => {
      const year = getModuleYear(module);

      return year && year > currentYear;
    });

  const warnings = Array.isArray(
    audit.prerequisite_warnings,
  )
    ? audit.prerequisite_warnings
    : [];

  const urgentItems = Array.isArray(
    audit.urgent_items,
  )
    ? audit.urgent_items
    : [];

  const reasons = Array.isArray(audit.reasons)
    ? audit.reasons
    : [];

  const insights = useMemo(() => {
    const result = [];

    if (previousOutstanding.length > 0) {
      result.push({
        type: "carryover",
        text: `You have ${previousOutstanding.length} outstanding ${
          previousOutstanding.length === 1
            ? "module"
            : "modules"
        } from previous curriculum years. Consider these alongside your current-year requirements.`,
      });
    }

    if (currentOutstanding.length > 0) {
      result.push({
        type: "current",
        year: currentYear,
        text: `${currentOutstanding.length} ${
          currentOutstanding.length === 1
            ? "requirement remains"
            : "requirements remain"
        } in your current curriculum year.`,
      });
    }

    warnings.forEach((warning) => {
      result.push({
        type: "prerequisite",
        year: warning.year,
        semester: warning.semester,
        text: `${warning.module} requires ${warning.missing_prereq}.`,
      });
    });

    urgentItems.forEach((text) => {
      result.push({
        type: "urgent",
        text,
      });
    });

    reasons.forEach((text) => {
      result.push({
        type: "info",
        text,
      });
    });

    if (futureOutstanding.length > 0) {
      const nextFutureYear =
        Math.min(
          ...futureOutstanding
            .map(getModuleYear)
            .filter(Boolean),
        );

      result.push({
        type: "future",
        year: nextFutureYear,
        text: `${futureOutstanding.length} future ${
          futureOutstanding.length === 1
            ? "requirement is"
            : "requirements are"
        } visible in your roadmap. These are shown for planning ahead rather than as current priorities.`,
      });
    }

    return result;
  }, [
    previousOutstanding,
    currentOutstanding,
    futureOutstanding,
    warnings,
    urgentItems,
    reasons,
    currentYear,
  ]);

  const visibleInsights =
    showAllInsights
      ? insights
      : insights.slice(0, 5);

  const semesters =
    audit.projected_semesters_remaining;

  const averageCredits =
    audit.average_credits_per_semester;

  const roadmapYears = Object.keys(roadmap)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const visibleRoadmapYears =
    showFullRoadmap
      ? roadmapYears
      : roadmapYears.filter(
          (year) => year <= currentYear + 1,
        );

  const attentionTitle =
    previousOutstanding.length > 0
      ? `${previousOutstanding.length} carry-over ${
          previousOutstanding.length === 1
            ? "requirement"
            : "requirements"
        } to prioritise`
      : currentOutstanding.length > 0
        ? `${currentOutstanding.length} current-year ${
            currentOutstanding.length === 1
              ? "requirement remains"
              : "requirements remain"
          }`
        : audit.on_track
          ? "You're on track"
          : "Review your remaining requirements";

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
      className="space-y-7"
    >
      {/* PAGE HEADING */}

      <motion.div variants={fadeUp}>
        <Badge variant="primary">
          <Route className="size-3.5" />
          Graduation planning
        </Badge>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Plan your path to graduation
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          See where you are in your curriculum,
          identify outstanding requirements and
          understand what comes next.
        </p>
      </motion.div>

      {/* GRADUATION STATUS */}

      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden">
          <div
            className={`border-b px-5 py-6 sm:px-6 ${
              audit.on_track &&
              previousOutstanding.length === 0
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]"
                : "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/[0.07]"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                    audit.on_track &&
                    previousOutstanding.length === 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {audit.on_track &&
                  previousOutstanding.length ===
                    0 ? (
                    <CheckCircle2 className="size-6" />
                  ) : (
                    <AlertTriangle className="size-6" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    Graduation audit
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
                    {attentionTitle}
                  </h2>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    You are currently in Year{" "}
                    {currentYear}. Your roadmap below
                    separates previous requirements,
                    your current curriculum year and
                    future study.
                  </p>
                </div>
              </div>

              <Badge
                variant={
                  audit.on_track &&
                  previousOutstanding.length === 0
                    ? "success"
                    : "warning"
                }
              >
                Year {currentYear}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
            <MiniStat
              icon={CalendarClock}
              label="Projected time"
              value={
                semesters != null
                  ? `${semesters} semester${
                      Number(semesters) === 1
                        ? ""
                        : "s"
                    }`
                  : "—"
              }
            />

            <MiniStat
              icon={BookOpen}
              label="Average credits / semester"
              value={
                averageCredits != null
                  ? Number(
                      averageCredits,
                    ).toFixed(0)
                  : "—"
              }
            />

            <MiniStat
              icon={Clock3}
              label="Modules in progress"
              value={
                audit.in_progress_modules ?? 0
              }
            />
          </div>
        </Card>
      </motion.div>

      {/* DEGREE REQUIREMENTS */}

      <motion.div variants={fadeUp}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Degree requirements
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your completion across compulsory and
            elective requirements.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <RequirementCard
            title="Compulsory modules"
            requirement={compulsory}
            icon={GraduationCap}
          />

          <RequirementCard
            title="Elective modules"
            requirement={elective}
            icon={Sparkles}
            tone="violet"
          />
        </div>
      </motion.div>

      {/* OUTSTANDING REQUIREMENTS */}

      {allMissing.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ListChecks className="size-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                    Outstanding requirements
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Remaining requirements grouped by
                    their curriculum year and semester.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {previousOutstanding.length >
                  0 && (
                  <Badge variant="warning">
                    {previousOutstanding.length}{" "}
                    carry-over
                  </Badge>
                )}

                <Badge variant="neutral">
                  {allMissing.length} remaining
                </Badge>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {Object.entries(
                groupedOutstanding,
              )
                .sort(
                  ([yearA], [yearB]) =>
                    Number(yearA) -
                    Number(yearB),
                )
                .map(
                  ([yearKey, semesterGroups]) => {
                    const year =
                      Number(yearKey);

                    const status =
                      yearStatus(
                        year,
                        currentYear,
                      );

                    const modules =
                      Object.values(
                        semesterGroups,
                      ).flat();

                    return (
                      <div
                        key={year}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/20"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                              Year {year}
                            </h3>

                            <Badge
                              variant={
                                status ===
                                "previous"
                                  ? "warning"
                                  : status ===
                                      "current"
                                    ? "primary"
                                    : "neutral"
                              }
                            >
                              {statusLabel(
                                status,
                              )}
                            </Badge>
                          </div>

                          <span className="text-xs font-medium text-zinc-400">
                            {modules.length}{" "}
                            outstanding
                          </span>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          {Object.entries(
                            semesterGroups,
                          )
                            .sort(
                              ([a], [b]) => {
                                if (
                                  a === "other"
                                )
                                  return 1;

                                if (
                                  b === "other"
                                )
                                  return -1;

                                return (
                                  Number(a) -
                                  Number(b)
                                );
                              },
                            )
                            .map(
                              ([
                                semester,
                                semesterModules,
                              ]) => (
                                <div
                                  key={
                                    semester
                                  }
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                      {semester ===
                                      "other"
                                        ? "Other requirements"
                                        : `Semester ${semester}`}
                                    </p>

                                    <span className="text-[10px] text-zinc-400">
                                      {
                                        semesterModules.length
                                      }{" "}
                                      modules
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {sortModules(
                                      semesterModules,
                                    ).map(
                                      (
                                        module,
                                      ) => (
                                        <OutstandingModule
                                          key={
                                            module.code
                                          }
                                          module={
                                            module
                                          }
                                          currentYear={
                                            currentYear
                                          }
                                          onModuleClick={
                                            onModuleClick
                                          }
                                        />
                                      ),
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                        </div>
                      </div>
                    );
                  },
                )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* PLANNING INSIGHTS */}

      {insights.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <CircleAlert className="size-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                    Planning insights
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Priorities and blockers based on
                    your academic progress.
                  </p>
                </div>
              </div>

              <Badge variant="neutral">
                {insights.length}{" "}
                {insights.length === 1
                  ? "insight"
                  : "insights"}
              </Badge>
            </div>

            <div className="p-4 sm:p-5">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {visibleInsights.map(
                  (insight, index) => (
                    <InsightRow
                      key={`${insight.type}-${index}`}
                      insight={insight}
                    />
                  ),
                )}
              </div>

              {insights.length > 5 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllInsights(
                      (current) =>
                        !current,
                    )
                  }
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {showAllInsights ? (
                    <>
                      <ChevronUp className="size-4" />
                      Show fewer insights
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" />
                      View all{" "}
                      {insights.length} insights
                    </>
                  )}
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* CURRICULUM ROADMAP */}

      {roadmapYears.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                Curriculum roadmap
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                Your programme arranged by year and
                semester. Completed modules remain
                visible so you can see your full path
                through the degree.
              </p>
            </div>

            <Badge variant="primary">
              Current: Year {currentYear}
            </Badge>
          </div>

          <div className="space-y-3">
            {visibleRoadmapYears.map(
              (year) => (
                <CurriculumYear
                  key={year}
                  year={year}
                  semesters={roadmap[year]}
                  currentYear={currentYear}
                  onModuleClick={
                    onModuleClick
                  }
                  defaultOpen={
                    year === currentYear ||
                    (year <
                      currentYear &&
                      allMissing.some(
                        (module) =>
                          getModuleYear(
                            module,
                          ) === year,
                      ))
                  }
                />
              ),
            )}
          </div>

          {roadmapYears.length >
            visibleRoadmapYears.length && (
            <button
              type="button"
              onClick={() =>
                setShowFullRoadmap(true)
              }
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <ChevronDown className="size-4" />
              Show full curriculum roadmap
            </button>
          )}

          {showFullRoadmap &&
            roadmapYears.some(
              (year) =>
                year > currentYear + 1,
            ) && (
              <button
                type="button"
                onClick={() =>
                  setShowFullRoadmap(false)
                }
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <ChevronUp className="size-4" />
                Show less
              </button>
            )}
        </motion.div>
      )}

      {/* ELIGIBLE MODULES */}

      <motion.div variants={fadeUp}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Eligible modules
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Modules whose prerequisites you
              currently meet. Use the semester
              planner to build an actual plan.
            </p>
          </div>

          <Badge variant="neutral">
            {eligible.length} available
          </Badge>
        </div>

        {eligible.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Layers3 className="size-6" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
              No eligible modules
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              No additional modules are currently
              available based on your completed
              prerequisites.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eligible.map(
              (module, index) => (
                <EligibleModule
                  key={
                    module.code ||
                    module.id ||
                    index
                  }
                  module={module}
                  onModuleClick={
                    onModuleClick
                  }
                />
              ),
            )}
          </div>
        )}

        <Card className="mt-5 overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                Ready to build your semester?
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Planning shows the roadmap. The
                semester planner lets you select
                modules, check the workload and save
                your plan.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("planner")
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Open semester planner
              <ArrowRight className="size-4" />
            </button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}