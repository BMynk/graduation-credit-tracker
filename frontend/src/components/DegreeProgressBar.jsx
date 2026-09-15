// frontend/src/components/DegreeProgressBar.jsx
import { useState, useEffect } from "react";
import { api } from "../api";

function DegreeProgressBar() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    api.getDegreeProgress()
      .then(setProgress)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (progress && progress.percentage >= 90) {
      setConfetti(true);
      const timer = setTimeout(() => setConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-slate-200 rounded-xl"></div>
            <div className="h-20 bg-slate-200 rounded-xl"></div>
            <div className="h-20 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!progress) return null;

  const percentage = progress.percentage;
  const isOnTrack = percentage >= 50;
  const isComplete = percentage >= 90;

  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 opacity-50" />
      
      {/* Confetti Effect */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 20 + 10}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              {["🎉", "⭐", "🌟", "🎊", "💫", "✨"][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      <div className="relative p-6">
        {/* Header with Icon and Title */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {isComplete ? "🎓" : isOnTrack ? "📈" : "🚀"}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {isComplete ? "Almost There!" : "Degree Progress"}
              </h3>
              {isComplete && (
                <p className="text-xs text-emerald-600 font-medium">
                  You're so close to graduation! 🎉
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-extrabold ${isComplete ? "text-emerald-500" : isOnTrack ? "text-indigo-600" : "text-amber-500"}`}>
              {percentage}%
            </div>
            <div className="text-xs text-slate-400">
              {progress.weighted_average !== null && (
                <span>Avg: {progress.weighted_average}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative mt-4">
          <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                isComplete
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400"
                  : isOnTrack
                  ? "bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400"
                  : "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              
              {/* Glow Effect */}
              <div className={`absolute inset-0 blur-md opacity-50 ${
                isComplete
                  ? "bg-emerald-400"
                  : isOnTrack
                  ? "bg-indigo-400"
                  : "bg-amber-400"
              }`} />
            </div>
          </div>
          
          {/* Milestone Markers */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
            {[25, 50, 75].map((milestone) => (
              <div key={milestone} className="relative">
                <div className={`w-0.5 h-3 mx-auto ${
                  percentage >= milestone ? "bg-indigo-400" : "bg-slate-300"
                }`} />
                <div className="text-[8px] text-slate-400 mt-0.5">
                  {milestone}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide">
              <span>📚</span> Credits
            </div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">
              {progress.credits_completed}
              <span className="text-sm font-normal text-slate-400">
                /{progress.credits_required}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {Math.round((progress.credits_completed / progress.credits_required) * 100)}%
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide">
              <span>📖</span> Compulsory
            </div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">
              {progress.compulsory.completed}
              <span className="text-sm font-normal text-slate-400">
                /{progress.compulsory.total}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {progress.compulsory.percentage}% done
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide">
              <span>🧭</span> Elective
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {progress.elective.completed}
              <span className="text-sm font-normal text-slate-400">
                /{progress.elective.total}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {progress.elective.percentage}% done
            </div>
          </div>
        </div>

        {/* Projected Graduation */}
        {progress.projected_graduation && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📅</span>
              <span className="text-sm text-slate-500">Projected graduation:</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600">
              {progress.projected_graduation}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DegreeProgressBar;