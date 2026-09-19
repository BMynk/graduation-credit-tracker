import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Download,
  Filter,
  GraduationCap,
  Search,
  Target,
  TrendingDown,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

function formatAverage(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
}

function StatCard({ icon: Icon, label, value, helper, tone = "red" }) {
  const tones = {
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  };

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {helper}
          </p>
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            tones[tone] || tones.red
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </motion.div>
  );
}

function RiskTypeBadge({ student }) {
  const blocking = Number(student.failed_blocking_count || 0);

  if (blocking > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        <AlertTriangle size={12} />
        {blocking} blocking {blocking === 1 ? "module" : "modules"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      <TrendingDown size={12} />
      Below target
    </span>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        <UserCheck size={25} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-zinc-950 dark:text-white">
        {filtered
          ? "No students match these filters"
          : "No students currently at risk"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        {filtered
          ? "Try changing or clearing the current filters."
          : "There are currently no students flagged by the academic risk criteria."}
      </p>
    </div>
  );
}

export default function AtRiskPage({
  students = [],
  onStudentClick,
  onExport,
}) {
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [search, setSearch] = useState("");

  const programmeOptions = useMemo(
    () =>
      [...new Set(students.map((s) => s.programme_code))]
        .filter(Boolean)
        .sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      if (
        programmeFilter !== "all" &&
        student.programme_code !== programmeFilter
      ) {
        return false;
      }

      if (
        reasonFilter === "blocking" &&
        Number(student.failed_blocking_count || 0) === 0
      ) {
        return false;
      }

      if (
        reasonFilter === "average" &&
        Number(student.failed_blocking_count || 0) > 0
      ) {
        return false;
      }

      if (query) {
        const searchable = [
          student.name,
          student.student_number,
          student.programme_code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [students, programmeFilter, reasonFilter, search]);

  const blockingCount = students.filter(
    (student) => Number(student.failed_blocking_count || 0) > 0
  ).length;

  const belowTargetOnlyCount = students.filter(
    (student) => Number(student.failed_blocking_count || 0) === 0
  ).length;

  const averageGap = useMemo(() => {
    const gaps = students
      .filter(
        (student) =>
          student.weighted_average !== null &&
          student.weighted_average !== undefined &&
          student.target_average !== null &&
          student.target_average !== undefined
      )
      .map(
        (student) =>
          Number(student.target_average) -
          Number(student.weighted_average)
      );

    if (!gaps.length) return null;

    return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  }, [students]);

  const filtersActive =
    programmeFilter !== "all" ||
    reasonFilter !== "all" ||
    search.trim() !== "";

  function clearFilters() {
    setProgrammeFilter("all");
    setReasonFilter("all");
    setSearch("");
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className="space-y-6 pb-8"
    >
      {/* Hero */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-red-200/70 bg-gradient-to-br from-red-50 via-white to-amber-50 p-6 dark:border-red-950 dark:from-red-950/20 dark:via-zinc-950 dark:to-amber-950/20 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertTriangle size={14} />
              Academic Risk Monitoring
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              Students needing attention
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Identify students affected by academic performance
              concerns or failed modules that block programme
              progression.
            </p>
          </div>

          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => onExport?.(filtered)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="At-Risk Students"
          value={students.length}
          helper="Currently flagged"
          tone="red"
        />

        <StatCard
          icon={BookOpen}
          label="Blocking Modules"
          value={blockingCount}
          helper="Students with blocking failures"
          tone="amber"
        />

        <StatCard
          icon={Target}
          label="Below Target Only"
          value={belowTargetOnlyCount}
          helper="Without blocking failures"
          tone="blue"
        />

        <StatCard
          icon={TrendingDown}
          label="Average Gap"
          value={
            averageGap === null
              ? "—"
              : `${averageGap.toFixed(1)}%`
          }
          helper="Target minus current average"
          tone="violet"
        />
      </div>

      {/* Filters */}
      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Search students
            </label>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or student number..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[480px]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Programme
              </label>

              <select
                value={programmeFilter}
                onChange={(event) =>
                  setProgrammeFilter(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="all">All programmes</option>

                {programmeOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Risk reason
              </label>

              <select
                value={reasonFilter}
                onChange={(event) =>
                  setReasonFilter(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="all">All reasons</option>
                <option value="blocking">
                  Blocking programme progression
                </option>
                <option value="average">
                  Below target average only
                </option>
              </select>
            </div>
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <X size={15} />
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <Filter size={13} />

          <span>
            Showing{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
              {filtered.length}
            </strong>{" "}
            of {students.length} flagged students
          </span>
        </div>
      </motion.section>

      {/* Students */}
      <motion.section
        variants={fadeUp}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap
              size={18}
              className="text-red-500"
            />

            <h2 className="font-semibold text-zinc-950 dark:text-white">
              At-risk students
            </h2>

            {filtered.length > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {filtered.length}
              </span>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState filtered={filtersActive} />
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {filtered.map((student) => {
              const hasAverage =
                student.weighted_average !== null &&
                student.weighted_average !== undefined;

              const gap =
                hasAverage &&
                student.target_average !== null &&
                student.target_average !== undefined
                  ? Number(student.target_average) -
                    Number(student.weighted_average)
                  : null;

              return (
                <button
                  type="button"
                  key={student.id}
                  onClick={() => onStudentClick?.(student)}
                  className="group w-full px-5 py-5 text-left transition hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 sm:px-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        {student.name
                          ?.trim()
                          ?.charAt(0)
                          ?.toUpperCase() || "S"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                          {student.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {student.student_number} ·{" "}
                          {student.programme_code}
                        </p>

                        <div className="mt-2">
                          <RiskTypeBadge student={student} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 sm:gap-8">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                          Average
                        </p>

                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatAverage(
                            student.weighted_average
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                          Target
                        </p>

                        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatAverage(
                            student.target_average
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                          Gap
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${
                            gap !== null && gap > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {gap === null
                            ? "—"
                            : `${gap.toFixed(1)}%`}
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      size={18}
                      className="hidden shrink-0 text-zinc-400 transition-transform group-hover:translate-x-1 lg:block"
                    />
                  </div>

                  {Array.isArray(student.reasons) &&
                    student.reasons.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 lg:ml-14">
                        {student.reasons.map((reason, index) => (
                          <span
                            key={`${student.id}-${index}`}
                            className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                </button>
              );
            })}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}