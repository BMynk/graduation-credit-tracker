import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  GraduationCap,
  Layers3,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../api";

const cardClass =
  "rounded-2xl border border-zinc-200/80 bg-white shadow-sm " +
  "dark:border-zinc-800 dark:bg-zinc-950";

function formatNumber(value, fallback = "—") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallback;
  }

  return Number(value).toLocaleString();
}

function formatAverage(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
}

function prettifySemester(value) {
  if (!value) return "Semester";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\bsem\b/gi, "Semester")
    .replace(/\s+/g, " ")
    .trim();
}

function getStatusConfig(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "completed") {
    return {
      label: "Completed",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 " +
        "dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  }

  if (normalized === "failed") {
    return {
      label: "Failed",
      className:
        "border-red-200 bg-red-50 text-red-700 " +
        "dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300",
      dot: "bg-red-500",
    };
  }

  if (
    normalized === "in_progress" ||
    normalized === "in-progress" ||
    normalized === "registered"
  ) {
    return {
      label: "In progress",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 " +
        "dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
      dot: "bg-amber-500",
    };
  }

  return {
    label: status
      ? String(status)
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Recorded",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-600 " +
      "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    dot: "bg-zinc-400",
  };
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${cardClass} p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          {helper && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {helper}
            </p>
          )}
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Icon size={19} />
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ModuleRow({ item, onModuleClick }) {
  const module = item?.module || {};
  const clickable = Boolean(module.code && onModuleClick);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && onModuleClick(module.code)}
      className={[
        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
        clickable
          ? "hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
          : "cursor-default",
      ].join(" ")}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <BookOpen size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {module.code || "Module"}
          </p>

          <StatusBadge status={item.status} />
        </div>

        <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {module.name || "Module details"}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {item.grade !== null && item.grade !== undefined
            ? `${Number(item.grade).toFixed(0)}%`
            : "—"}
        </p>

        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
          {formatNumber(module.credits, 0)} credits
        </p>
      </div>

      {clickable && (
        <ChevronRight
          size={17}
          className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}

function SemesterCard({ semester, onModuleClick }) {
  const [expanded, setExpanded] = useState(true);
  const modules = Array.isArray(semester?.modules) ? semester.modules : [];

  const completedCount = modules.filter(
    (item) => String(item.status).toLowerCase() === "completed"
  ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-4 bg-zinc-50/80 px-4 py-4 text-left transition hover:bg-zinc-100/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-blue-400 dark:ring-zinc-800">
          <CalendarDays size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-950 dark:text-white">
            {prettifySemester(semester.semester)}
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {completedCount} completed · {formatNumber(semester.module_count, modules.length)} modules
          </p>
        </div>

        <div className="hidden gap-6 md:flex">
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Credits
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatNumber(semester.credits_completed, 0)}
            </p>
          </div>

          <div className="min-w-[64px] text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Average
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatAverage(semester.average)}
            </p>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-2"
        >
          {modules.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {modules.map((item, index) => (
                <ModuleRow
                  key={
                    item.id ||
                    `${item?.module?.code || "module"}-${index}`
                  }
                  item={item}
                  onModuleClick={onModuleClick}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              No modules recorded for this semester.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function YearCard({ year, index, onModuleClick }) {
  const [expanded, setExpanded] = useState(index === 0);
  const semesters = Array.isArray(year.semesters) ? year.semesters : [];

  const completedModules = semesters.reduce(
    (total, semester) =>
      total +
      (semester.modules || []).filter(
        (item) => String(item.status).toLowerCase() === "completed"
      ).length,
    0
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`${cardClass} overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full flex-col gap-5 p-5 text-left transition hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20 sm:p-6"
      >
        <div className="flex w-full items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <GraduationCap size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                Academic Year {year.year}
              </h2>

              {index === 0 && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                  Latest
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {semesters.length} {semesters.length === 1 ? "semester" : "semesters"} recorded
            </p>
          </div>

          <ChevronDown
            size={19}
            className={`mt-1 shrink-0 text-zinc-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniMetric
            label="Credits"
            value={formatNumber(year.year_credits, 0)}
          />

          <MiniMetric
            label="Modules"
            value={formatNumber(year.year_modules, 0)}
          />

          <MiniMetric
            label="Completed"
            value={formatNumber(completedModules, 0)}
          />

          <MiniMetric
            label="Average"
            value={formatAverage(year.year_average)}
          />
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-zinc-200 p-4 dark:border-zinc-800 sm:p-6"
        >
          <div className="space-y-4">
            {semesters.map((semester, semesterIndex) => (
              <SemesterCard
                key={semester.semester || semesterIndex}
                semester={semester}
                onModuleClick={onModuleClick}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60">
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{label}</p>

      <p className="mt-1 text-base font-semibold text-zinc-950 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium text-zinc-500">
        Academic Year {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
        {item?.average !== null && item?.average !== undefined
          ? `${Number(item.average).toFixed(1)}% average`
          : "No average available"}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {formatNumber(item?.credits, 0)} credits completed
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className={`${cardClass} px-6 py-16 text-center`}>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
        <CalendarDays size={22} />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
        Your academic journey will appear here
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        There are no recorded enrolments available to build your yearly
        breakdown yet.
      </p>
    </div>
  );
}

export default function YearlyBreakdown({ onModuleClick }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadYearlyBreakdown() {
    try {
      setLoading(true);
      setError("");

      const data = await api.getYearlyBreakdown();

      setYears(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.message ||
          "We couldn't load your yearly academic progress."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadYearlyBreakdown();
  }, []);

  const orderedYears = useMemo(() => {
    return [...years].sort((a, b) =>
      String(b.year).localeCompare(String(a.year), undefined, {
        numeric: true,
      })
    );
  }, [years]);

  const stats = useMemo(() => {
    const totalCredits = years.reduce(
      (sum, year) => sum + Number(year.year_credits || 0),
      0
    );

    const totalModules = years.reduce(
      (sum, year) => sum + Number(year.year_modules || 0),
      0
    );

    const allGrades = years.flatMap((year) =>
      (year.semesters || []).flatMap((semester) =>
        (semester.modules || [])
          .map((item) => item.grade)
          .filter(
            (grade) =>
              grade !== null &&
              grade !== undefined &&
              !Number.isNaN(Number(grade))
          )
          .map(Number)
      )
    );

    const overallAverage =
      allGrades.length > 0
        ? allGrades.reduce((sum, grade) => sum + grade, 0) /
          allGrades.length
        : null;

    return {
      years: years.length,
      totalCredits,
      totalModules,
      overallAverage,
    };
  }, [years]);

  const chartData = useMemo(
    () =>
      [...years]
        .sort((a, b) =>
          String(a.year).localeCompare(String(b.year), undefined, {
            numeric: true,
          })
        )
        .map((year) => ({
          year: String(year.year),
          average:
            year.year_average === null ||
            year.year_average === undefined
              ? null
              : Number(year.year_average),
          credits: Number(year.year_credits || 0),
        })),
    [years]
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 dark:border-blue-950 dark:from-blue-950/30 dark:via-zinc-950 dark:to-indigo-950/20 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles size={14} />
            Yearly Progress
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                Your academic journey
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                See how your credits, modules and academic performance have
                developed across each year and semester.
              </p>
            </div>

            {years.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
                <TrendingUp
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Overall average
                  </p>

                  <p className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {formatAverage(stats.overallAverage)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Couldn't load yearly progress
            </p>

            <p className="mt-1 text-sm text-red-700/80 dark:text-red-400">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadYearlyBreakdown}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {!error && years.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={CalendarDays}
              label="Academic Years"
              value={formatNumber(stats.years, 0)}
              helper="Years with recorded activity"
            />

            <StatCard
              icon={Award}
              label="Credits Completed"
              value={formatNumber(stats.totalCredits, 0)}
              helper="Across recorded years"
            />

            <StatCard
              icon={Layers3}
              label="Modules Recorded"
              value={formatNumber(stats.totalModules, 0)}
              helper="All recorded attempts"
            />

            <StatCard
              icon={BarChart3}
              label="Overall Average"
              value={formatAverage(stats.overallAverage)}
              helper="Across available grades"
            />
          </div>

          {chartData.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cardClass} p-5 sm:p-6`}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />

                    <h2 className="font-semibold text-zinc-950 dark:text-white">
                      Performance trend
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Your recorded average across academic years.
                  </p>
                </div>

                <div className="hidden rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 sm:block">
                  Yearly average
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 8,
                      right: 4,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.15}
                    />

                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ opacity: 0.06 }}
                    />

                    <Bar
                      dataKey="average"
                      fill="currentColor"
                      className="text-blue-600"
                      radius={[7, 7, 0, 0]}
                      maxBarSize={58}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CircleDot
                    size={17}
                    className="text-blue-600 dark:text-blue-400"
                  />

                  <h2 className="font-semibold text-zinc-950 dark:text-white">
                    Year-by-year breakdown
                  </h2>
                </div>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Expand a year to explore its semesters and modules.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {orderedYears.map((year, index) => (
                <YearCard
                  key={year.year || index}
                  year={year}
                  index={index}
                  onModuleClick={onModuleClick}
                />
              ))}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />

            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                Based on your academic record
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Credits, grades, module statuses and semester information shown
                here come from your recorded enrolments. Select a module to
                open its full details.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}