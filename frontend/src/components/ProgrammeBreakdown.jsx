import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
  X,
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

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function percent(value, digits = 1) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${Number(value).toFixed(digits)}%`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
}) {
  const tones = {
    blue:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  };

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {helper}
          </p>
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </motion.div>
  );
}

function ProgressRow({ label, value, tone = "blue" }) {
  const widths = Math.min(Math.max(Number(value || 0), 0), 100);

  const colors = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {label}
        </span>

        <span className="text-sm font-semibold text-zinc-950 dark:text-white">
          {percent(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widths}%` }}
          transition={{ duration: 0.7 }}
          className={`h-full rounded-full ${colors[tone]}`}
        />
      </div>
    </div>
  );
}

function ProgrammeDetail({ programme, onBack }) {
  const bottlenecks = programme.bottleneck_modules || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        All programmes
      </button>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 p-6 dark:border-zinc-900">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <GraduationCap size={23} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
                    {programme.programme_code}
                  </h2>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {programme.student_count} active
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  {programme.programme_name}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <p className="text-xs font-medium text-zinc-500">
                Students
              </p>
              <p className="mt-1 text-xl font-semibold dark:text-white">
                {programme.student_count}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <p className="text-xs font-medium text-zinc-500">
                Avg. completion
              </p>
              <p className="mt-1 text-xl font-semibold dark:text-white">
                {percent(programme.avg_percentage_complete)}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/60">
              <p className="text-xs font-medium text-zinc-500">
                Weighted average
              </p>
              <p className="mt-1 text-xl font-semibold dark:text-white">
                {percent(programme.avg_weighted_average)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp
              size={18}
              className="text-blue-600"
            />

            <h3 className="font-semibold text-zinc-950 dark:text-white">
              Academic performance
            </h3>
          </div>

          <div className="mt-5 space-y-5">
            <ProgressRow
              label="Average degree completion"
              value={programme.avg_percentage_complete}
              tone="blue"
            />

            <ProgressRow
              label="Average academic performance"
              value={programme.avg_weighted_average}
              tone="emerald"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={18}
                className={
                  bottlenecks.length
                    ? "text-amber-500"
                    : "text-emerald-500"
                }
              />

              <h3 className="font-semibold text-zinc-950 dark:text-white">
                Bottleneck modules
              </h3>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Modules with recurring recorded failures.
            </p>
          </div>

          {bottlenecks.length > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              {bottlenecks.length} identified
            </span>
          )}
        </div>

        {bottlenecks.length === 0 ? (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-950 dark:bg-emerald-950/20">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              No bottleneck modules
            </p>

            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              No failed modules currently appear in this programme's
              bottleneck list.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-900">
            {bottlenecks.map((module, index) => (
              <div
                key={module.code}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {module.code}
                    </p>

                    <p className="truncate text-xs text-zinc-500">
                      {module.name}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {module.fail_count}{" "}
                  {module.fail_count === 1
                    ? "failure"
                    : "failures"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

export default function ProgrammeBreakdownView() {
  const [programmes, setProgrammes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetProgrammeBreakdown()
      .then((data) => {
        setProgrammes(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedProgramme = useMemo(
    () =>
      programmes.find(
        (programme) =>
          programme.programme_code === selectedCode
      ),
    [programmes, selectedCode]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return programmes;

    return programmes.filter((programme) =>
      `${programme.programme_code} ${programme.programme_name}`
        .toLowerCase()
        .includes(query)
    );
  }, [programmes, search]);

  const summary = useMemo(() => {
    const totalStudents = programmes.reduce(
      (sum, item) => sum + Number(item.student_count || 0),
      0
    );

    const validAverages = programmes.filter(
      (item) =>
        item.avg_weighted_average !== null &&
        item.avg_weighted_average !== undefined
    );

    const average = validAverages.length
      ? validAverages.reduce(
          (sum, item) =>
            sum + Number(item.avg_weighted_average),
          0
        ) / validAverages.length
      : null;

    const bottlenecks = programmes.reduce(
      (sum, item) =>
        sum + (item.bottleneck_modules?.length || 0),
      0
    );

    return {
      totalStudents,
      average,
      bottlenecks,
    };
  }, [programmes]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-zinc-500">
            Loading programme analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05 },
        },
      }}
      className="space-y-6 pb-8"
    >
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 dark:border-violet-950 dark:from-violet-950/20 dark:via-zinc-950 dark:to-blue-950/20 sm:p-7"
      >
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <BarChart3 size={14} />
            Programme Analytics
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Programme breakdown
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Compare programme performance and drill into a
            programme for detailed academic insights.
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Programmes"
          value={programmes.length}
          helper="Programmes monitored"
        />

        <StatCard
          icon={Users}
          label="Active Students"
          value={summary.totalStudents}
          helper="Across programmes"
          tone="emerald"
        />

        <StatCard
          icon={TrendingUp}
          label="Avg. Performance"
          value={percent(summary.average)}
          helper="Programme-level mean"
          tone="violet"
        />

        <StatCard
          icon={AlertTriangle}
          label="Bottlenecks"
          value={summary.bottlenecks}
          helper="Across programme lists"
          tone="amber"
        />
      </div>

      <AnimatePresence mode="wait">
        {selectedProgramme ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProgrammeDetail
              programme={selectedProgramme}
              onBack={() => setSelectedCode(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-zinc-950 dark:text-white">
                    Programme comparison
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Active student population by programme.
                  </p>
                </div>
              </div>

              {programmes.length > 0 && (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={programmes}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.15}
                      />

                      <XAxis
                        dataKey="programme_code"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="student_count"
                        fill="#3B6FF5"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="border-b border-zinc-100 p-5 dark:border-zinc-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-zinc-950 dark:text-white">
                      All programmes
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Select a programme to view its full analysis.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    />

                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_40px] border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-xs font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900/50 md:grid">
                <span>Programme</span>
                <span>Students</span>
                <span>Completion</span>
                <span>Average</span>
                <span />
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filtered.map((programme) => (
                  <button
                    key={programme.programme_code}
                    onClick={() =>
                      setSelectedCode(programme.programme_code)
                    }
                    className="group grid w-full gap-3 px-5 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50 md:grid-cols-[1.5fr_0.7fr_0.8fr_0.8fr_40px] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                          <BookOpen size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-white">
                            {programme.programme_code}
                          </p>

                          <p className="truncate text-xs text-zinc-500">
                            {programme.programme_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="mr-2 text-xs text-zinc-400 md:hidden">
                        Students:
                      </span>
                      {programme.student_count}
                    </div>

                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="mr-2 text-xs text-zinc-400 md:hidden">
                        Completion:
                      </span>
                      {percent(
                        programme.avg_percentage_complete
                      )}
                    </div>

                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="mr-2 text-xs text-zinc-400 md:hidden">
                        Average:
                      </span>
                      {percent(
                        programme.avg_weighted_average
                      )}
                    </div>

                    <ChevronRight
                      size={17}
                      className="hidden text-zinc-300 transition group-hover:translate-x-1 group-hover:text-blue-500 md:block"
                    />
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <BookOpen
                    size={25}
                    className="mx-auto text-zinc-300"
                  />

                  <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No programmes found
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Try another programme name or code.
                  </p>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}