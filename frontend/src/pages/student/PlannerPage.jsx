import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  Layers3,
  Loader2,
  LockKeyhole,
  RotateCcw,
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

function normaliseYear(module) {
  const value =
    module.year ??
    module.curriculum_year ??
    module.academic_year ??
    module.level;

  const year = Number(value);

  return Number.isFinite(year) && year > 0
    ? year
    : 1;
}

function normaliseSemester(module) {
  const value =
    module.semester ??
    module.curriculum_semester ??
    module.module_semester;

  if (value === "S1" || value === "s1") return 1;
  if (value === "S2" || value === "s2") return 2;

  const semester = Number(value);

  return semester === 2 ? 2 : 1;
}

function getStudentYear(modules) {
  const explicitYears = modules
    .map(
      (module) =>
        module.current_year ??
        module.student_current_year ??
        module.student_year,
    )
    .map(Number)
    .filter(
      (year) =>
        Number.isFinite(year) && year > 0,
    );

  if (explicitYears.length > 0) {
    return Math.max(...explicitYears);
  }

  const availableYears = modules
    .filter((module) => module.is_eligible)
    .map(normaliseYear);

  if (availableYears.length > 0) {
    return Math.max(...availableYears);
  }

  return 1;
}

function isOutstandingModule(module, currentYear) {
  if (normaliseYear(module) >= currentYear) {
    return false;
  }

  if (
    module.is_failed === true ||
    module.failed === true ||
    module.needs_retake === true ||
    module.is_retake === true ||
    module.status === "failed" ||
    module.status === "outstanding"
  ) {
    return true;
  }

  return module.is_eligible === true;
}

function isRetakeModule(module, currentYear) {
  return (
    normaliseYear(module) < currentYear &&
    (
      module.is_failed === true ||
      module.failed === true ||
      module.needs_retake === true ||
      module.is_retake === true ||
      module.status === "failed"
    )
  );
}

function semesterLabel(semester) {
  return Number(semester) === 2
    ? "Semester 2"
    : "Semester 1";
}

function groupByYearAndSemester(modules) {
  const grouped = {};

  modules.forEach((module) => {
    const year = normaliseYear(module);
    const semester = normaliseSemester(module);

    if (!grouped[year]) {
      grouped[year] = {
        1: [],
        2: [],
      };
    }

    grouped[year][semester].push(module);
  });

  Object.values(grouped).forEach((yearGroup) => {
    [1, 2].forEach((semester) => {
      yearGroup[semester].sort((a, b) =>
        String(a.code).localeCompare(
          String(b.code),
        ),
      );
    });
  });

  return grouped;
}

function ModuleCard({
  module,
  selected,
  currentYear,
  onToggle,
  onModuleClick,
}) {
  const year = normaliseYear(module);
  const semester = normaliseSemester(module);

  const futureYear = year > currentYear;
  const outstanding = isOutstandingModule(
    module,
    currentYear,
  );
  const retake = isRetakeModule(
    module,
    currentYear,
  );

  const locked =
    futureYear || !module.is_eligible;

  let reason = module.reason;

  if (futureYear) {
    reason =
      `Year ${year} modules become available when you progress to Year ${year}.`;
  }

  if (!reason) {
    reason = module.is_eligible
      ? "Eligible to take"
      : "Not currently eligible";
  }

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
                  : outstanding
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
            }`}
          >
            {selected ? (
              <Check className="size-4" />
            ) : locked ? (
              <LockKeyhole className="size-4" />
            ) : retake ? (
              <RotateCcw className="size-4" />
            ) : (
              <BookOpen className="size-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                {module.code}
              </span>

              {module.is_compulsory ? (
                <Badge variant="primary">
                  Compulsory
                </Badge>
              ) : (
                <Badge variant="neutral">
                  Elective
                </Badge>
              )}

              {retake && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                  Retake
                </span>
              )}

              {!retake && outstanding && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Outstanding
                </span>
              )}

              {futureYear && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Future year
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {module.name}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <span>{module.credits} credits</span>
              <span>Year {year}</span>
              <span>
                {semesterLabel(semester)}
              </span>

              {module.category && (
                <span>{module.category}</span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            !locked
              ? outstanding
                ? "bg-amber-500/[0.07] text-amber-700 dark:text-amber-400"
                : "bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400"
          }`}
        >
          {reason}
        </div>
      </button>

      <button
        type="button"
        onClick={() =>
          onModuleClick?.(module.code)
        }
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-white"
        title="View module details"
      >
        <ChevronRight className="size-4" />
      </button>
    </motion.div>
  );
}

