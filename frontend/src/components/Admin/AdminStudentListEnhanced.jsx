// frontend/src/components/admin/AdminStudentListEnhanced.jsx
import { useState, useEffect } from "react";
import { api } from "../../api";
import Card from "../Card"; // Import existing Card or define inline

function AdminStudentListEnhanced({ onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Sorting state
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [programmes, setProgrammes] = useState([]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search) params.q = search;
      if (programmeFilter) params.programme_code = programmeFilter;
      if (yearFilter) params.current_year = parseInt(yearFilter);
      if (statusFilter !== "") params.is_active = statusFilter === "active";

      const response = await api.adminListStudents(params);
      setStudents(response.students);
      setTotal(response.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, limit, sortBy, sortOrder, programmeFilter, yearFilter, statusFilter, search]);

  useEffect(() => {
    api.listProgrammes().then(setProgrammes).catch(() => {});
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card title="Students">
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <input
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadStudents()}
        />
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
        >
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.code} value={p.code}>{p.code}</option>
          ))}
        </select>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="">All years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => setPage(1)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
        >
          Apply Filters
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-400">No students found.</p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-medium cursor-pointer hover:text-slate-700" onClick={() => handleSort("name")}>
                    Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-2 font-medium cursor-pointer hover:text-slate-700" onClick={() => handleSort("student_number")}>
                    Student # {sortBy === "student_number" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-2 font-medium cursor-pointer hover:text-slate-700" onClick={() => handleSort("programme")}>
                    Programme {sortBy === "programme" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-2 font-medium cursor-pointer hover:text-slate-700" onClick={() => handleSort("year")}>
                    Year {sortBy === "year" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-2 font-medium cursor-pointer hover:text-slate-700" onClick={() => handleSort("average")}>
                    Avg {sortBy === "average" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <td className="py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 text-slate-600">{s.student_number}</td>
                    <td className="py-2 text-slate-600">{s.programme.code}</td>
                    <td className="py-2 text-slate-600">{s.current_year}</td>
                    <td className="py-2 text-slate-600">{s.weighted_average ?? "—"}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-slate-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex gap-2 items-center">
              <select
                className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default AdminStudentListEnhanced;