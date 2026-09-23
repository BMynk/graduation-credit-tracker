import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GraduationCap,
  Layers3,
  Target,
  TrendingUp,
} from "lucide-react";

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

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

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}) {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    green: {
      icon: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
  };

  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
              {label}
            </p>

            <p className="tabular-nums mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {value}
            </p>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {helper}
            </p>
          </div>

          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone].icon}`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ProgressRing({ value }) {
  const percentage = clamp(value);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (percentage / 100) * circumference;

  return (
    <div className="relative size-40 shrink-0">
      <svg
        className="-rotate-90 size-full"
        viewBox="0 0 128 128"
        aria-hidden="true"
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-zinc-100 dark:text-zinc-800"
        />

        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-brand-500"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular-nums text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {percentage.toFixed(1)}%
        </span>

        <span className="mt-1 text-[11px] font-medium text-zinc-500">
          COMPLETE
        </span>
      </div>
    </div>
  );
}

function AttentionRow({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = "warning",
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center dark:border-zinc-800">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>

      <Badge variant={badgeVariant}>{badge}</Badge>
    </div>
  );
}

export default function SummaryPage({
  summary,
  student,
  onNavigate,
}) {
  if (!summary) {
    return (
      <Card className="p-8">
        <p className="text-sm text-zinc-500">
          Academic summary is not available yet.
        </p>
      </Card>
    );
  }

  const creditsCompleted =
    Number(summary.credits_completed ?? 0);

  const creditsRequired =
    Number(summary.credits_required ?? 0);

  const creditsRemaining =
    Number(
      summary.credits_remaining ??
        Math.max(creditsRequired - creditsCompleted, 0),
    );

  const percentage =
    Number(
      summary.percentage_complete ??
        (creditsRequired
          ? (creditsCompleted / creditsRequired) * 100
          : 0),
    );

  const average =
    Number(summary.weighted_average ?? 0);

  const modulesCompleted =
    Number(summary.modules_completed ?? 0);

  const failedModules = Array.isArray(summary.failed_modules)
    ? summary.failed_modules
    : [];

  const missingCompulsory = Array.isArray(
    summary.missing_compulsory,
  )
    ? summary.missing_compulsory
    : [];

  const categoryBreakdown =
    summary.category_breakdown || {};

  const programmeName =
    student?.programme?.name ||
    student?.programme_name ||
    "Your programme";

  const currentYear =
    student?.current_year || "—";

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
      {/* Welcome */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="primary">
              <GraduationCap className="size-3.5" />
              Year {currentYear}
            </Badge>

            <Badge variant="neutral">
              Academic overview
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            Welcome back,{" "}
            {student?.name?.split(" ")[0] || "Student"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Here&apos;s an overview of your progress toward
            completing {programmeName}.
          </p>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Degree progress"
          value={`${percentage.toFixed(1)}%`}
          helper="of your degree completed"
          icon={Target}
          tone="blue"
        />

        <StatCard
          label="Credits earned"
          value={`${creditsCompleted} / ${creditsRequired}`}
          helper={`${creditsRemaining} credits remaining`}
          icon={BookOpen}
          tone="green"
        />

        <StatCard
          label="Overall average"
          value={`${average.toFixed(1)}%`}
          helper="current academic average"
          icon={TrendingUp}
          tone="violet"
        />

        <StatCard
          label="Modules completed"
          value={modulesCompleted}
          helper={`${failedModules.length} requiring attention`}
          icon={CheckCircle2}
          tone={
            failedModules.length > 0 ? "amber" : "green"
          }
        />
      </motion.div>

      {/* Main dashboard area */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Degree progress */}
        <motion.div variants={fadeUp}>
          <Card className="h-full p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-zinc-950 dark:text-white">
                  Degree progress
                </p>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Your overall progress toward graduation.
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <GraduationCap className="size-5" />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-8 md:flex-row">
              <ProgressRing value={percentage} />

              <div className="w-full flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                    <p className="text-xs text-zinc-500">
                      Earned
                    </p>

                    <p className="tabular-nums mt-1 text-xl font-semibold text-zinc-950 dark:text-white">
                      {creditsCompleted}
                    </p>

                    <p className="text-xs text-zinc-400">
                      credits
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                    <p className="text-xs text-zinc-500">
                      Remaining
                    </p>

                    <p className="tabular-nums mt-1 text-xl font-semibold text-zinc-950 dark:text-white">
                      {creditsRemaining}
                    </p>

                    <p className="text-xs text-zinc-400">
                      credits
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <Progress
                    value={percentage}
                    label="Credit completion"
                    showValue
                  />
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  <Clock3 className="size-4 shrink-0" />

                  Keep completing eligible modules to move
                  closer to graduation.
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Credits/category */}
        <motion.div variants={fadeUp}>
          <Card className="h-full p-5 sm:p-6">
            <div>
              <p className="text-base font-semibold text-zinc-950 dark:text-white">
                Credits by category
              </p>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Breakdown of your completed requirements.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {Object.keys(categoryBreakdown).length > 0 ? (
                Object.entries(categoryBreakdown).map(
                  ([category, details]) => {
                    const completed =
                      Number(
                        details?.credits_completed ??
                          details?.completed_credits ??
                          details?.credits ??
                          0,
                      );

                    const required =
                      Number(
                        details?.credits_required ??
                          details?.required_credits ??
                          0,
                      );

                    const categoryPercentage = required
                      ? (completed / required) * 100
                      : completed > 0
                        ? 100
                        : 0;

                    return (
                      <div key={category}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Layers3 className="size-4 text-zinc-400" />

                            <span className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">
                              {category}
                            </span>
                          </div>

                          <span className="tabular-nums text-xs font-medium text-zinc-500">
                            {completed}
                            {required > 0
                              ? ` / ${required}`
                              : ""}{" "}
                            credits
                          </span>
                        </div>

                        <Progress
                          value={categoryPercentage}
                        />
                      </div>
                    );
                  },
                )
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
                  <Layers3 className="mx-auto size-6 text-zinc-400" />

                  <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No category breakdown yet
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Category information will appear here.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Attention */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-5 sm:px-6 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  failedModules.length ||
                  missingCompulsory.length
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                }`}
              >
                {failedModules.length ||
                missingCompulsory.length ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <CheckCircle2 className="size-5" />
                )}
              </div>

              <div>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {failedModules.length ||
                  missingCompulsory.length
                    ? "Attention required"
                    : "Everything looks good"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {failedModules.length ||
                  missingCompulsory.length
                    ? "These items may affect your progress toward graduation."
                    : "There are currently no academic issues requiring your attention."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            {failedModules.length > 0 && (
              <AttentionRow
                icon={CircleAlert}
                title="Failed modules"
                description={`${failedModules.length} module${
                  failedModules.length === 1 ? "" : "s"
                } ${
                  failedModules.length === 1
                    ? "requires"
                    : "require"
                } attention or a future retake.`}
                badge={`${failedModules.length} failed`}
                badgeVariant="danger"
              />
            )}

            {missingCompulsory.length > 0 && (
              <AttentionRow
                icon={BookOpen}
                title="Compulsory modules remaining"
                description={`${missingCompulsory.length} compulsory module${
                  missingCompulsory.length === 1
                    ? " is"
                    : "s are"
                } still outstanding for your programme.`}
                badge={`${missingCompulsory.length} remaining`}
                badgeVariant="warning"
              />
            )}

            {failedModules.length === 0 &&
              missingCompulsory.length === 0 && (
                <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
                  No failed or missing compulsory modules
                  currently need your attention.
                </div>
              )}

            {(failedModules.length > 0 ||
              missingCompulsory.length > 0) && (
              <button
                type="button"
                onClick={() => onNavigate?.("planning")}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View graduation planning
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}