// frontend/src/components/CoursePlanner.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card";
import ErrorBanner from "./ErrorBanner";

function CoursePlanner() {
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planResult, setPlanResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [semester, setSemester] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(true);

  const SEMESTER_OPTIONS = [
    "2025-S1", "2025-S2",
    "2026-S1", "2026-S2",
    "2027-S1", "2027-S2",
  ];

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await api.request("/planning/planning-modules", { auth: true });
      setModules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (code) => {
    if (selectedModules.includes(code)) {
      setSelectedModules(selectedModules.filter(m => m !== code));
      setPlanResult(null);
    } else {
      setSelectedModules([...selectedModules, code]);
      setPlanResult(null);
    }
  };

  const generatePlan = async () => {
    if (selectedModules.length === 0) {
      setError("Please select at least one module.");
      return;
    }
    if (!semester) {
      setError("Please select a semester.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await api.request("/planning/plan", {
        method: "POST",
        body: { module_codes: selectedModules, semester },
        auth: true,
      });
      setPlanResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!planResult || !planResult.is_valid) {
      setError("Please generate a valid plan first.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await api.request("/planning/save-plan", {
        method: "POST",
        body: { module_codes: selectedModules, semester },
        auth: true,
      });
      setSaveSuccess(`✅ Plan saved for ${semester}. ${result.modules_saved} modules added.`);
      setPlanResult(null);
      loadModules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clearSelection = () => {
    setSelectedModules([]);
    setPlanResult(null);
  };

  // Calculate stats
  const eligibleModules = modules.filter(m => m.is_eligible);
  const completedModules = modules.filter(m => m.reason === "Already completed ✅");
  const missingCompulsory = modules.filter(m => m.is_compulsory && m.reason !== "Already completed ✅");

  return (
    <div className="space-y-6">
      <Card title="📚 Course Planner">
        <p className="text-sm text-slate-500 mb-4">
          Plan your next semester by selecting modules you're eligible for.
          The system will validate your selection and suggest missing compulsory modules.
        </p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start">
            <span>{saveSuccess}</span>
            <button onClick={() => setSaveSuccess("")} className="text-emerald-400 hover:text-emerald-600 font-bold">×</button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Eligible</div>
            <div className="text-xl font-bold text-emerald-600">{eligibleModules.length}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Selected</div>
            <div className="text-xl font-bold text-indigo-600">{selectedModules.length}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Completed</div>
            <div className="text-xl font-bold text-slate-600">{completedModules.length}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Missing Compulsory</div>
            <div className="text-xl font-bold text-red-600">{missingCompulsory.length}</div>
          </div>
        </div>

        {/* Semester Selection */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="">Select semester</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={generatePlan}
              disabled={loading || selectedModules.length === 0 || !semester}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              {loading ? "Loading..." : "🔮 Generate Plan"}
            </button>
            <button
              onClick={clearSelection}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Module List */}
        {loading ? (
          <p className="text-sm text-slate-400">Loading modules...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Code</th>
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Credits</th>
                  <th className="py-2 font-medium">Level</th>
                  <th className="py-2 font-medium">Compulsory</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const isSelected = selectedModules.includes(m.code);
                  const isEligible = m.is_eligible;
                  const isCompleted = m.reason === "Already completed ✅";

                  let statusColor = "bg-slate-100 text-slate-500";
                  let statusText = m.reason || "Not eligible";

                  if (isCompleted) {
                    statusColor = "bg-emerald-100 text-emerald-700";
                    statusText = "✅ Completed";
                  } else if (isEligible) {
                    statusColor = "bg-green-100 text-green-700";
                    statusText = "✅ Eligible";
                  } else if (m.reason?.includes("Missing prerequisites")) {
                    statusColor = "bg-yellow-100 text-yellow-700";
                  } else if (m.reason?.includes("Failed")) {
                    statusColor = "bg-red-100 text-red-700";
                  }

                  return (
                    <tr key={m.code} className="border-b border-slate-50 last:border-0">
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="py-2 font-medium text-slate-800">{m.code}</td>
                      <td className="py-2 text-slate-600">{m.name}</td>
                      <td className="py-2 text-slate-600">{m.credits}</td>
                      <td className="py-2 text-slate-600">{m.level}</td>
                      <td className="py-2">
                        {m.is_compulsory ? (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Required</span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Elective</span>
                        )}
                      </td>
                      <td className="py-2">
                        {isEligible && !isCompleted ? (
                          <button
                            onClick={() => toggleModule(m.code)}
                            className={`text-xs px-3 py-1 rounded-lg transition ${
                              isSelected
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            }`}
                          >
                            {isSelected ? "Remove" : "Add"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Plan Results */}
      {planResult && (
        <Card title="📋 Plan Summary">
          <div className={`rounded-lg p-4 mb-4 ${planResult.is_valid ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{planResult.is_valid ? "✅" : "⚠️"}</span>
              <span className={`font-semibold ${planResult.is_valid ? "text-emerald-700" : "text-amber-700"}`}>
                {planResult.is_valid ? "Valid Plan" : "Plan Needs Adjustment"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Total Credits</div>
              <div className="text-xl font-bold text-slate-800">{planResult.total_credits}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Compulsory</div>
              <div className="text-xl font-bold text-indigo-600">{planResult.compulsory_count}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Elective</div>
              <div className="text-xl font-bold text-slate-600">{planResult.elective_count}</div>
            </div>
          </div>

          {planResult.selected_modules.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Selected Modules:</p>
              <div className="flex flex-wrap gap-2">
                {planResult.selected_modules.map((m) => (
                  <span key={m.code} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs border border-indigo-200">
                    {m.code} ({m.credits}cr)
                  </span>
                ))}
              </div>
            </div>
          )}

          {planResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-700 mb-1">⚠️ Warnings:</p>
              <ul className="text-sm text-yellow-600 space-y-1">
                {planResult.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {planResult.recommended_modules.length > 0 && showRecommendations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">💡 Recommended Missing Compulsory Modules:</p>
                  <div className="flex flex-wrap gap-2">
                    {planResult.recommended_modules.map((m) => (
                      <span key={m.code} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs border border-blue-200">
                        {m.code} ({m.credits}cr)
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-xs text-blue-400 hover:text-blue-600"
                >
                  Hide
                </button>
              </div>
            </div>
          )}

          {planResult.missing_compulsory.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-600 mb-1">⚠️ Missing Compulsory Modules (Not in plan):</p>
              <div className="flex flex-wrap gap-2">
                {planResult.missing_compulsory.slice(0, 10).map((m) => (
                  <span key={m.code} className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs border border-red-200">
                    {m.code} ({m.credits}cr)
                  </span>
                ))}
              </div>
              {planResult.missing_compulsory.length > 10 && (
                <span className="text-xs text-slate-400">+{planResult.missing_compulsory.length - 10} more</span>
              )}
            </div>
          )}

          {planResult.is_valid && (
            <button
              onClick={savePlan}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              {saving ? "Saving..." : "💾 Save Plan"}
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

export default CoursePlanner;