// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { api } from "./api";
import AdminApp from "./AdminApp";
import PeerComparison from "./components/PeerComparison";
import YearlyBreakdown from "./components/YearlyBreakdown";

// Import student components
import DegreeProgressBar from "./components/DegreeProgressBar";
import ModuleStatusBadge from "./components/ModuleStatusBadge";
import SemesterTimeline from "./components/SemesterTimeline";
import ModuleDetailModal from "./components/ModuleDetailModal";
import GradePredictor from "./components/GradePredictor";
import CoursePlanner from "./components/CoursePlanner";
import EnhancedGraduationAudit from "./components/EnhancedGraduationAudit";
import Achievements from "./components/Achievements";

// ---------- Shared UI ----------
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

function StatusPill({ status }) {
  const styles = {
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    "in-progress": "bg-amber-100 text-amber-700",
    planned: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.planned}`}>
      {status}
    </span>
  );
}

// ---------- Role Picker ----------
function RolePicker({ onPick }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Graduation Credit Tracker</h1>
        <p className="text-slate-500 text-sm mb-8">Choose how you'd like to sign in</p>
        <div className="grid gap-3">
          <button
            onClick={() => onPick("student")}
            className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm rounded-xl px-6 py-5 text-left transition"
          >
            <div className="font-semibold text-slate-800">I'm a student</div>
            <div className="text-sm text-slate-500">Check your progress with your PIN</div>
          </button>
          <button
            onClick={() => onPick("admin")}
            className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm rounded-xl px-6 py-5 text-left transition"
          >
            <div className="font-semibold text-slate-800">I'm an administrator</div>
            <div className="text-sm text-slate-500">Manage student records and marks</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Student Login ----------
function StudentLogin({ onLoggedIn, onBack }) {
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingPin, setRequestingPin] = useState(false);

  async function handleRequestPin() {
    setError("");
    setInfo("");
    if (!studentNumber || !email) {
      setError("Enter your student number and email first, then request a PIN.");
      return;
    }
    setRequestingPin(true);
    try {
      await api.requestPin({ student_number: studentNumber, email });
      setInfo("If those details match our records, a PIN has been emailed to you.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingPin(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.studentLogin({ student_number: studentNumber, email, pin });
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
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 mb-4">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Student login</h1>
        <p className="text-slate-500 text-sm mb-6">Enter your student number, email, and PIN</p>
        <Card>
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          <SuccessBanner message={info} onDismiss={() => setInfo("")} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Student number</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-600">PIN</label>
                <button
                  type="button"
                  onClick={handleRequestPin}
                  disabled={requestingPin}
                  className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                >
                  {requestingPin ? "Sending..." : "Email me my PIN"}
                </button>
              </div>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm tracking-widest text-center"
                maxLength={6}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Don't have a PIN? Click "Email me my PIN" above.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ---------- Student Dashboard Components ----------

function SummaryPanel({ summary }) {
  if (!summary) return null;
  const categories = Object.entries(summary.category_breakdown || {});
  
  // State for toggling each year's visibility
  const [openYears, setOpenYears] = useState({});

  const toggleYear = (year) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  return (
    <div className="space-y-6">
      <DegreeProgressBar />

      <div className="grid gap-6 md:grid-cols-2">
        <Card title={summary.programme.name}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Current year</span>
              <span className="font-medium text-slate-800">{summary.current_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Credits completed</span>
              <span className="font-medium text-slate-800">
                {summary.credits_completed} / {summary.credits_required}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(summary.percentage_complete, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{summary.percentage_complete}% complete</span>
              <span>{summary.credits_remaining} credits remaining</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Weighted average</span>
              <span className="font-medium text-slate-800">
                {summary.weighted_average !== null ? summary.weighted_average : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Modules completed</span>
              <span className="font-medium text-slate-800">{summary.modules_completed}</span>
            </div>
          </div>
        </Card>

        <Card title="Credits by category">
          <div className="space-y-3">
            {categories.length === 0 && <p className="text-sm text-slate-400">No completed modules yet.</p>}
            {categories.map(([cat, data]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="capitalize text-slate-600">{cat}</span>
                <span className="text-slate-800 font-medium">
                  {data.credits_completed} credits · {data.modules_completed} modules
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Failed modules" className="md:col-span-2">
          {summary.failed_modules.length === 0 ? (
            <p className="text-sm text-emerald-600">No outstanding failed modules. 🎉</p>
          ) : (
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
                  <div>
                    <span className="font-medium text-slate-800">{f.module.code}</span>{" "}
                    <span className="text-slate-500">{f.module.name}</span>
                    <div className="text-xs text-slate-400">
                      {f.semester} · grade {f.grade} · attempt {f.attempt}
                    </div>
                  </div>
                  {f.is_prerequisite_for_major && (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      Blocks your major
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Missing Compulsory Modules with Dropdown */}
        <Card title="Missing compulsory modules" className="md:col-span-2">
          {summary.missing_compulsory_modules.length === 0 ? (
            <p className="text-sm text-emerald-600">All compulsory modules completed. 🎉</p>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((year) => {
                const modules = summary.missing_compulsory_modules.filter(
                  (m) => m.level === year
                );
                if (modules.length === 0) return null;
                const isOpen = openYears[year] || false;

                return (
                  <div key={year} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">Year {year}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {modules.length} module{modules.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xl">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {modules.map((m) => (
                            <div
                              key={m.code}
                              className="text-sm bg-slate-50 rounded-lg px-3 py-2 flex justify-between items-center hover:bg-slate-100 transition"
                            >
                              <span>
                                <span className="font-medium text-slate-800">{m.code}</span>
                                <span className="text-xs text-slate-400 ml-1">{m.credits}cr</span>
                              </span>
                              <span className="text-xs text-slate-400">Y{m.level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function HistoryPanel({ history, onModuleClick }) {
  return (
    <Card title="Module history">
      {history.length === 0 ? (
        <p className="text-sm text-slate-400">No modules recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 font-medium">Module</th>
                <th className="py-2 font-medium">Credits</th>
                <th className="py-2 font-medium">Semester</th>
                <th className="py-2 font-medium">Grade</th>
                <th className="py-2 font-medium">Attempt</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onModuleClick?.(e.module.code)}
                  className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition"
                >
                  <td className="py-2">
                    <div className="font-medium text-slate-800">{e.module.code}</div>
                    <div className="text-slate-400 text-xs">{e.module.name}</div>
                  </td>
                  <td className="py-2 text-slate-600">{e.module.credits}</td>
                  <td className="py-2 text-slate-600">{e.semester}</td>
                  <td className="py-2 text-slate-600">{e.grade ?? "—"}</td>
                  <td className="py-2 text-slate-600">{e.attempt}</td>
                  <td className="py-2">
                    <ModuleStatusBadge status={e.status} grade={e.grade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function EligibleModulesPanel({ modules }) {
  return (
    <Card title="What you can take next">
      {modules.length === 0 ? (
        <p className="text-sm text-slate-400">No eligible modules right now.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {modules.map((m) => (
            <li key={m.code} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">{m.code}</span>
                <span className="text-slate-400">{m.credits}cr</span>
              </div>
              <div className="text-slate-500">{m.name}</div>
              <div className="text-xs text-emerald-600 mt-1">{m.reason}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------- Student Dashboard ----------
const STUDENT_TABS = [
  { id: "summary", label: "Summary" },
  { id: "history", label: "History" },
  { id: "planning", label: "Planning" },
  { id: "timeline", label: "Timeline" },
  { id: "predictor", label: "Predictor" },
  { id: "planner", label: "Planner" },
  { id: "achievements", label: "Achievements" },
  { id: "peers", label: "Peers" },
  { id: "yearly", label: "Yearly" },
];

function StudentDashboard({ onLogout }) {
  const [tab, setTab] = useState("summary");
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedModule, setSelectedModule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModuleClick = (code) => {
    setSelectedModule(code);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedModule(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const [meData, summaryData, historyData, eligibleData, auditData] = await Promise.all([
          api.me(),
          api.getSummary(),
          api.getHistory(),
          api.getEligibleModules(),
          api.getGraduationAudit(),
        ]);
        setMe(meData);
        setSummary(summaryData);
        setHistory(historyData);
        setEligible(eligibleData);
        setAudit(auditData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-slate-800">Graduation Credit Tracker</h1>
            {me && <p className="text-xs text-slate-400">{me.name} · {me.student_number}</p>}
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-slate-500 hover:text-red-600 font-medium"
          >
            Log out
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {STUDENT_TABS.map((t) => (
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
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        {loading && <p className="text-sm text-slate-400">Loading your progress...</p>}
        
        {!loading && tab === "summary" && <SummaryPanel summary={summary} />}
        {!loading && tab === "yearly" && <YearlyBreakdown onModuleClick={handleModuleClick} />}
        {!loading && tab === "peers" && <PeerComparison />}
        {!loading && tab === "history" && <HistoryPanel history={history} onModuleClick={handleModuleClick} />}
        {!loading && tab === "planning" && 
        (
          <div className="space-y-6">
            <EnhancedGraduationAudit />
            <EligibleModulesPanel modules={eligible} />
          </div>
        )}
        {!loading && tab === "timeline" && <SemesterTimeline onModuleClick={handleModuleClick} />}
        {!loading && tab === "predictor" && <GradePredictor />}
        {!loading && tab === "planner" && <CoursePlanner />}
        {!loading && tab === "achievements" && <Achievements />}  
      </main>

      <ModuleDetailModal
        moduleCode={selectedModule}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

// ---------- Root ----------
export default function App() {
  const [role, setRole] = useState(api.getRole());
  const [pickedRole, setPickedRole] = useState(null);

  function handleLoggedIn() {
    setRole(api.getRole());
  }

  function handleLogout() {
    api.logout();
    setRole(null);
    setPickedRole(null);
  }

  if (role === "admin") return <AdminApp onLogout={handleLogout} />;
  if (role === "student") return <StudentDashboard onLogout={handleLogout} />;

  if (pickedRole === "student") {
    return <StudentLogin onLoggedIn={handleLoggedIn} onBack={() => setPickedRole(null)} />;
  }

  if (pickedRole === "admin") {
    return <AdminApp onLogout={handleLogout} loginOnly onLoggedIn={handleLoggedIn} onBack={() => setPickedRole(null)} />;
  }

  return <RolePicker onPick={setPickedRole} />;
}