// frontend/src/components/PeerComparison.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card";
import ErrorBanner from "./ErrorBanner";

function PeerComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.request("/progress/peer-comparison", { auth: true })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 rounded"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
        </div>
        <div className="h-48 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onDismiss={() => setError("")} />;
  if (!data) return null;

  const stats = data.stats;

  // Determine rank color
  const rankColor = stats.your_rank <= 3 ? "text-emerald-600" : stats.your_rank <= 10 ? "text-amber-600" : "text-slate-600";

  // Find max count for distribution bar scaling
  const maxCount = Math.max(...stats.distribution.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <Card title="📊 Peer Comparison">
        <p className="text-sm text-slate-500 mb-4">
          See how you compare to other students in your programme and year. All data is anonymized.
        </p>

        {/* Message */}
        {data.message && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm text-slate-600">
            {data.message}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Your Rank</div>
            <div className={`text-3xl font-bold ${rankColor}`}>
              #{stats.your_rank}
            </div>
            <div className="text-xs text-slate-400">
              out of {stats.total_students} students
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Percentile</div>
            <div className="text-3xl font-bold text-indigo-600">
              {stats.percentile}%
            </div>
            <div className="text-xs text-slate-400">
              You're ahead of {stats.percentile}% of peers
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Your Average</div>
            <div className="text-3xl font-bold text-slate-800">
              {stats.your_average !== null ? `${stats.your_average}%` : "—"}
            </div>
            <div className="text-xs text-slate-400">
              Cohort avg: {stats.cohort_average !== null ? `${stats.cohort_average}%` : "—"}
            </div>
          </div>
        </div>

        {/* Comparison Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Highest in Cohort</div>
            <div className="font-semibold text-emerald-600">{stats.max_average !== null ? `${stats.max_average}%` : "—"}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Lowest in Cohort</div>
            <div className="font-semibold text-red-500">{stats.min_average !== null ? `${stats.min_average}%` : "—"}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-500">Programme</div>
            <div className="font-medium text-slate-800 text-sm">{stats.programme_code}</div>
            <div className="text-xs text-slate-400">Year {stats.year}</div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-3">📊 Performance Distribution</h4>
          <div className="space-y-2">
            {stats.distribution.map((bin, index) => {
              const width = (bin.count / maxCount) * 100;
              const isOwnBin = bin.range.includes(Math.round(stats.your_average || 0).toString()) || 
                               (stats.your_average !== null && 
                                parseInt(bin.range.split('-')[0]) <= stats.your_average && 
                                stats.your_average < parseInt(bin.range.split('-')[1] || '100'));
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-16">{bin.range}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isOwnBin ? "bg-indigo-500" : "bg-slate-300"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8">{bin.count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-indigo-500 rounded-full"></span> You
            </span>
          </div>
        </div>
      </Card>

      {/* Interpretation */}
      <Card title="💡 What This Means">
        <div className="text-sm text-slate-600 space-y-2">
          {stats.your_rank <= 3 ? (
            <p>🌟 You're in the top tier of your cohort! Keep up the excellent work.</p>
          ) : stats.your_rank <= 10 ? (
            <p>📈 You're performing above average compared to your peers. Great job!</p>
          ) : stats.your_rank <= stats.total_students / 2 ? (
            <p>📊 You're in the middle of the pack. Focus on improving your weaker areas to climb the ranks.</p>
          ) : (
            <p>💪 Don't be discouraged! Use this as motivation to work harder. Seek help from your lecturers or study groups.</p>
          )}
          <p className="text-xs text-slate-400">* Statistics are based on students in your programme and year who have recorded grades.</p>
        </div>
      </Card>
    </div>
  );
}

export default PeerComparison;