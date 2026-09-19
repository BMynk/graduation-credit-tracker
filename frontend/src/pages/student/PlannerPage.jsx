import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  Layers3,
  Loader2,
  LockKeyhole,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { api } from "../../api";
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

function getDefaultSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const semester = now.getMonth() < 6 ? "S1" : "S2";

  return `${year}-${semester}`;
}

function ModuleCard({
  module,
  selected,
  onToggle,
  onModuleClick,
}) {
  const locked = !module.is_eligible;

  return (
    <motion.div
      layout
      className={`group relative rounded-xl border transition ${
        selected
          ? "border-brand-500 bg-brand-500/[0.05] ring-1 ring-brand-500/20"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
      } ${locked ? "opacity-65" : ""}`}
    >
      <button
        type="button"
        disabled={locked}
        onClick={() => onToggle(module)}
        className="w-full p-4 text-left disabled:cursor-not-allowed"
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
              selected
                ? "bg-brand-600 text-white"
                : locked
                  ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
            }`}
          >
            {selected ? (
              <Check className="size-4" />
            ) : locked ? (
              <LockKeyhole className="size-4" />
            ) : (
              <BookOpen className="size-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                {module.code}
              </span>

              {module.is_compulsory && (
                <Badge variant="primary">
                  Compulsory
                </Badge>
              )}

              {!module.is_compulsory && (
                <Badge variant="neutral">
                  Elective
                </Badge>
              )}
            </div>

            <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {module.name}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <span>{module.credits} credits</span>
              <span>Level {module.level}</span>

              {module.category && (
                <span>{module.category}</span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            module.is_eligible
              ? "bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400"
          }`}
        >
          {module.reason ||
            (module.is_eligible
              ? "Eligible to take"
              : "Not currently eligible")}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onModuleClick?.(module.code)}
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-white"
        title="View module details"
      >
        <ChevronRight className="size-4" />
      </button>
    </motion.div>
  );
}

