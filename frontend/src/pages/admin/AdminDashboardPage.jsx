import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PROGRAMME_COLOURS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#0d9488",
];

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

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
}) {
  const tones = {
    blue: {
      icon:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    emerald: {
      icon:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    violet: {
      icon:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    },
    amber: {
      icon:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
  };

  const style = tones[tone] || tones.blue;

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {helper}
          </p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </motion.div>
  );
}

function RiskBadge({ count }) {
  if (!count) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        No blocking failures
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      <span className="size-1.5 rounded-full bg-red-500" />
      {count} blocking
    </span>
  );
}

function ProgrammeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">
        {item.programme_name}
      </p>

      <p className="mt-1 font-semibold text-zinc-950 dark:text-white">
        {item.student_count}{" "}
        {item.student_count === 1 ? "student" : "students"}
      </p>
    </div>
  );
}

function EmptyRiskState() {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        <UserCheck size={22} />
      </div>

      <h3 className="mt-4 font-semibold text-zinc-950 dark:text-white">
        No students currently flagged
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        There are no active students meeting the dashboard's
        current at-risk criteria.
      </p>
    </div>
  );
}

export default function AdminDashboardPage({
  dashboard,
  analytics,
  onNavigate,
  onStudentClick,
}) {
  if (!dashboard) return null;

  const totalStudents = Number(dashboard.total_students || 0);
  const activeStudents = Number(dashboard.active_students || 0);
  const atRiskCount = Number(dashboard.at_risk_count || 0);

  const inactiveStudents = Math.max(
    totalStudents - activeStudents,
    0
  );

  const programmes = Array.isArray(
    dashboard.students_by_programme
  )
    ? dashboard.students_by_programme
    : [];

  const atRiskStudents = Array.isArray(
    dashboard.at_risk_students
  )
    ? dashboard.at_risk_students
    : [];

  const activePercentage =
    totalStudents > 0
      ? (activeStudents / totalStudents) * 100
      : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 dark:border-blue-950 dark:from-blue-950/30 dark:via-zinc-950 dark:to-indigo-950/20 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <Activity size={14} />
              Administration Overview
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              Academic dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Monitor students, academic performance and programme
              activity from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.("students")}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Users size={16} />
              View students
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.("add")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
            >
              <GraduationCap size={16} />
              Add student
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={totalStudents.toLocaleString()}
          helper={`${inactiveStudents.toLocaleString()} inactive`}
          tone="blue"
        />

        <StatCard
          icon={UserCheck}
          label="Active Students"
          value={activeStudents.toLocaleString()}
          helper={`${activePercentage.toFixed(1)}% of all students`}
          tone="emerald"
        />

        <StatCard
          icon={TrendingUp}
          label="Cohort Average"
          value={formatAverage(dashboard.cohort_average)}
          helper="Active student performance"
          tone="violet"
        />

        <StatCard
          icon={AlertTriangle}
          label="At Risk"
          value={atRiskCount.toLocaleString()}
          helper={
            atRiskCount === 1
              ? "Student needs attention"
              : "Students needing attention"
          }
          tone="amber"
        />
      </div>

      {/* Analytics */}
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        {/* Programme chart */}
        <motion.section
          variants={fadeUp}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />

                <h2 className="font-semibold text-zinc-950 dark:text-white">
                  Students by programme
                </h2>
              </div>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Distribution of active students across programmes.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("programme-breakdown")
              }
              className="hidden items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 sm:inline-flex"
            >
              View breakdown
              <ArrowRight size={14} />
            </button>
          </div>

          {programmes.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={programmes}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.15}
                  />

                  <XAxis
                    dataKey="programme_code"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip
                    content={<ProgrammeTooltip />}
                    cursor={{ opacity: 0.06 }}
                  />

                  <Bar
                    dataKey="student_count"
                    radius={[7, 7, 0, 0]}
                    maxBarSize={58}
                  >
                    {programmes.map((programme, index) => (
                      <Cell
                        key={programme.programme_code}
                        fill={PROGRAMME_COLOURS[index % PROGRAMME_COLOURS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
                <BookOpen size={20} />
              </div>

              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                No programme activity
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Active student distribution will appear here.
              </p>
            </div>
          )}
        </motion.section>

        {/* Cohort health */}
        <motion.section
          variants={fadeUp}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <Target
              size={18}
              className="text-blue-600 dark:text-blue-400"
            />

            <h2 className="font-semibold text-zinc-950 dark:text-white">
              Cohort overview
            </h2>
          </div>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Current student activity snapshot.
          </p>

          <div className="mt-7 flex justify-center">
            <div className="relative flex size-40 items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="size-full -rotate-90"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-zinc-100 dark:text-zinc-900"
                />

                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  className="text-blue-600"
                  initial={{
                    strokeDasharray: "0 314",
                  }}
                  animate={{
                    strokeDasharray: `${
                      (activePercentage / 100) * 314
                    } 314`,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                />
              </svg>

              <div className="absolute text-center">
                <p className="text-2xl font-semibold text-zinc-950 dark:text-white">
                  {activePercentage.toFixed(0)}%
                </p>

                <p className="text-xs text-zinc-500">
                  active
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />

                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Active
                </span>
              </div>

              <span className="text-sm font-semibold text-zinc-950 dark:text-white">
                {activeStudents}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-zinc-400" />

                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Inactive
                </span>
              </div>

              <span className="text-sm font-semibold text-zinc-950 dark:text-white">
                {inactiveStudents}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />

                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  At risk
                </span>
              </div>

              <span className="text-sm font-semibold text-zinc-950 dark:text-white">
                {atRiskCount}
              </span>
            </div>
          </div>
        </motion.section>
      </div>

      {analytics && (
        <motion.section variants={fadeUp} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Academic analytics</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Descriptive cohort indicators from verified student records.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={GraduationCap} label="Requirements complete" value={Number(analytics.graduation_ready_count || 0).toLocaleString()} helper="All recorded programme requirements complete" tone="emerald" />
            <StatCard icon={BookOpen} label="Requirements remaining" value={Number(analytics.requirements_remaining_count || 0).toLocaleString()} helper="Students with recorded requirements remaining" tone="blue" />
            <StatCard icon={AlertTriangle} label="Prerequisite blocks" value={Number(analytics.failed_prerequisite_count || 0).toLocaleString()} helper="Students with failed blocking prerequisites" tone="amber" />
            <StatCard icon={Target} label="Below own target" value={Number(analytics.below_target_count || 0).toLocaleString()} helper="Weighted average below configured target" tone="violet" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="font-semibold text-zinc-950 dark:text-white">Progress distribution</h3>
              <p className="mt-1 text-xs text-zinc-500">Active students grouped by degree completion percentage.</p>
              <div className="mt-5 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.progress_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="student_count" fill="#2563eb" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="font-semibold text-zinc-950 dark:text-white">Students by academic year</h3>
              <p className="mt-1 text-xs text-zinc-500">Active student distribution by current year of study.</p>
              <div className="mt-5 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(analytics.students_by_year || []).map((item) => ({ ...item, label: `Year ${item.year}` }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="student_count" fill="#059669" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-950 dark:text-white">Programme performance</h3>
                <p className="mt-1 text-xs text-zinc-500">Completion and weighted-average summaries for active students.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900/60"><tr><th className="px-5 py-3">Programme</th><th className="px-4 py-3">Students</th><th className="px-4 py-3">Avg. complete</th><th className="px-4 py-3">Weighted avg.</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{(analytics.programme_performance || []).map((item) => <tr key={item.programme_code}><td className="px-5 py-3"><p className="font-semibold text-zinc-900 dark:text-white">{item.programme_code}</p><p className="text-xs text-zinc-500">{item.programme_name}</p></td><td className="px-4 py-3">{item.student_count}</td><td className="px-4 py-3">{item.avg_percentage_complete == null ? "—" : `${Number(item.avg_percentage_complete).toFixed(1)}%`}</td><td className="px-4 py-3">{formatAverage(item.avg_weighted_average)}</td></tr>)}</tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="font-semibold text-zinc-950 dark:text-white">Module bottlenecks</h3>
              <p className="mt-1 text-xs text-zinc-500">Modules with the most currently recorded failures.</p>
              <div className="mt-4 space-y-2">{(analytics.bottleneck_modules || []).length ? analytics.bottleneck_modules.map((module) => <div key={module.code} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-900/60"><div className="min-w-0"><p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{module.code}</p><p className="truncate text-xs text-zinc-500">{module.name}</p></div><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">{module.fail_count} failed</span></div>) : <p className="py-8 text-center text-sm text-zinc-500">No failed modules recorded.</p>}</div>
            </div>
          </div>
        </motion.section>
      )}

      {/* At risk */}
      <motion.section
        variants={fadeUp}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={18}
                className="text-amber-500"
              />

              <h2 className="font-semibold text-zinc-950 dark:text-white">
                Students needing attention
              </h2>

              {atRiskCount > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {atRiskCount}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Students currently flagged by academic
              performance or blocking modules.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.("at-risk")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
          >
            View all
            <ArrowRight size={15} />
          </button>
        </div>

        {atRiskStudents.length === 0 ? (
          <EmptyRiskState />
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {atRiskStudents
              .slice(0, 5)
              .map((student) => (
                <button
                  type="button"
                  key={student.id}
                  onClick={() =>
                    onStudentClick?.(student)
                  }
                  className="group flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 sm:flex sm:items-center">
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

                    <RiskBadge
                      count={
                        student.failed_blocking_count
                      }
                    />

                    <ArrowRight
                      size={17}
                      className="hidden text-zinc-400 transition-transform group-hover:translate-x-1 sm:block"
                    />
                  </div>
                </button>
              ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}