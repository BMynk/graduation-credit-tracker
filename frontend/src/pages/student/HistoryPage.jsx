import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownUp,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function normalizeStatus(status = "") {
  return String(status)
    .toLowerCase()
    .replaceAll("_", "-")
    .trim();
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed" || normalized === "passed") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3.5" />
        Completed
      </Badge>
    );
  }

  if (normalized === "failed") {
    return (
      <Badge variant="danger">
        <AlertCircle className="size-3.5" />
        Failed
      </Badge>
    );
  }

  if (
    normalized === "in-progress" ||
    normalized === "in progress"
  ) {
    return (
      <Badge variant="warning">
        <Clock3 className="size-3.5" />
        In progress
      </Badge>
    );
  }

  if (normalized === "planned") {
    return (
      <Badge variant="primary">
        <BookOpen className="size-3.5" />
        Planned
      </Badge>
    );
  }

  return (
    <Badge variant="neutral">
      {status || "Unknown"}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
              {title}
            </p>

            <p className="tabular-nums mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {value}
            </p>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>

          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function HistoryPage({
  history = [],
  onModuleClick,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] =
    useState("all");
  const [sortDirection, setSortDirection] =
    useState("newest");

  const completed = useMemo(
    () =>
      history.filter((item) => {
        const status = normalizeStatus(item.status);

        return status === "completed" || status === "passed";
      }),
    [history],
  );

  const failed = useMemo(
    () =>
      history.filter(
        (item) => normalizeStatus(item.status) === "failed",
      ),
    [history],
  );

  const graded = useMemo(
    () =>
      history.filter(
        (item) =>
          item.grade !== null &&
          item.grade !== undefined &&
          !Number.isNaN(Number(item.grade)),
      ),
    [history],
  );

  const average =
    graded.length > 0
      ? graded.reduce(
          (total, item) => total + Number(item.grade),
          0,
        ) / graded.length
      : null;

  const totalCredits = completed.reduce(
    (total, item) =>
      total + Number(item.module?.credits || 0),
    0,
  );

  const semesters = useMemo(() => {
    return [
      ...new Set(
        history
          .map((item) => item.semester)
          .filter(Boolean),
      ),
    ].sort((a, b) => String(b).localeCompare(String(a)));
  }, [history]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = history.filter((item) => {
      const code = item.module?.code?.toLowerCase() || "";
      const name = item.module?.name?.toLowerCase() || "";
      const status = normalizeStatus(item.status);

      const matchesSearch =
        !query ||
        code.includes(query) ||
        name.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed"
          ? status === "completed" || status === "passed"
          : status === statusFilter);

      const matchesSemester =
        semesterFilter === "all" ||
        item.semester === semesterFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSemester
      );
    });

    return [...results].sort((a, b) => {
      const semesterA = String(a.semester || "");
      const semesterB = String(b.semester || "");

      if (sortDirection === "oldest") {
        return semesterA.localeCompare(semesterB);
      }

      return semesterB.localeCompare(semesterA);
    });
  }, [
    history,
    search,
    statusFilter,
    semesterFilter,
    sortDirection,
  ]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className="space-y-6"
    >
      {/* Page heading */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2">
          <Badge variant="primary">
            <GraduationCap className="size-3.5" />
            Academic record
          </Badge>
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Academic history
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Review your completed, attempted and planned
          modules throughout your degree.
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Completed"
          value={completed.length}
          description="modules successfully completed"
          icon={CheckCircle2}
          iconClassName="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
        />

        <StatCard
          title="Average mark"
          value={
            average !== null
              ? `${average.toFixed(1)}%`
              : "—"
          }
          description="across recorded grades"
          icon={GraduationCap}
          iconClassName="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
        />

        <StatCard
          title="Credits earned"
          value={totalCredits}
          description="from completed modules"
          icon={BookOpen}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        />

        <StatCard
          title="Failed"
          value={failed.length}
          description={
            failed.length === 1
              ? "module attempt recorded"
              : "module attempts recorded"
          }
          icon={AlertCircle}
          iconClassName={
            failed.length > 0
              ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          }
        />
      </div>

      {/* History */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  Module history
                </h2>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Click any module to view its full details.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {/* Search */}
                <div className="relative min-w-0 sm:w-64">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden="true"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search modules..."
                    aria-label="Search academic history"
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                {/* Status */}
                <div className="relative">
                  <SlidersHorizontal
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden="true"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    aria-label="Filter by status"
                    className="h-10 min-w-36 appearance-none rounded-lg border border-zinc-200 bg-white pl-9 pr-8 text-sm text-zinc-700 transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <option value="all">
                      All statuses
                    </option>
                    <option value="completed">
                      Completed
                    </option>
                    <option value="failed">
                      Failed
                    </option>
                    <option value="in-progress">
                      In progress
                    </option>
                    <option value="planned">
                      Planned
                    </option>
                  </select>
                </div>

                {/* Semester */}
                <select
                  value={semesterFilter}
                  onChange={(event) =>
                    setSemesterFilter(event.target.value)
                  }
                  aria-label="Filter by semester"
                  className="h-10 min-w-36 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <option value="all">
                    All semesters
                  </option>

                  {semesters.map((semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      {semester}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <button
                  type="button"
                  onClick={() =>
                    setSortDirection((current) =>
                      current === "newest"
                        ? "oldest"
                        : "newest",
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ArrowDownUp className="size-4" />

                  {sortDirection === "newest"
                    ? "Newest"
                    : "Oldest"}
                </button>
              </div>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <BookOpen className="size-6" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">
                No academic history yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
                Your modules and grades will appear here
                once they have been recorded.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Search className="mx-auto size-6 text-zinc-400" />

              <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                No matching modules
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSemesterFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left dark:border-zinc-800 dark:bg-zinc-900/60">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                        Module
                      </th>

                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                        Credits
                      </th>

                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                        Semester
                      </th>

                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                        Grade
                      </th>

                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                        Attempt
                      </th>

                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                        Status
                      </th>

                      <th
                        className="w-12 px-4 py-3"
                        aria-label="Actions"
                      />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        role="button"
                        onClick={() =>
                          onModuleClick?.(
                            item.module?.code,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();

                            onModuleClick?.(
                              item.module?.code,
                            );
                          }
                        }}
                        className="group cursor-pointer border-b border-zinc-100 transition last:border-0 hover:bg-zinc-50 focus:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40 dark:focus:bg-zinc-800/40"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
                            {item.module?.code}
                          </p>

                          <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-500">
                            {item.module?.name}
                          </p>
                        </td>

                        <td className="tabular-nums px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {item.module?.credits ?? "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {item.semester || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`tabular-nums text-sm font-semibold ${
                              item.grade == null
                                ? "text-zinc-400"
                                : Number(item.grade) >= 50
                                  ? "text-zinc-900 dark:text-white"
                                  : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {item.grade != null
                              ? `${item.grade}%`
                              : "—"}
                          </span>
                        </td>

                        <td className="tabular-nums px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {item.attempt ?? "—"}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={item.status}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <ChevronRight className="size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-zinc-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onModuleClick?.(item.module?.code)
                    }
                    className="w-full p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
                          {item.module?.code}
                        </p>

                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {item.module?.name}
                        </p>
                      </div>

                      <StatusBadge
                        status={item.status}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Credits
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {item.module?.credits ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Semester
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {item.semester || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Grade
                        </p>

                        <p className="tabular-nums mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {item.grade != null
                            ? `${item.grade}%`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                          Attempt
                        </p>

                        <p className="tabular-nums mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {item.attempt ?? "—"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-2 border-t border-zinc-100 px-5 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {filteredHistory.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {history.length}
                  </span>{" "}
                  records
                </p>

                {(search ||
                  statusFilter !== "all" ||
                  semesterFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setSemesterFilter("all");
                    }}
                    className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}