function SelectedModule({
  module,
  onRemove,
  onModuleClick,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <button
        type="button"
        onClick={() => onModuleClick?.(module.code)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
            {module.code}
          </span>

          {module.is_compulsory && (
            <span className="size-1.5 rounded-full bg-brand-500" />
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {module.name}
        </p>
      </button>

      <div className="text-right">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {module.credits}
        </p>
        <p className="text-[10px] text-zinc-400">
          credits
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(module.code)}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
      >
        <Trash2 className="size-3.5" />
      </button>
    </motion.div>
  );
}

export default function PlannerPage({
  onModuleClick,
}) {
  const [modules, setModules] = useState([]);
  const [selectedCodes, setSelectedCodes] =
    useState([]);
  const [semester, setSemester] = useState(
    getDefaultSemester(),
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState("eligible");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    try {
      setLoading(true);
      setError("");

      const data =
        await api.getPlanningModules();

      setModules(
        Array.isArray(data) ? data : [],
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load planning modules.",
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedModules = useMemo(
    () =>
      selectedCodes
        .map((code) =>
          modules.find(
            (module) => module.code === code,
          ),
        )
        .filter(Boolean),
    [selectedCodes, modules],
  );

  const totalCredits = useMemo(
    () =>
      selectedModules.reduce(
        (sum, module) =>
          sum + Number(module.credits || 0),
        0,
      ),
    [selectedModules],
  );

  const compulsoryCount =
    selectedModules.filter(
      (module) => module.is_compulsory,
    ).length;

  const electiveCount =
    selectedModules.filter(
      (module) => !module.is_compulsory,
    ).length;

  const creditStatus = useMemo(() => {
    if (totalCredits === 0) {
      return {
        label: "No modules selected",
        tone: "neutral",
      };
    }

    if (totalCredits < 45) {
      return {
        label: "Below recommended load",
        tone: "warning",
      };
    }

    if (totalCredits > 60) {
      return {
        label: "Above recommended load",
        tone: "danger",
      };
    }

    return {
      label: "Recommended load",
      tone: "success",
    };
  }, [totalCredits]);

  const filteredModules = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return modules.filter((module) => {
      const matchesSearch =
        !query ||
        module.code
          ?.toLowerCase()
          .includes(query) ||
        module.name
          ?.toLowerCase()
          .includes(query) ||
        module.category
          ?.toLowerCase()
          .includes(query);

      let matchesFilter = true;

      if (filter === "eligible") {
        matchesFilter = module.is_eligible;
      }

      if (filter === "compulsory") {
        matchesFilter =
          module.is_compulsory &&
          module.is_eligible;
      }

      if (filter === "elective") {
        matchesFilter =
          !module.is_compulsory &&
          module.is_eligible;
      }

      if (filter === "locked") {
        matchesFilter = !module.is_eligible;
      }

      return matchesSearch && matchesFilter;
    });
  }, [modules, search, filter]);

  function toggleModule(module) {
    if (!module.is_eligible) return;

    setSelectedCodes((current) =>
      current.includes(module.code)
        ? current.filter(
            (code) => code !== module.code,
          )
        : [...current, module.code],
    );

    setPlan(null);
    setSuccess("");
  }

  function removeModule(code) {
    setSelectedCodes((current) =>
      current.filter(
        (item) => item !== code,
      ),
    );

    setPlan(null);
    setSuccess("");
  }

  async function generatePlan() {
    if (!semester.trim()) {
      setError(
        "Enter the semester you are planning for.",
      );
      return;
    }

    if (selectedCodes.length === 0) {
      setError(
        "Select at least one module first.",
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const data = await api.generatePlan({
        semester: semester.trim(),
        module_codes: selectedCodes,
      });

      setPlan(data);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to analyse this semester plan.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function savePlan() {
    if (selectedCodes.length === 0) {
      setError(
        "Select at least one module before saving.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await api.savePlan({
        semester: semester.trim(),
        module_codes: selectedCodes,
      });

      setSuccess(
        data?.message ||
          `Plan saved for ${semester}.`,
      );

      await loadModules();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save your semester plan.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="h-[520px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-[420px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>
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
      {/* Header */}

      <motion.div variants={fadeUp}>
        <Badge variant="primary">
          <CalendarDays className="size-3.5" />
          Semester planner
        </Badge>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Build your semester
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Select your upcoming modules, balance
          your credit load and check your plan
          before saving it.
        </p>
      </motion.div>

      {/* Messages */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />

            <p className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10"
          >
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />

            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {success}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}

      <motion.div
        variants={fadeUp}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* Module browser */}

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-100 p-5 sm:p-6 dark:border-zinc-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-brand-500" />

                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                    Choose modules
                  </h2>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  Select the modules you want to
                  include in this semester.
                </p>
              </div>

              <div className="w-full lg:w-52">
                <label className="mb-1.5 block text-[11px] font-semibold text-zinc-500">
                  Semester
                </label>

                <input
                  value={semester}
                  onChange={(event) => {
                    setSemester(
                      event.target.value,
                    );
                    setPlan(null);
                  }}
                  placeholder="2026-S2"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
            </div>

            {/* Search */}

            <div className="relative mt-5">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search modules by code, name or category..."
                className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-950"
              />
            </div>

            {/* Filters */}

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {[
                ["eligible", "Eligible"],
                ["compulsory", "Compulsory"],
                ["elective", "Electives"],
                ["locked", "Unavailable"],
                ["all", "All modules"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {filteredModules.length} modules
              </p>

              <p className="text-xs font-medium text-brand-600 dark:text-brand-400">
                {selectedCodes.length} selected
              </p>
            </div>

            {filteredModules.length === 0 ? (
              <div className="py-14 text-center">
                <Search className="mx-auto size-6 text-zinc-300" />

                <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No modules found
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Try changing your search or
                  filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredModules.map(
                  (module) => (
                    <ModuleCard
                      key={module.code}
                      module={module}
                      selected={selectedCodes.includes(
                        module.code,
                      )}
                      onToggle={toggleModule}
                      onModuleClick={
                        onModuleClick
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Plan Sidebar */}

        <div className="space-y-4 xl:sticky xl:top-6">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Your semester plan
                  </p>

                  <h2 className="mt-1 font-semibold text-zinc-950 dark:text-white">
                    {semester || "Semester"}
                  </h2>
                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <GraduationCap className="size-5" />
                </div>
              </div>
            </div>

            {/* Credits */}

            <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-zinc-500">
                    Credit load
                  </p>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                      {totalCredits}
                    </span>

                    <span className="text-xs text-zinc-400">
                      / 60
                    </span>
                  </div>
                </div>

                <Badge
                  variant={creditStatus.tone}
                >
                  {creditStatus.label}
                </Badge>
              </div>

              <div className="mt-4">
                <Progress
                  value={Math.min(
                    (totalCredits / 60) * 100,
                    100,
                  )}
                />
              </div>

              <div className="mt-3 flex justify-between text-[11px] text-zinc-400">
                <span>Recommended: 45</span>
                <span>Maximum: 60</span>
              </div>
            </div>

            {/* Counts */}

            <div className="grid grid-cols-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="p-4 text-center">
                <p className="text-lg font-bold text-zinc-950 dark:text-white">
                  {selectedCodes.length}
                </p>
                <p className="text-[10px] text-zinc-400">
                  Modules
                </p>
              </div>

              <div className="border-x border-zinc-100 p-4 text-center dark:border-zinc-800">
                <p className="text-lg font-bold text-zinc-950 dark:text-white">
                  {compulsoryCount}
                </p>
                <p className="text-[10px] text-zinc-400">
                  Compulsory
                </p>
              </div>

              <div className="p-4 text-center">
                <p className="text-lg font-bold text-zinc-950 dark:text-white">
                  {electiveCount}
                </p>
                <p className="text-[10px] text-zinc-400">
                  Electives
                </p>
              </div>
            </div>

            {/* Selected */}

            <div className="p-5">
              {selectedModules.length === 0 ? (
                <div className="py-7 text-center">
                  <Layers3 className="mx-auto size-6 text-zinc-300" />

                  <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No modules selected
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Choose modules from the list
                    to build your plan.
                  </p>
                </div>
              ) : (
                <div className="max-h-[310px] space-y-2 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {selectedModules.map(
                      (module) => (
                        <SelectedModule
                          key={module.code}
                          module={module}
                          onRemove={
                            removeModule
                          }
                          onModuleClick={
                            onModuleClick
                          }
                        />
                      ),
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                type="button"
                onClick={generatePlan}
                disabled={
                  generating ||
                  selectedCodes.length === 0
                }
                className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}

                Analyse plan
              </button>

              <button
                type="button"
                onClick={savePlan}
                disabled={
                  saving ||
                  selectedCodes.length === 0
                }
                className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save semester plan"}
              </button>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Analysis Result */}

      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            {/* Validation */}

            <Card className="overflow-hidden">
              <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      plan.is_valid
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {plan.is_valid ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <AlertTriangle className="size-4" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Plan analysis
                    </h3>

                    <p className="text-xs text-zinc-500">
                      {plan.is_valid
                        ? "Your selected workload is within the recommended range."
                        : "Your plan has some recommendations to review."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                    <p className="text-[10px] uppercase text-zinc-400">
                      Credits
                    </p>
                    <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {plan.total_credits}
                    </p>
                  </div>

                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                    <p className="text-[10px] uppercase text-zinc-400">
                      Compulsory
                    </p>
                    <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {plan.compulsory_count}
                    </p>
                  </div>

                  <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                    <p className="text-[10px] uppercase text-zinc-400">
                      Electives
                    </p>
                    <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {plan.elective_count}
                    </p>
                  </div>
                </div>

                {plan.warnings?.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    {plan.warnings.map(
                      (warning, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 rounded-lg bg-amber-500/[0.07] px-3 py-2.5"
                        >
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />

                          <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                            {warning}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-500/[0.07] px-3 py-3">
                    <CheckCircle2 className="size-4 text-emerald-500" />

                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      No planning warnings detected.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Recommendations */}

            <Card className="overflow-hidden">
              <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Sparkles className="size-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Recommended modules
                    </h3>

                    <p className="text-xs text-zinc-500">
                      Compulsory modules worth
                      considering.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {plan.recommended_modules
                  ?.length > 0 ? (
                  <div className="space-y-2">
                    {plan.recommended_modules.map(
                      (module) => (
                        <button
                          key={module.code}
                          type="button"
                          onClick={() => {
                            if (
                              module.is_eligible &&
                              !selectedCodes.includes(
                                module.code,
                              )
                            ) {
                              toggleModule(module);
                            }
                          }}
                          className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/[0.05]"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <BookOpen className="size-3.5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                              {module.code}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                              {module.name}
                            </p>
                          </div>

                          <span className="text-xs font-semibold text-zinc-500">
                            {module.credits} cr
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="py-7 text-center">
                    <CheckCircle2 className="mx-auto size-6 text-emerald-500" />

                    <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      No additional recommendations
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Your current module selection
                      covers the immediate
                      recommendations.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}