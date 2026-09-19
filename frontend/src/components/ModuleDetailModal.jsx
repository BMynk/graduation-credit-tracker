import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Code2,
  FileText,
  GraduationCap,
  Layers3,
  Link2,
  Loader2,
  LockKeyholeOpen,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import { api } from "../api";

function normalizeStatus(status = "") {
  return String(status).toLowerCase().replaceAll("_", "-").trim();
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed" || normalized === "passed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        Completed
      </span>
    );
  }

  if (normalized === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <AlertCircle className="size-3.5" />
        Failed
      </span>
    );
  }

  if (normalized === "planned") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
        <BookOpen className="size-3.5" />
        Planned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {String(status || "Not taken").replaceAll("_", " ")}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon className="size-[18px]" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-zinc-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-white">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function ModulePill({ children }) {
  return (
    <span className="inline-flex rounded-lg bg-brand-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
      {children}
    </span>
  );
}

export default function ModuleDetailModal({
  moduleCode,
  isOpen,
  onClose,
}) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !moduleCode) return;

    let active = true;

    async function loadModule() {
      setLoading(true);
      setError("");
      setModule(null);

      try {
        const data = await api.getModuleDetail(moduleCode);

        if (active) {
          setModule(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "We couldn't load this module's details.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadModule();

    return () => {
      active = false;
    };
  }, [isOpen, moduleCode]);

  // Escape key closes the modal.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent the dashboard behind the modal from scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close module details"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="module-details-title"
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 18,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 10,
            }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700/80 dark:bg-[#111318]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-7 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <BookOpen className="size-5" />
                </div>

                <div>
                  <h2
                    id="module-details-title"
                    className="text-base font-semibold text-zinc-950 dark:text-white"
                  >
                    Module Details
                  </h2>

                  <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">
                    Full information about this module
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close module details"
                className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto">
              {loading && (
                <div className="flex min-h-[430px] flex-col items-center justify-center px-6">
                  <Loader2 className="size-8 animate-spin text-brand-500" />

                  <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Loading module details...
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Fetching {moduleCode}
                  </p>
                </div>
              )}

              {!loading && error && (
                <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    <AlertCircle className="size-6" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                    Unable to load module
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-zinc-500">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
                  >
                    Close
                  </button>
                </div>
              )}

              {!loading && module && (
                <div className="p-5 sm:p-7">
                  {/* Module hero */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mono text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
                          {module.code}
                        </h3>

                        <StatusBadge status={module.status} />

                        {module.is_compulsory === true && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                            <Sparkles className="size-3.5" />
                            Compulsory
                          </span>
                        )}

                        {module.is_compulsory === false && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400">
                            <GraduationCap className="size-3.5" />
                            Elective
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 text-lg font-semibold text-zinc-900 sm:text-xl dark:text-white">
                        {module.name}
                      </h4>

                      {module.description && (
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {module.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:flex-col">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                        <Code2 className="size-8" />
                      </div>

                      <div className="text-left sm:text-center">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Level {module.level ?? "—"}
                        </p>

                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {module.category || "Module"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main information strip */}
                  <div className="mt-6 grid overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/70 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <InfoItem
                      icon={Layers3}
                      label="Credits"
                      value={module.credits}
                    />

                    <div className="border-t border-zinc-200 sm:border-l sm:border-t-0 dark:border-zinc-800">
                      <InfoItem
                        icon={GraduationCap}
                        label="Level"
                        value={module.level}
                      />
                    </div>

                    <div className="border-t border-zinc-200 sm:border-l sm:border-t-0 dark:border-zinc-800">
                      <InfoItem
                        icon={BookOpen}
                        label="Category"
                        value={module.category}
                      />
                    </div>
                  </div>

                  {/* Prerequisites / Unlocks */}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2">
                        <Link2 className="size-[18px] text-brand-500" />

                        <h5 className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Prerequisites
                        </h5>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        Modules that should be completed before taking this module.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {module.prerequisites?.length > 0 ? (
                          module.prerequisites.map((code) => (
                            <ModulePill key={code}>
                              {code}
                            </ModulePill>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-400">
                            No prerequisites
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2">
                        <LockKeyholeOpen className="size-[18px] text-amber-500" />

                        <h5 className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Unlocks
                        </h5>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-zinc-500">
                        Modules that may become available after completing this one.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {module.unlocks?.length > 0 ? (
                          module.unlocks.map((code) => (
                            <ModulePill key={code}>
                              {code}
                            </ModulePill>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-400">
                            No dependent modules
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student result */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div
                      className={`rounded-xl border p-5 ${
                        normalizeStatus(module.status) === "failed"
                          ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
                          : module.grade != null
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Award
                          className={`size-5 ${
                            normalizeStatus(module.status) === "failed"
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        />

                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Your Result
                        </p>
                      </div>

                      <p
                        className={`tabular-nums mt-4 text-3xl font-bold ${
                          normalizeStatus(module.status) === "failed"
                            ? "text-red-600 dark:text-red-400"
                            : module.grade != null
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-zinc-500"
                        }`}
                      >
                        {module.grade != null
                          ? `${Number(module.grade).toFixed(
                              Number(module.grade) % 1 === 0 ? 0 : 1,
                            )}%`
                          : "—"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {module.grade != null
                          ? "Final recorded grade"
                          : "No grade has been recorded"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="size-5 text-brand-500" />

                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Attempt
                        </p>
                      </div>

                      <p className="tabular-nums mt-4 text-3xl font-bold text-zinc-950 dark:text-white">
                        {module.attempt ?? "—"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {module.attempt === 1
                          ? "First attempt"
                          : module.attempt
                            ? `Attempt number ${module.attempt}`
                            : "No attempt recorded"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <FileText className="size-[18px]" />
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Module Description
                        </h5>

                        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {module.description ||
                            "No description has been added for this module yet."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && module && (
              <div className="flex shrink-0 items-center justify-end border-t border-zinc-200 bg-zinc-50/70 px-5 py-4 sm:px-7 dark:border-zinc-800 dark:bg-zinc-900/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-[#111318]"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}