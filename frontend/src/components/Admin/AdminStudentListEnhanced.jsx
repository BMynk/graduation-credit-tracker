import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  GraduationCap,
  RefreshCw,
  Search,
  UserCheck,
  UserRound,
  Users,
  UserX,
  X,
} from "lucide-react";
import { api } from "../../api";

const PAGE_SIZE = 20;

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

function getProgrammeCode(student) {
  return (
    student.programme_code ||
    student.programme?.code ||
    "—"
  );
}

function getProgrammeName(student) {
  return (
    student.programme_name ||
    student.programme?.name ||
    ""
  );
}

function StatCard({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    blue:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    zinc:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  };

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
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
          className={`flex size-10 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function AdminStudentListEnhanced({
  onSelectStudent,
}) {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [programme, setProgramme] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setLoading(true);
      setError("");

      try {
        const params = {
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
          sort_by: sortBy,
          sort_order: sortOrder,
        };

        if (search) params.q = search;
        if (programme) params.programme_code = programme;
        if (year) params.current_year = year;
        if (status !== "") params.is_active = status;

        const data = await api.adminListStudents(params);

        if (!cancelled) {
          setStudents(
            Array.isArray(data?.students) ? data.students : []
          );
          setTotal(Number(data?.total || 0));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load students.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [
    search,
    programme,
    year,
    status,
    sortBy,
    sortOrder,
    page,
    refreshKey,
  ]);

  const programmeOptions = useMemo(() => {
    const values = students
      .map(getProgrammeCode)
      .filter((value) => value && value !== "—");

    return [...new Set(values)].sort();
  }, [students]);

  const activeOnPage = students.filter(
    (student) => student.is_active
  ).length;

  const inactiveOnPage =
    students.length - activeOnPage;

  const pageCount = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const startResult =
    total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endResult = Math.min(
    page * PAGE_SIZE,
    total
  );

  const hasFilters =
    searchInput ||
    programme ||
    year ||
    status !== "";

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setProgramme("");
    setYear("");
    setStatus("");
    setPage(1);
  }

  function toggleSort(field) {
    if (sortBy === field) {
      setSortOrder((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }

    setPage(1);
  }

  function SortButton({ field, children }) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 transition hover:text-blue-600"
      >
        {children}
        <ChevronsUpDown
          size={12}
          className={
            sortBy === field
              ? "text-blue-600"
              : "text-zinc-300"
          }
        />
      </button>
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
      {/* Header */}
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 dark:border-blue-950 dark:from-blue-950/20 dark:via-zinc-950 dark:to-violet-950/20 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            <Users size={14} />
            Student Management
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Students
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Search, filter and manage student records across
            programmes and academic years.
          </p>
        </div>
      </motion.section>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Students"
          value={total}
          helper="Matching current filters"
          tone="blue"
        />

        <StatCard
          icon={UserCheck}
          label="Active"
          value={activeOnPage}
          helper="On this page"
          tone="emerald"
        />

        <StatCard
          icon={UserX}
          label="Inactive"
          value={inactiveOnPage}
          helper="On this page"
          tone="zinc"
        />

        <StatCard
          icon={GraduationCap}
          label="Programmes"
          value={programmeOptions.length}
          helper="Visible on this page"
          tone="violet"
        />
      </div>

      {/* Filters */}
      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search name, student number or email..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setRefreshKey((key) => key + 1)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={programme}
              onChange={(event) => {
                setProgramme(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <option value="">All programmes</option>

              {programmeOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <option value="">All years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {hasFilters && (
            <div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-red-600"
              >
                <X size={13} />
                Clear filters
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* Table */}
      <motion.section
        variants={fadeUp}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-900">
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-white">
              Student directory
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {total
                ? `Showing ${startResult}–${endResult} of ${total}`
                : "No students to display"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          </div>
        ) : loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-zinc-500">
                Loading students...
              </p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
              <UserRound size={22} />
            </div>

            <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">
              No students found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              {hasFilters
                ? "No student records match your current filters."
                : "There are currently no student records."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left text-xs font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-900/40">
                    <th className="px-5 py-3">
                      <SortButton field="name">
                        Student
                      </SortButton>
                    </th>

                    <th className="px-4 py-3">
                      <SortButton field="student_number">
                        Student number
                      </SortButton>
                    </th>

                    <th className="px-4 py-3">
                      <SortButton field="programme">
                        Programme
                      </SortButton>
                    </th>

                    <th className="px-4 py-3">
                      <SortButton field="year">
                        Year
                      </SortButton>
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>

                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() =>
                        onSelectStudent?.(student.id)
                      }
                      className="group cursor-pointer transition hover:bg-blue-50/40 dark:hover:bg-blue-950/10"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                            {(student.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                              {student.name}
                            </p>

                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-zinc-400">
                              {student.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {student.student_number}
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {getProgrammeCode(student)}
                          </p>

                          {getProgrammeName(student) && (
                            <p className="max-w-[160px] truncate text-xs text-zinc-400">
                              {getProgrammeName(student)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {student.current_year
                          ? `Year ${student.current_year}`
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          active={student.is_active}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <ChevronRight
                          size={17}
                          className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900 md:hidden">
              {students.map((student) => (
                <button
                  type="button"
                  key={student.id}
                  onClick={() =>
                    onSelectStudent?.(student.id)
                  }
                  className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/40">
                    {(student.name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                        {student.name}
                      </p>

                      <StatusBadge
                        active={student.is_active}
                      />
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      {student.student_number} ·{" "}
                      {getProgrammeCode(student)}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-400">
                      {student.current_year
                        ? `Year ${student.current_year}`
                        : "Year not set"}
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="shrink-0 text-zinc-300"
                  />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {page} of {pageCount}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pageCount, current + 1)
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}