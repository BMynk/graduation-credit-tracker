// frontend/src/components/EnhancedGraduationAudit.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card";
import ErrorBanner from "./ErrorBanner";

function EnhancedGraduationAudit() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMissing, setShowMissing] = useState(true);

  useEffect(() => {
    api.getGraduationAudit()
      .then(setAudit)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-24 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onDismiss={() => setError("")} />;
  if (!audit) return null;

  const breakdown = audit.requirements_breakdown;
  const isComplete = audit.on_track && breakdown.compulsory.percentage === 100 && breakdown.elective.percentage === 100;

  return (
    <div className="space-y-6">
      <Card title="🎯 Graduation Audit">
        <div className={`rounded-lg p-4 mb-4 ${isComplete ? "bg-emerald-50 border border-emerald-200" : audit.on_track ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{isComplete ? "🎓" : audit.on_track ? "✅" : "⚠️"}</span>
            <span className={`font-semibold ${isComplete || audit.on_track ? "text-emerald-700" : "text-amber-700"}`}>
              {isComplete ? "🎉 You're Ready to Graduate!" : audit.on_track ? "On Track to Graduate!" : "Needs Attention"}
            </span>
          </div>

          {audit.reasons.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-slate-600">Details:</p>
              <ul className="space-y-1 mt-1">
                {audit.reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-slate-300">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            {audit.projected_semesters_remaining !== null && (
              <div className="text-sm">
                <span className="text-slate-500">Semesters remaining: </span>
                <span className="font-semibold text-indigo-600">{audit.projected_semesters_remaining}</span>
              </div>
            )}
            {audit.average_credits_per_semester !== null && (
              <div className="text-sm">
                <span className="text-slate-500">Avg credits/semester: </span>
                <span className="font-semibold text-slate-800">{audit.average_credits_per_semester}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Modules Completed</div>
            <div className="text-xl font-bold text-slate-800">{breakdown.compulsory.completed + breakdown.elective.completed}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Failed Modules</div>
            <div className="text-xl font-bold text-red-600">{audit.summary.modules_failed_pending_retake}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">In Progress</div>
            <div className="text-xl font-bold text-amber-600">{audit.in_progress_modules}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Weighted Average</div>
            <div className="text-xl font-bold text-slate-800">{audit.summary.weighted_average ?? "—"}</div>
          </div>
        </div>
      </Card>

      <Card title="📋 Requirements Breakdown">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700">Compulsory</span>
              <span className="text-sm text-slate-500">
                {breakdown.compulsory.completed}/{breakdown.compulsory.total}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${breakdown.compulsory.percentage === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(breakdown.compulsory.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">{breakdown.compulsory.percentage}% complete</div>

            {breakdown.compulsory.missing_modules.length > 0 && showMissing && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-600">Missing:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {breakdown.compulsory.missing_modules.slice(0, 5).map((m) => (
                    <span key={m.code} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200">
                      {m.code}
                    </span>
                  ))}
                  {breakdown.compulsory.missing_modules.length > 5 && (
                    <span className="text-xs text-slate-400">+{breakdown.compulsory.missing_modules.length - 5} more</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700">Elective</span>
              <span className="text-sm text-slate-500">
                {breakdown.elective.completed}/{breakdown.elective.total}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${breakdown.elective.percentage === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(breakdown.elective.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">{breakdown.elective.percentage}% complete</div>

            {breakdown.elective.missing_modules.length > 0 && showMissing && (
              <div className="mt-2">
                <p className="text-xs font-medium text-amber-600">Missing:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {breakdown.elective.missing_modules.slice(0, 5).map((m) => (
                    <span key={m.code} className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">
                      {m.code}
                    </span>
                  ))}
                  {breakdown.elective.missing_modules.length > 5 && (
                    <span className="text-xs text-slate-400">+{breakdown.elective.missing_modules.length - 5} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowMissing(!showMissing)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {showMissing ? "Hide missing modules" : "Show missing modules"}
          </button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="📊 Credits by Level">
          <div className="space-y-2">
            {Object.entries(breakdown.by_level)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, data]) => {
                const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Level {level}</span>
                      <span className="text-slate-600">{data.completed}/{data.total} credits</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-0.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-400"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card title="📂 Credits by Category">
          <div className="space-y-2">
            {Object.entries(breakdown.by_category).map(([cat, data]) => {
              const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600">{cat}</span>
                    <span className="text-slate-600">{data.completed}/{data.total} credits</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-0.5">
                    <div
                      className="h-1.5 rounded-full bg-emerald-400"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {audit.prerequisite_warnings.length > 0 && (
        <Card title="⚠️ Prerequisite Warnings">
          <p className="text-sm text-amber-600 mb-2">
            These modules have missing prerequisites:
          </p>
          <div className="space-y-1">
            {audit.prerequisite_warnings.map((w, i) => (
              <div key={i} className="text-sm bg-amber-50 rounded-lg px-3 py-1.5 flex justify-between">
                <span className="text-amber-700">{w.module}</span>
                <span className="text-amber-500">Missing: {w.missing_prereq}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {audit.urgent_items.length > 0 && (
        <Card title="🚨 Urgent Items">
          <p className="text-sm text-red-600 mb-2">
            These modules need your immediate attention:
          </p>
          <div className="flex flex-wrap gap-2">
            {audit.urgent_items.map((code, i) => (
              <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm border border-red-200">
                {code}
              </span>
            ))}
          </div>
        </Card>
      )}

      <button
        onClick={() => window.print()}
        className="bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
      >
        🖨️ Print Audit
      </button>
    </div>
  );
}

export default EnhancedGraduationAudit;