function SemesterGroup({
  semester,
  modules,
  currentYear,
  selectedCodes,
  onToggle,
  onModuleClick,
}) {
  if (!modules.length) return null;

  const compulsory = modules.filter(
    (module) => module.is_compulsory,
  ).length;

  const available = modules.filter(
    (module) =>
      module.is_eligible &&
      normaliseYear(module) <= currentYear,
  ).length;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-brand-500" />

          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {semesterLabel(semester)}
          </h4>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>
            {modules.length} modules
          </span>

          <span>
            {compulsory} compulsory
          </span>

          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {available} available
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-2">
        {modules.map((module) => (
          <ModuleCard
            key={module.code}
            module={module}
            selected={selectedCodes.includes(
              module.code,
            )}
            currentYear={currentYear}
            onToggle={onToggle}
            onModuleClick={onModuleClick}
          />
        ))}
      </div>
    </div>
  );
}

function YearGroup({
  year,
  modules,
  currentYear,
  selectedCodes,
  onToggle,
  onModuleClick,
  outstanding = false,
}) {
  const [open, setOpen] = useState(true);

  const moduleCount =
    modules[1].length + modules[2].length;

  if (moduleCount === 0) return null;

  const isCurrent = year === currentYear;
  const isFuture = year > currentYear;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              outstanding
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : isCurrent
                  ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : isFuture
                    ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isFuture ? (
              <LockKeyhole className="size-4" />
            ) : outstanding ? (
              <RotateCcw className="size-4" />
            ) : (
              <GraduationCap className="size-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Year {year}
              </h3>

              {outstanding && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Previous year
                </span>
              )}

              {isCurrent && (
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  Current year
                </span>
              )}

              {isFuture && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">
                  Locked
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              {outstanding
                ? "Outstanding modules carried forward from this year."
                : isCurrent
                  ? "Modules available during your current academic year."
                  : isFuture
                    ? `Available after progression to Year ${year}.`
                    : "Previous curriculum year."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-zinc-400">
            {moduleCount}
          </span>

          <ChevronDown
            className={`size-4 text-zinc-400 transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
              <SemesterGroup
                semester={1}
                modules={modules[1]}
                currentYear={currentYear}
                selectedCodes={selectedCodes}
                onToggle={onToggle}
                onModuleClick={onModuleClick}
              />

              <SemesterGroup
                semester={2}
                modules={modules[2]}
                currentYear={currentYear}
                selectedCodes={selectedCodes}
                onToggle={onToggle}
                onModuleClick={onModuleClick}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
        onClick={() =>
          onModuleClick?.(module.code)
        }
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
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

        <p className="mt-1 text-[10px] text-zinc-400">
          Year {normaliseYear(module)} ·{" "}
          {semesterLabel(
            normaliseSemester(module),
          )}
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

function RecommendationGroups({
  recommendations,
  currentYear,
  selectedCodes,
  onToggle,
}) {
  const grouped = useMemo(
    () =>
      groupByYearAndSemester(
        recommendations || [],
      ),
    [recommendations],
  );

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  if (!recommendations?.length) {
    return (
      <div className="py-7 text-center">
        <CheckCircle2 className="mx-auto size-6 text-emerald-500" />

        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          No additional recommendations
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          Your current module selection covers
          the immediate recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {years.map((year) => (
        <div
          key={year}
          className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Year {year}
              </p>

              <p className="text-[11px] text-zinc-500">
                {year < currentYear
                  ? "Outstanding previous-year modules"
                  : year === currentYear
                    ? "Current-year recommendations"
                    : "Future-year modules"}
              </p>
            </div>

            {year === currentYear && (
              <Badge variant="primary">
                Current
              </Badge>
            )}
          </div>

          {[1, 2].map((semester) => {
            const semesterModules =
              grouped[year][semester];

            if (!semesterModules.length) {
              return null;
            }

            return (
              <div
                key={semester}
                className="mb-4 last:mb-0"
              >
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  <CalendarDays className="size-3.5" />
                  {semesterLabel(semester)}
                </p>

                <div className="space-y-2">
                  {semesterModules.map(
                    (module) => {
                      const future =
                        normaliseYear(module) >
                        currentYear;

                      const available =
                        module.is_eligible &&
                        !future;

                      const selected =
                        selectedCodes.includes(
                          module.code,
                        );

                      return (
                        <button
                          key={module.code}
                          type="button"
                          disabled={
                            !available ||
                            selected
                          }
                          onClick={() =>
                            onToggle(module)
                          }
                          className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/[0.05]"
                        >
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                              available
                                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                            }`}
                          >
                            {available ? (
                              <BookOpen className="size-3.5" />
                            ) : (
                              <LockKeyhole className="size-3.5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                                {module.code}
                              </p>

                              {isRetakeModule(
                                module,
                                currentYear,
                              ) && (
                                <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 dark:text-red-400">
                                  Retake
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                              {module.name}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-zinc-500">
                              {module.credits} cr
                            </span>

                            {selected && (
                              <p className="mt-0.5 text-[9px] font-semibold text-emerald-600">
                                Selected
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
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

  const currentYear = useMemo(
    () => getStudentYear(modules),
    [modules],
  );

  const selectedModules = useMemo(
    () =>
      selectedCodes
        .map((code) =>
          modules.find(
            (module) =>
              module.code === code,
          ),
        )
        .filter(Boolean),
    [selectedCodes, modules],
  );

  const totalCredits = useMemo(
    () =>
      selectedModules.reduce(
        (sum, module) =>
          sum +
          Number(module.credits || 0),
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

      const future =
        normaliseYear(module) > currentYear;

      let matchesFilter = true;

      if (filter === "eligible") {
        matchesFilter =
          module.is_eligible && !future;
      }

      if (filter === "compulsory") {
        matchesFilter =
          module.is_compulsory &&
          module.is_eligible &&
          !future;
      }

      if (filter === "elective") {
        matchesFilter =
          !module.is_compulsory &&
          module.is_eligible &&
          !future;
      }

      if (filter === "locked") {
        matchesFilter =
          !module.is_eligible || future;
      }

      return matchesSearch && matchesFilter;
    });
  }, [
    modules,
    search,
    filter,
    currentYear,
  ]);

  const outstandingModules = useMemo(
    () =>
      filteredModules.filter((module) =>
        isOutstandingModule(
          module,
          currentYear,
        ),
      ),
    [filteredModules, currentYear],
  );

  const regularModules = useMemo(
    () =>
      filteredModules.filter(
        (module) =>
          !isOutstandingModule(
            module,
            currentYear,
          ),
      ),
    [filteredModules, currentYear],
  );

  const groupedOutstanding = useMemo(
    () =>
      groupByYearAndSemester(
        outstandingModules,
      ),
    [outstandingModules],
  );

  const groupedModules = useMemo(
    () =>
      groupByYearAndSemester(
        regularModules,
      ),
    [regularModules],
  );

  const outstandingYears = useMemo(
    () =>
      Object.keys(groupedOutstanding)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedOutstanding],
  );

  const curriculumYears = useMemo(
    () =>
      Object.keys(groupedModules)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedModules],
  );

  function toggleModule(module) {
    const future =
      normaliseYear(module) > currentYear;

    if (!module.is_eligible || future) {
      return;
    }

    setSelectedCodes((current) =>
      current.includes(module.code)
        ? current.filter(
            (code) =>
              code !== module.code,
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

      const data =
        await api.generatePlan({
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
      <motion.div variants={fadeUp}>
        <Badge variant="primary">
          <CalendarDays className="size-3.5" />
          Semester planner
        </Badge>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Build your semester
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Plan modules by academic year and
          semester while keeping prerequisites,
          progression and outstanding modules in
          view.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            Current year: Year {currentYear}
          </span>

          {outstandingModules.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {outstandingModules.length}{" "}
              outstanding
            </span>
          )}
        </div>
      </motion.div>

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

      <motion.div
        variants={fadeUp}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
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
                  Modules are organised by
                  curriculum year and semester.
                </p>
              </div>

              <div className="w-full lg:w-52">
                <label className="mb-1.5 block text-[11px] font-semibold text-zinc-500">
                  Planning period
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
              <div className="space-y-5">
                {outstandingYears.length > 0 && (
                  <div>
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="size-4 text-amber-500" />

                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Outstanding from previous
                          years
                        </h3>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        These modules remain
                        available while you continue
                        with your current year.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {outstandingYears.map(
                        (year) => (
                          <YearGroup
                            key={`outstanding-${year}`}
                            year={year}
                            modules={
                              groupedOutstanding[
                                year
                              ]
                            }
                            currentYear={
                              currentYear
                            }
                            selectedCodes={
                              selectedCodes
                            }
                            onToggle={
                              toggleModule
                            }
                            onModuleClick={
                              onModuleClick
                            }
                            outstanding
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

                {outstandingYears.length > 0 &&
                  curriculumYears.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  )}

                <div className="space-y-4">
                  {curriculumYears.map(
                    (year) => (
                      <YearGroup
                        key={year}
                        year={year}
                        modules={
                          groupedModules[year]
                        }
                        currentYear={
                          currentYear
                        }
                        selectedCodes={
                          selectedCodes
                        }
                        onToggle={toggleModule}
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
        </Card>

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

                  <p className="mt-1 text-[11px] text-zinc-500">
                    Year {currentYear}
                  </p>
                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <GraduationCap className="size-5" />
                </div>
              </div>
            </div>

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

      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 lg:grid-cols-2"
          >
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
                      Planning insights
                    </h3>

                    <p className="text-xs text-zinc-500">
                      Review your workload,
                      progression and module
                      selection.
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

                <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-brand-500" />

                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Academic position
                    </p>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    You are planning as a Year{" "}
                    {currentYear} student. Modules
                    from later curriculum years
                    remain unavailable until you
                    progress, while eligible
                    outstanding modules from earlier
                    years remain available.
                  </p>
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
                      No planning warnings
                      detected.
                    </p>
                  </div>
                )}
              </div>
            </Card>

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
                      Recommendations grouped by
                      academic year and semester.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <RecommendationGroups
                  recommendations={
                    plan.recommended_modules
                  }
                  currentYear={currentYear}
                  selectedCodes={selectedCodes}
                  onToggle={toggleModule}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}