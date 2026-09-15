// frontend/src/components/EnhancedGraduationAudit.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import ModuleStatusBadge from "./ModuleStatusBadge";

function EnhancedGraduationAudit() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getGraduationAudit()
      .then(setAudit)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 text-lg mb-4">🎯 Graduation Audit</h3>

      {/* Overall Status */}
      <div className={`rounded-lg p-4 mb-4 ${audit.on_track ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{audit.on_track ? "✅" : "⚠️"}</span>
          <span className={`font-semibold ${audit.on_track ? "text-emerald-700" : "text-amber-700"}`}>
            {audit.on_track ? "On Track to Graduate!" : "Needs Attention"}
          </span>
        </div>
        {audit.projected_semesters_remaining !== null && (
          <p className="text-sm text-slate-600 mt-2">
            Estimated {audit.projected_semesters_remaining} semester(s) remaining
          </p>
        )}
        {audit.average_credits_per_semester !== null && (
          <p className="text-sm text-slate-500 mt-1">
            Average {audit.average_credits_per_semester} credits per semester
          </p>
        )}
      </div>

      {/* Reasons */}
      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium text-slate-600">Details:</p>
        <ul className="space-y-1.5">
          {audit.reasons.map((reason, i) => (
            <li key={i} className="text-sm text-slate-700 flex gap-2">
              <span className="text-slate-300">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Completed</div>
          <div className="text-xl font-bold text-slate-800">{audit.summary.modules_completed}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Failed</div>
          <div className="text-xl font-bold text-red-600">{audit.summary.modules_failed_pending_retake}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Average</div>
          <div className="text-xl font-bold text-slate-800">{audit.summary.weighted_average ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedGraduationAudit;