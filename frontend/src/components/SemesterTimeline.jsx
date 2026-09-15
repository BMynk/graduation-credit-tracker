// frontend/src/components/SemesterTimeline.jsx
import { useState, useEffect } from "react";
import { api } from "../api";

function StatusPill({ status }) {
  const styles = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    "in-progress": "bg-amber-100 text-amber-700 border-amber-200",
    planned: "bg-blue-100 text-blue-700 border-blue-200",
    has_failed: "bg-red-100 text-red-700 border-red-200",
  };

  const labels = {
    completed: "✅ Completed",
    failed: "❌ Failed",
    "in-progress": "🔄 In Progress",
    planned: "📋 Planned",
    has_failed: "⚠️ Has Failed",
  };

  const currentStyles = styles[status] || styles.planned;
  const currentLabel = labels[status] || status;

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${currentStyles}`}>
      {currentLabel}
    </span>
  );
}

function SemesterTimeline({ onModuleClick }) {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSemesters()
      .then(setSemesters)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
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

  if (semesters.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-400">No semesters recorded yet.</p>
      </div>
    );
  }

  // Helper to get semester border color
  const getSemesterBorderColor = (status) => {
    if (status === "has_failed") return "border-red-200";
    if (status === "completed") return "border-emerald-200";
    return "border-slate-200";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 text-lg">📅 Academic Timeline</h3>
        <span className="text-sm text-slate-500">{semesters.length} semesters</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-slate-200"></div>

        {semesters.map((semester, idx) => (
          <div key={semester.semester} className="relative pl-16 pb-8 last:pb-0">
            {/* Timeline dot */}
            <div className="absolute left-4 top-6 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </div>

            {/* Semester Card */}
            <div className={`bg-white rounded-xl shadow-sm border p-5 transition hover:shadow-md ${getSemesterBorderColor(semester.status)}`}>
              {/* Semester Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-slate-800">{semester.semester}</h4>
                    <StatusPill status={semester.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {semester.module_count} modules
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-800">
                    {semester.credits_completed} credits
                  </div>
                  {semester.average && (
                    <div className="text-xs text-slate-500">
                      Avg: <span className="font-semibold">{semester.average}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Module List */}
              <div className="space-y-1.5">
                {semester.modules.map((enrolment) => (
                  <div
                    key={enrolment.id}
                    onClick={() => onModuleClick?.(enrolment.module.code)}
                    className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">
                        {enrolment.module.code}
                      </div>
                      <div className="text-xs text-slate-500">
                        {enrolment.module.name} · {enrolment.module.credits} credits
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {enrolment.grade !== null && (
                        <span className={`text-sm font-semibold ${enrolment.grade >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                          {enrolment.grade}%
                        </span>
                      )}
                      <StatusPill status={enrolment.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SemesterTimeline;