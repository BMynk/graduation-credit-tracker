import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  GraduationCap,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  WandSparkles,
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

function ResultStat({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
}) {
  const tones = {
    blue: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    green:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500">
          {label}
        </p>

        <div
          className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-xs text-zinc-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function GradeInput({
  prediction,
  modules,
  usedCodes,
  onChange,
  onRemove,
  canRemove,
}) {
  const selectedModule = modules.find(
    (module) =>
      module.code === prediction.module_code,
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_150px_40px] md:items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Module
          </label>

          <select
            value={prediction.module_code}
            onChange={(event) =>
              onChange({
                ...prediction,
                module_code: event.target.value,
              })
            }
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          >
            <option value="">
              Select a module
            </option>

            {modules.map((module) => {
              const disabled =
                usedCodes.includes(module.code) &&
                module.code !== prediction.module_code;

              return (
                <option
                  key={module.code}
                  value={module.code}
                  disabled={disabled}
                >
                  {module.code} — {module.name}
                </option>
              );
            })}
          </select>

          {selectedModule && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedModule.credits != null && (
                <span className="text-[11px] text-zinc-400">
                  {selectedModule.credits} credits
                </span>
              )}

              {selectedModule.level != null && (
                <span className="text-[11px] text-zinc-400">
                  • Level {selectedModule.level}
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Predicted mark
          </label>

          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={prediction.predicted_grade}
              onChange={(event) =>
                onChange({
                  ...prediction,
                  predicted_grade:
                    event.target.value,
                })
              }
              placeholder="e.g. 70"
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-9 text-sm font-semibold text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
              %
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={!canRemove}
          onClick={onRemove}
          className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:hover:border-red-500/20 dark:hover:bg-red-500/10"
          title="Remove prediction"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function PredictorPage({
  eligible = [],
  summary,
}) {
  const [predictions, setPredictions] = useState([
    {
      id: Date.now(),
      module_code: "",
      predicted_grade: "",
    },
  ]);

  const [result, setResult] = useState(null);
  const [calculating, setCalculating] =
    useState(false);
  const [error, setError] = useState("");

  const usedCodes = predictions
    .map((prediction) => prediction.module_code)
    .filter(Boolean);

  const validPredictions = useMemo(
    () =>
      predictions.filter((prediction) => {
        const grade = Number(
          prediction.predicted_grade,
        );

        return (
          prediction.module_code &&
          prediction.predicted_grade !== "" &&
          Number.isFinite(grade) &&
          grade >= 0 &&
          grade <= 100
        );
      }),
    [predictions],
  );

  const simulatedAverage = useMemo(() => {
    if (validPredictions.length === 0) {
      return null;
    }

    return (
      validPredictions.reduce(
        (total, prediction) =>
          total +
          Number(prediction.predicted_grade),
        0,
      ) / validPredictions.length
    );
  }, [validPredictions]);

  function updatePrediction(id, next) {
    setPredictions((current) =>
      current.map((prediction) =>
        prediction.id === id
          ? next
          : prediction,
      ),
    );

    setResult(null);
    setError("");
  }

  function addPrediction() {
    setPredictions((current) => [
      ...current,
      {
        id:
          Date.now() +
          Math.random(),
        module_code: "",
        predicted_grade: "",
      },
    ]);
  }

  function removePrediction(id) {
    setPredictions((current) =>
      current.filter(
        (prediction) =>
          prediction.id !== id,
      ),
    );

    setResult(null);
    setError("");
  }

  function resetPredictor() {
    setPredictions([
      {
        id: Date.now(),
        module_code: "",
        predicted_grade: "",
      },
    ]);

    setResult(null);
    setError("");
  }

  async function calculatePrediction() {
    if (validPredictions.length === 0) {
      setError(
        "Add at least one module and enter a predicted mark between 0 and 100.",
      );
      return;
    }

    if (
      validPredictions.length !==
      predictions.length
    ) {
      setError(
        "Complete or remove any empty prediction rows before calculating.",
      );
      return;
    }

    try {
      setCalculating(true);
      setError("");

      const payload = {
        predictions: validPredictions.map(
          (prediction) => ({
            module_code:
              prediction.module_code,
            predicted_grade: Number(
              prediction.predicted_grade,
            ),
          }),
        ),
      };

      const data =
        await api.predictGrades(payload);

      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to calculate your prediction.",
      );
    } finally {
      setCalculating(false);
    }
  }

  const change = Number(result?.change || 0);

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
          <WandSparkles className="size-3.5" />
          Grade simulator
        </Badge>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Predict your grades
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Test different grade scenarios and see how
          future module results could affect your
          overall academic average.
        </p>
      </motion.div>

      {/* Current Position */}

      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-3"
      >
        <ResultStat
          icon={BarChart3}
          label="Current average"
          value={
            summary?.weighted_average != null
              ? `${Number(
                  summary.weighted_average,
                ).toFixed(1)}%`
              : "—"
          }
          helper="Overall average"
        />

        <ResultStat
          icon={GraduationCap}
          label="Credits earned"
          value={
            summary?.credits_completed ?? 0
          }
          helper="Completed credits"
          tone="violet"
        />

        <ResultStat
          icon={BookOpen}
          label="Modules available"
          value={eligible.length}
          helper="Eligible for prediction"
          tone="green"
        />
      </motion.div>

      {/* Predictor Workspace */}

      <motion.div
        variants={fadeUp}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.75fr)]"
      >
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="size-5 text-brand-500" />

                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  Build a scenario
                </h2>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Select modules and enter the marks
                you think you could achieve.
              </p>
            </div>

            <button
              type="button"
              onClick={resetPredictor}
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {eligible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-5 py-10 text-center dark:border-zinc-800">
                <BookOpen className="mx-auto size-6 text-zinc-300" />

                <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                  No eligible modules
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  There are currently no modules
                  available for grade prediction.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence>
                    {predictions.map(
                      (prediction) => (
                        <GradeInput
                          key={prediction.id}
                          prediction={prediction}
                          modules={eligible}
                          usedCodes={usedCodes}
                          canRemove={
                            predictions.length > 1
                          }
                          onChange={(next) =>
                            updatePrediction(
                              prediction.id,
                              next,
                            )
                          }
                          onRemove={() =>
                            removePrediction(
                              prediction.id,
                            )
                          }
                        />
                      ),
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={addPrediction}
                  disabled={
                    predictions.length >=
                    eligible.length
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-500 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-brand-500/10"
                >
                  <Plus className="size-4" />
                  Add another module
                </button>

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                    <p className="text-xs leading-5">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={calculatePrediction}
                  disabled={
                    calculating ||
                    validPredictions.length === 0
                  }
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {calculating ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Calculate impact
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </Card>

        {/* Scenario Preview */}

        <Card className="h-fit overflow-hidden">
          <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Scenario preview
            </p>

            <h2 className="mt-1 text-base font-semibold text-zinc-950 dark:text-white">
              Your predicted marks
            </h2>
          </div>

          <div className="p-5">
            {validPredictions.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <Target className="size-5" />
                </div>

                <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No predictions yet
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Enter marks to build your
                  scenario.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {validPredictions.map(
                    (prediction) => (
                      <div
                        key={prediction.id}
                        className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900"
                      >
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          {
                            prediction.module_code
                          }
                        </span>

                        <span
                          className={`text-sm font-bold ${
                            Number(
                              prediction.predicted_grade,
                            ) >= 50
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {
                            prediction.predicted_grade
                          }
                          %
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Scenario average
                      </p>

                      <p className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white">
                        {simulatedAverage?.toFixed(
                          1,
                        )}
                        %
                      </p>
                    </div>

                    <Badge variant="neutral">
                      {validPredictions.length}{" "}
                      {validPredictions.length ===
                      1
                        ? "module"
                        : "modules"}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Results */}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 10,
            }}
            transition={{
              duration: 0.35,
            }}
            className="space-y-6"
          >
            <Card className="overflow-hidden">
              <div className="border-b border-zinc-100 p-5 sm:p-6 dark:border-zinc-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Badge
                      variant={
                        change > 0
                          ? "success"
                          : change < 0
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {change > 0 ? (
                        <TrendingUp className="size-3.5" />
                      ) : change < 0 ? (
                        <TrendingDown className="size-3.5" />
                      ) : (
                        <Target className="size-3.5" />
                      )}

                      Prediction complete
                    </Badge>

                    <h2 className="mt-3 text-xl font-bold text-zinc-950 dark:text-white">
                      Projected academic impact
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      How this scenario changes
                      your overall average.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">
                        Current
                      </p>

                      <p className="mt-1 text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                        {result.current_weighted_average !=
                        null
                          ? `${Number(
                              result.current_weighted_average,
                            ).toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>

                    <ArrowRight className="size-5 text-zinc-300" />

                    <div className="text-right">
                      <p className="text-xs text-zinc-400">
                        Projected
                      </p>

                      <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">
                        {Number(
                          result.new_weighted_average,
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
                <ResultStat
                  icon={
                    change >= 0
                      ? TrendingUp
                      : TrendingDown
                  }
                  label="Average change"
                  value={`${
                    change > 0 ? "+" : ""
                  }${change.toFixed(1)}%`}
                  helper="Overall average"
                  tone={
                    change >= 0
                      ? "green"
                      : "amber"
                  }
                />

                <ResultStat
                  icon={BookOpen}
                  label="Credits simulated"
                  value={
                    result.credits_with_predictions ??
                    0
                  }
                  helper="Prediction credits"
                  tone="violet"
                />

                <ResultStat
                  icon={GraduationCap}
                  label="Total credits"
                  value={
                    result.total_credits_after ??
                    0
                  }
                  helper="After predictions"
                />
              </div>
            </Card>

            {/* Graduation impact */}

            {result.graduation_impact && (
              <Card className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <GraduationCap className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Graduation impact
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {
                        result.graduation_impact
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Warnings */}

            {result.eligibility_warnings
              ?.length > 0 && (
              <Card className="overflow-hidden">
                <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-4" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        Eligibility notes
                      </h3>

                      <p className="text-xs text-zinc-500">
                        Important considerations
                        for this scenario.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 p-5 dark:divide-zinc-800">
                  {result.eligibility_warnings.map(
                    (warning, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />

                        <p className="text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                          {warning}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </Card>
            )}

            {result.eligibility_warnings
              ?.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />

                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  No eligibility issues detected
                  for this scenario.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}