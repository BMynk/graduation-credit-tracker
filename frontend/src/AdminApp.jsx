// frontend/src/AdminApp.jsx
import { useEffect, useState } from "react";
import { api } from "./api";
import ProgrammeBreakdownView from "./components/ProgrammeBreakdown";
import AdminStudentListEnhanced from "./components/Admin/AdminStudentListEnhanced";
import AdminViewAsStudent from "./components/Admin/AdminViewAsStudent";
import AdminModuleList from "./components/Admin/AdminModuleList";
import AdminPrerequisiteManager from "./components/Admin/AdminPrerequisiteManager";
import AdminProgrammeModules from "./components/Admin/AdminProgrammeModules";
import AdminBulkEmail from "./components/Admin/AdminBulkEmail";
import AdminAccountManagement from "./components/Admin/AdminAccountManagement";


// ---------- Shared UI Components ----------
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      {title && <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

function SuccessBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-600 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

// ---------- Admin Login ----------
function AdminLogin({ onLoggedIn, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.adminLogin({ username, password });
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {onBack && (
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 mb-4">
            ← Back
          </button>
        )}
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin login</h1>
        <p className="text-slate-500 text-sm mb-6">Manage student records and marks</p>
        <Card>
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ---------- Create Student ----------
function CreateStudentForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    student_number: "",
    email: "",
    programme_code: "",
    current_year: 1,
  });
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listProgrammes().then(setProgrammes).catch((e) => setError(e.message));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await api.adminCreateStudent({
        ...form,
        current_year: Number(form.current_year),
      });
      setSuccess(`Student ${form.name} created. PIN: ${result.login_pin} (emailed to them).`);
      setForm({
        name: "",
        student_number: "",
        email: "",
        programme_code: "",
        current_year: 1,
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Add a student">
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Student number</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={form.student_number}
            onChange={(e) => update("student_number", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Current year</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={form.current_year}
            onChange={(e) => update("current_year", e.target.value)}
          >
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Programme</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={form.programme_code}
            onChange={(e) => update("programme_code", e.target.value)}
            required
          >
            <option value="" disabled>Select a programme</option>
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
        >
          {loading ? "Creating..." : "Create student"}
        </button>
      </form>
    </Card>
  );
}

// ---------- Bulk Upload ----------
function BulkUploadPanel() {
  const [studentsFile, setStudentsFile] = useState(null);
  const [marksFile, setMarksFile] = useState(null);
  const [studentsReport, setStudentsReport] = useState(null);
  const [marksReport, setMarksReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadStudents() {
    if (!studentsFile) return;
    setError("");
    setLoading(true);
    try {
      setStudentsReport(await api.adminUploadStudentsCsv(studentsFile));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadMarks() {
    if (!marksFile) return;
    setError("");
    setLoading(true);
    try {
      setMarksReport(await api.adminUploadMarksCsv(marksFile));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function ReportTable({ report }) {
    if (!report) return null;
    return (
      <div className="mt-3 text-sm">
        <p className="text-slate-600 mb-2">
          {report.succeeded} succeeded, {report.failed} failed out of {report.total_rows} rows.
        </p>
        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
          {report.results.map((r, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 border-b border-slate-50 last:border-0 flex justify-between ${r.status === "error" ? "bg-red-50" : ""}`}
            >
              <span>Row {r.row}: {r.identifier}</span>
              <span className={r.status === "error" ? "text-red-600" : "text-emerald-600"}>
                {r.status}
                {r.detail ? ` - ${r.detail}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Bulk upload students">
        <p className="text-xs text-slate-500 mb-3">
          CSV columns:{" "}
          <code className="bg-slate-100 px-1 rounded">
            name, student_number, email, programme_code, current_year
          </code>
          . Existing student numbers are updated.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setStudentsFile(e.target.files[0])}
          className="text-sm mb-3"
        />
        <button
          onClick={uploadStudents}
          disabled={!studentsFile || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Upload
        </button>
        <ReportTable report={studentsReport} />
      </Card>

      <Card title="Bulk upload marks">
        <p className="text-xs text-slate-500 mb-3">
          CSV columns:{" "}
          <code className="bg-slate-100 px-1 rounded">student_number, module_code, semester, grade</code>.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setMarksFile(e.target.files[0])}
          className="text-sm mb-3"
        />
        <button
          onClick={uploadMarks}
          disabled={!marksFile || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Upload
        </button>
        <ReportTable report={marksReport} />
      </Card>

      <div className="md:col-span-2">
        <ErrorBanner message={error} onDismiss={() => setError("")} />
      </div>
    </div>
  );
}

// ---------- Student Detail ----------
function StudentDetail({ studentId, onBack, onChanged }) {
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [markForm, setMarkForm] = useState({ module_code: "", semester: "", grade: "" });
  const [savingMark, setSavingMark] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    try {
      const [s, sum] = await Promise.all([
        api.adminGetStudent(studentId),
        api.adminGetStudentSummary(studentId),
      ]);
      setStudent(s);
      setSummary(sum);
      setEditForm({
        name: s.name,
        email: s.email,
        programme_code: s.programme.code,
        current_year: s.current_year,
        target_average: s.target_average,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [studentId]);

  useEffect(() => {
    api.listProgrammes().then(setProgrammes).catch(() => {});
  }, []);

  async function handleDeactivate() {
    if (!confirm(`Deactivate ${student.name}? They will no longer be able to log in.`)) return;
    try {
      await api.adminDeactivateStudent(studentId);
      setSuccess("Student deactivated.");
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRecordMark(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingMark(true);
    try {
      const result = await api.adminRecordMark(studentId, {
        module_code: markForm.module_code.trim().toUpperCase(),
        semester: markForm.semester.trim(),
        grade: Number(markForm.grade),
      });
      setSuccess(`${result.module.code} recorded as ${result.status} (grade ${result.grade}).`);
      setMarkForm({ module_code: "", semester: "", grade: "" });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMark(false);
    }
  }

  async function handleRegeneratePin() {
    if (!confirm(`Generate a new PIN for ${student.name}? Their old PIN will stop working.`)) return;
    try {
      const result = await api.adminRegeneratePin(studentId);
      setSuccess(`New PIN generated: ${result.login_pin} (also emailed to them).`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingEdit(true);
    try {
      await api.adminUpdateStudent(studentId, {
        ...editForm,
        current_year: Number(editForm.current_year),
        target_average: Number(editForm.target_average),
      });
      setSuccess("Student details updated.");
      setEditing(false);
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  if (!student) {
    return (
      <Card>
        <ErrorBanner message={error} />
        <p className="text-sm text-slate-400">Loading...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">
        ← Back to student list
      </button>
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

      <Card>
        {!editing ? (
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{student.name}</h2>
              <p className="text-sm text-slate-500">
                {student.student_number} · {student.email}
              </p>
              <p className="text-sm text-slate-500">
                {student.programme.name} · Year {student.current_year}
              </p>
              <p className="text-sm text-slate-500">Target average: {student.target_average}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <AdminViewAsStudent studentId={student.id} studentName={student.name} />
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
              >
                Edit details
              </button>
              <button
                onClick={handleDeactivate}
                className="text-xs text-red-500 hover:underline whitespace-nowrap"
              >
                Deactivate account
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveEdit} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Programme</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={editForm.programme_code}
                onChange={(e) => setEditForm((f) => ({ ...f, programme_code: e.target.value }))}
                required
              >
                {programmes.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Current year</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={editForm.current_year}
                onChange={(e) => setEditForm((f) => ({ ...f, current_year: e.target.value }))}
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target average</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={editForm.target_average}
                onChange={(e) => setEditForm((f) => ({ ...f, target_average: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={savingEdit}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
              >
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Card>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="text-xs text-slate-500">Credits completed</div>
            <div className="text-2xl font-bold text-slate-800">
              {summary.credits_completed}/{summary.credits_required}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Weighted average</div>
            <div className="text-2xl font-bold text-slate-800">
              {summary.weighted_average ?? "—"}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Failed - pending retake</div>
            <div className="text-2xl font-bold text-slate-800">
              {summary.modules_failed_pending_retake}
            </div>
          </Card>
        </div>
      )}

      <Card title="Record an official mark">
        <form onSubmit={handleRecordMark} className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Module code</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. COC223"
              value={markForm.module_code}
              onChange={(e) => setMarkForm((f) => ({ ...f, module_code: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 2025-S1"
              value={markForm.semester}
              onChange={(e) => setMarkForm((f) => ({ ...f, semester: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Grade</label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={markForm.grade}
              onChange={(e) => setMarkForm((f) => ({ ...f, grade: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingMark}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
          >
            {savingMark ? "Saving..." : "Record mark"}
          </button>
        </form>
      </Card>

      {summary && summary.failed_modules.length > 0 && (
        <Card title="Failed modules">
          <div className="space-y-2">
            {summary.failed_modules.map((f) => (
              <div
                key={f.module.code}
                className={`text-sm rounded-lg px-3 py-2 flex justify-between items-center ${
                  f.is_prerequisite_for_major
                    ? "bg-red-50 border border-red-200"
                    : "bg-slate-50"
                }`}
              >
                <span>
                  <span className="font-medium text-slate-800">{f.module.code}</span>{" "}
                  <span className="text-slate-500">{f.module.name}</span> — grade {f.grade}
                </span>
                {f.is_prerequisite_for_major && (
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    Blocks major
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------- Dashboard Home ----------
function DashboardHome({ onSelectStudent }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <div className="text-xs text-slate-500">Total students</div>
              <div className="text-2xl font-bold text-slate-800">{stats.total_students}</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500">Active students</div>
              <div className="text-2xl font-bold text-slate-800">{stats.active_students}</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500">Cohort average</div>
              <div className="text-2xl font-bold text-slate-800">{stats.cohort_average ?? "—"}</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500">At risk</div>
              <div className={`text-2xl font-bold ${stats.at_risk_count > 0 ? "text-red-600" : "text-slate-800"}`}>
                {stats.at_risk_count}
              </div>
            </Card>
          </div>

          <Card title="Students by programme">
            {stats.students_by_programme.length === 0 ? (
              <p className="text-sm text-slate-400">No students yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.students_by_programme.map((p) => {
                  const max = Math.max(
                    ...stats.students_by_programme.map((x) => x.student_count),
                    1
                  );
                  return (
                    <div key={p.programme_code}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{p.programme_name}</span>
                        <span className="text-slate-500">{p.student_count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${(p.student_count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="At-risk students">
            {stats.at_risk_students.length === 0 ? (
              <p className="text-sm text-emerald-600">No students currently flagged as at risk. 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-medium">Student</th>
                      <th className="py-2 font-medium">Programme</th>
                      <th className="py-2 font-medium">Average</th>
                      <th className="py-2 font-medium">Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.at_risk_students.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => onSelectStudent(s.id)}
                        className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50"
                      >
                        <td className="py-2">
                          <div className="font-medium text-slate-800">{s.name}</div>
                          <div className="text-slate-400 text-xs">{s.student_number}</div>
                        </td>
                        <td className="py-2 text-slate-600">{s.programme_code}</td>
                        <td className="py-2 text-slate-600">
                          {s.weighted_average ?? "—"}{" "}
                          <span className="text-slate-400">/ target {s.target_average}</span>
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {s.reasons.map((r, i) => (
                              <span
                                key={i}
                                className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ---------- At-Risk Students ----------
function AtRiskStudents({ onSelectStudent }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

  useEffect(() => {
    api.adminGetDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Loading at-risk students...</p>;
  if (!stats) return <ErrorBanner message={error} />;

  const programmeOptions = [...new Set(stats.at_risk_students.map((s) => s.programme_code))];

  const filtered = stats.at_risk_students.filter((s) => {
    if (programmeFilter !== "all" && s.programme_code !== programmeFilter) return false;
    if (reasonFilter === "blocking" && s.failed_blocking_count === 0) return false;
    if (reasonFilter === "average" && s.failed_blocking_count > 0) return false;
    return true;
  });

  function exportCsv() {
    const rows = [
      [
        "Name",
        "Student number",
        "Programme",
        "Weighted average",
        "Target average",
        "Failed blocking modules",
        "Reasons",
      ],
      ...filtered.map((s) => [
        s.name,
        s.student_number,
        s.programme_code,
        s.weighted_average ?? "",
        s.target_average,
        s.failed_blocking_count,
        s.reasons.join("; "),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `at-risk-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <Card>
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Programme</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={programmeFilter}
                onChange={(e) => setProgrammeFilter(e.target.value)}
              >
                <option value="all">All programmes</option>
                {programmeOptions.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
              >
                <option value="all">All reasons</option>
                <option value="blocking">Blocking their major</option>
                <option value="average">Below target average only</option>
              </select>
            </div>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            Export CSV
          </button>
        </div>
      </Card>

      <Card title={`At-risk students (${filtered.length})`}>
        {filtered.length === 0 ? (
          <p className="text-sm text-emerald-600">No students match this filter. 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-medium">Student</th>
                  <th className="py-2 font-medium">Programme</th>
                  <th className="py-2 font-medium">Average</th>
                  <th className="py-2 font-medium">Blocking modules</th>
                  <th className="py-2 font-medium">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50"
                  >
                    <td className="py-2">
                      <div className="font-medium text-slate-800">{s.name}</div>
                      <div className="text-slate-400 text-xs">{s.student_number}</div>
                    </td>
                    <td className="py-2 text-slate-600">{s.programme_code}</td>
                    <td className="py-2 text-slate-600">
                      {s.weighted_average ?? "—"}{" "}
                      <span className="text-slate-400">/ {s.target_average}</span>
                    </td>
                    <td className="py-2">
                      {s.failed_blocking_count > 0 ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          {s.failed_blocking_count}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {s.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Curriculum Management ----------
function CurriculumManagement() {
  const [subTab, setSubTab] = useState("modules");

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        <button
          className={`px-3 py-2 text-sm font-medium ${
            subTab === "modules"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500"
          }`}
          onClick={() => setSubTab("modules")}
        >
          Modules
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${
            subTab === "prerequisites"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500"
          }`}
          onClick={() => setSubTab("prerequisites")}
        >
          Prerequisites
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium ${
            subTab === "programme-modules"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500"
          }`}
          onClick={() => setSubTab("programme-modules")}
        >
          Programme Modules
        </button>
      </div>
      {subTab === "modules" && <AdminModuleList />}
      {subTab === "prerequisites" && <AdminPrerequisiteManager />}
      {subTab === "programme-modules" && <AdminProgrammeModules />}
    </div>
  );
}

// ---------- Admin Dashboard ----------
const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "at-risk", label: "At risk" },
  { id: "programme-breakdown", label: "Programme breakdown" },
  { id: "students", label: "Students" },
  { id: "add", label: "Add student" },
  { id: "bulk", label: "Bulk upload" },
  { id: "curriculum", label: "Curriculum" },
  { id: "admin-management", label: "Admin Management" },
  { id: "bulk-email", label: "Bulk Email" },  // 👈 NEW
];

function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    api.adminMe().then(setAdmin).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-slate-800">Graduation Credit Tracker — Admin</h1>
            {admin && <p className="text-xs text-slate-400">{admin.name}</p>}
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-slate-500 hover:text-red-600 font-medium"
          >
            Log out
          </button>
        </div>
        {!selectedStudentId && (
          <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {ADMIN_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  tab === t.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {selectedStudentId ? (
          <StudentDetail
            studentId={selectedStudentId}
            onBack={() => setSelectedStudentId(null)}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <>
            {tab === "dashboard" && <DashboardHome onSelectStudent={setSelectedStudentId} />}
            {tab === "at-risk" && <AtRiskStudents onSelectStudent={setSelectedStudentId} />}
            {tab === "programme-breakdown" && <ProgrammeBreakdownView onSelectStudent={setSelectedStudentId} />}
            {tab === "students" && <AdminStudentListEnhanced onSelectStudent={setSelectedStudentId} />}
            {tab === "add" && <CreateStudentForm onCreated={() => { setRefreshKey((k) => k + 1); setTab("students"); }} />}
            {tab === "bulk" && <BulkUploadPanel />}
            {tab === "curriculum" && <CurriculumManagement />}
            {tab === "admin-management" && <AdminAccountManagement />}
            {tab === "bulk-email" && <AdminBulkEmail />}  {/* 👈 NEW */}
          </>
        )}
      </main>
    </div>
  );
}

// ---------- Entry Point ----------
export default function AdminApp({ onLogout, loginOnly, onLoggedIn, onBack }) {
  if (loginOnly) {
    return <AdminLogin onLoggedIn={onLoggedIn} onBack={onBack} />;
  }
  return <AdminDashboard onLogout={onLogout} />;
}