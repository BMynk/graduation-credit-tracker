// frontend/src/components/ProgrammeBreakdown.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card"; // or define it inline
import ErrorBanner from "./ErrorBanner"; // or define it inline

function ProgrammeBreakdownView({ onSelectStudent }) {
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetProgrammeBreakdown()
      .then(setBreakdown)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Loading programme breakdown...</p>;

  const maxStudents = Math.max(...breakdown.map((p) => p.student_count), 1);

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {breakdown.length === 0 ? (
        <p className="text-sm text-slate-400">No programme data available.</p>
      ) : (
        breakdown.map((p) => (
          <Card key={p.programme_code}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">{p.programme_name}</h3>
                <p className="text-xs text-slate-400">{p.programme_code}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">{p.student_count}</div>
                <div className="text-xs text-slate-400">students</div>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${(p.student_count / maxStudents) * 100}%` }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500">Average progress</div>
                <div className="text-lg font-semibold text-slate-800">
                  {p.avg_percentage_complete !== null ? `${p.avg_percentage_complete}%` : "—"}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500">Average weighted grade</div>
                <div className="text-lg font-semibold text-slate-800">
                  {p.avg_weighted_average ?? "—"}
                </div>
              </div>
            </div>

            {p.bottleneck_modules.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">
                  Bottleneck modules (most common failures)
                </div>
                <div className="space-y-1.5">
                  {p.bottleneck_modules.map((m) => {
                    const maxFail = Math.max(...p.bottleneck_modules.map((x) => x.fail_count));
                    return (
                      <div key={m.code} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-slate-600 shrink-0">{m.code}</div>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-red-400 h-2 rounded-full"
                            style={{ width: `${(m.fail_count / maxFail) * 100}%` }}
                          />
                        </div>
                        <div className="w-24 text-xs text-slate-500 shrink-0 text-right">
                          {m.fail_count} failing
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

export default ProgrammeBreakdownView;