import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  GraduationCap,
  Layers3,
  ListChecks,
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
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
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

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="tabular-nums mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------
// Missing Module Row
// ---------------------------------------------------------

function MissingModule({
  module,
  onModuleClick,
  type = "compulsory",
}) {
  const isElective = type === "elective";

  return (
    <button
      type="button"
      onClick={() =>
        onModuleClick?.(module.code)
      }
      className={`group flex min-w-0 items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition ${
        isElective
          ? "border-zinc-200/80 bg-zinc-50/50 hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/[0.06]"
          : "border-zinc-200/80 bg-zinc-50/50 hover:border-brand-300 hover:bg-brand-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/[0.06]"
      }`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
          isElective
            ? "bg-violet-500/10"
            : "bg-brand-500/10"
        }`}
      >
        {isElective ? (
          <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
        ) : (
          <BookOpen className="size-4 text-brand-600 dark:text-brand-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`font-mono text-xs font-bold ${
            isElective
              ? "text-violet-600 dark:text-violet-400"
              : "text-brand-600 dark:text-brand-400"
          }`}
        >
          {module.code}
        </p>

        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {module.name}
        </p>
      </div>

      <ArrowRight
        className={`size-3.5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 dark:text-zinc-600 ${
          isElective
            ? "group-hover:text-violet-500"
            : "group-hover:text-brand-500"
        }`}
      />
    </button>
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
  const [showAllCompulsory, setShowAllCompulsory] =
    useState(false);

  const [showAllElectives, setShowAllElectives] =
    useState(false);

  const [showAllInsights, setShowAllInsights] =
    useState(false);

  if (!audit) {
    return (
      <Card className="p-8">
        <p className="text-sm text-zinc-500">
          Graduation planning information is not available.
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

  const urgentItems = Array.isArray(
    audit.urgent_items,
  )
    ? audit.urgent_items
    : [];

  const reasons = Array.isArray(audit.reasons)
    ? audit.reasons
    : [];

  const warnings = Array.isArray(
    audit.prerequisite_warnings,
  )
    ? audit.prerequisite_warnings
    : [];

  const semesters =
    audit.projected_semesters_remaining;

  const averageCredits =
    audit.average_credits_per_semester;

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

  const insights = [
    ...urgentItems.map((text) => ({
      type: "urgent",
      text,
    })),

    ...warnings.map((warning) => ({
      type: "warning",
      text: `${warning.module} requires ${warning.missing_prereq}`,
    })),

    ...reasons.map((text) => ({
      type: "info",
      text,
    })),
  ];

  const visibleCompulsory =
    showAllCompulsory
      ? compulsoryMissing
      : compulsoryMissing.slice(0, 6);

  const visibleElectives =
    showAllElectives
      ? electiveMissing
      : electiveMissing.slice(0, 4);

  const visibleInsights =
    showAllInsights
      ? insights
      : insights.slice(0, 4);

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
      {/* -------------------------------------------------- */}
      {/* PAGE HEADING */}
      {/* -------------------------------------------------- */}

      <motion.div variants={fadeUp}>
        <Badge variant="primary">
          <Route className="size-3.5" />
          Graduation planning
        </Badge>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Plan your path to graduation
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Review your graduation requirements, identify
          outstanding modules and see what you are currently
          eligible to take.
        </p>
      </motion.div>

      {/* -------------------------------------------------- */}
      {/* GRADUATION STATUS */}
      {/* -------------------------------------------------- */}

      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden">
          <div
            className={`border-b px-5 py-6 sm:px-6 ${
              audit.on_track
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]"
                : "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/[0.07]"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                    audit.on_track
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {audit.on_track ? (
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
                    {audit.on_track
                      ? "You're on track"
                      : "Your plan needs attention"}
                  </h2>

                  <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                    {audit.on_track
                      ? "Your current academic progress is aligned with your graduation requirements."
                      : "There are outstanding requirements that should be considered when planning upcoming semesters."}
                  </p>
                </div>
              </div>

              <Badge
                variant={
                  audit.on_track
                    ? "success"
                    : "warning"
                }
              >
                {audit.on_track
                  ? "On track"
                  : "Needs attention"}
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

      {/* -------------------------------------------------- */}
      {/* DEGREE REQUIREMENTS */}
      {/* -------------------------------------------------- */}

      <motion.div variants={fadeUp}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Degree requirements
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your completion across compulsory and elective
            requirements.
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

      {/* -------------------------------------------------- */}
      {/* OUTSTANDING REQUIREMENTS */}
      {/* -------------------------------------------------- */}

      {(compulsoryMissing.length > 0 ||
        electiveMissing.length > 0) && (
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden">
            {/* Header */}

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
                    Modules you still need to complete.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {compulsoryMissing.length >
                  0 && (
                  <Badge variant="warning">
                    {compulsoryMissing.length}{" "}
                    compulsory
                  </Badge>
                )}

                {electiveMissing.length > 0 && (
                  <Badge variant="neutral">
                    {electiveMissing.length}{" "}
                    elective
                  </Badge>
                )}
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {/* Compulsory modules */}

              {compulsoryMissing.length > 0 && (
                <div className="px-5 py-5 sm:px-6">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Compulsory modules
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-500">
                        Required for your programme
                      </p>
                    </div>

                    <span className="text-xs font-medium text-zinc-400">
                      {compulsoryMissing.length}{" "}
                      remaining
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {visibleCompulsory.map(
                      (module) => (
                        <MissingModule
                          key={module.code}
                          module={module}
                          onModuleClick={
                            onModuleClick
                          }
                        />
                      ),
                    )}
                  </div>

                  {compulsoryMissing.length >
                    6 && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllCompulsory(
                          (current) =>
                            !current,
                        )
                      }
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      {showAllCompulsory ? (
                        <>
                          <ChevronUp className="size-4" />
                          Show fewer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-4" />
                          Show all{" "}
                          {
                            compulsoryMissing.length
                          }{" "}
                          modules
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Elective modules */}

              {electiveMissing.length > 0 && (
                <div className="px-5 py-5 sm:px-6">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Elective modules
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-500">
                        Available elective requirements
                      </p>
                    </div>

                    <span className="text-xs font-medium text-zinc-400">
                      {electiveMissing.length}{" "}
                      remaining
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {visibleElectives.map(
                      (module) => (
                        <MissingModule
                          key={module.code}
                          module={module}
                          onModuleClick={
                            onModuleClick
                          }
                          type="elective"
                        />
                      ),
                    )}
                  </div>

                  {electiveMissing.length >
                    4 && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllElectives(
                          (current) =>
                            !current,
                        )
                      }
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      {showAllElectives ? (
                        <>
                          <ChevronUp className="size-4" />
                          Show fewer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-4" />
                          Show all{" "}
                          {
                            electiveMissing.length
                          }{" "}
                          modules
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* -------------------------------------------------- */}
      {/* PLANNING INSIGHTS */}
      {/* -------------------------------------------------- */}

      {insights.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <CircleAlert className="size-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                    Planning insights
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Things to consider when
                    planning your next semester.
                  </p>
                </div>
              </div>

              <Badge variant="warning">
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
                    <div
                      key={`${insight.type}-${index}`}
                      className="flex items-start gap-3 px-2 py-3.5 transition first:pt-1 last:pb-1"
                    >
                      <div
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${
                          insight.type ===
                          "urgent"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : insight.type ===
                                "warning"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {insight.type ===
                        "warning" ? (
                          <AlertTriangle className="size-3.5" />
                        ) : insight.type ===
                          "urgent" ? (
                          <CircleAlert className="size-3.5" />
                        ) : (
                          <ArrowRight className="size-3.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                          {insight.type ===
                          "urgent"
                            ? "Attention"
                            : insight.type ===
                                "warning"
                              ? "Prerequisite"
                              : "Planning note"}
                        </p>

                        <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                          {insight.text}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {insights.length > 4 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllInsights(
                      (current) => !current,
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
                      View all {insights.length}{" "}
                      insights
                    </>
                  )}
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* -------------------------------------------------- */}
      {/* ELIGIBLE MODULES */}
      {/* -------------------------------------------------- */}

      <motion.div variants={fadeUp}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Eligible modules
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Modules whose prerequisites you currently
              meet.
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
                <motion.button
                  key={
                    module.code ||
                    module.id ||
                    index
                  }
                  type="button"
                  onClick={() =>
                    onModuleClick?.(
                      module.code,
                    )
                  }
                  whileHover={{ y: -3 }}
                  transition={{
                    duration: 0.18,
                  }}
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
              ),
            )}
          </div>
        )}

        {eligible.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onNavigate?.("planner")
            }
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Open semester planner
            <ArrowRight className="size-4" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}