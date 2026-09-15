// frontend/src/components/Achievements.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card";
import ErrorBanner from "./ErrorBanner";

function Achievements() {
  const [achievementData, setAchievementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showLocked, setShowLocked] = useState(true);

  useEffect(() => {
    api.request("/progress/achievements", { auth: true })
      .then((data) => {
        console.log("Achievements data:", data); // 👈 Debug log
        setAchievementData(data);
      })
      .catch((err) => {
        console.error("Achievements error:", err);
        setError(err.message);
      })
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
      </Card>
    );
  }

  if (!achievementData) {
    return (
      <Card>
        <p className="text-sm text-slate-400">No achievement data available.</p>
      </Card>
    );
  }

  const { total_achievements, unlocked_achievements, completion_percentage, achievements } = achievementData;

  // Filter achievements
  let filtered = achievements || [];
  if (selectedCategory !== "all") {
    filtered = filtered.filter(a => a.category === selectedCategory);
  }
  if (!showLocked) {
    filtered = filtered.filter(a => a.unlocked);
  }

  // Category counts
  const categories = {
    all: achievements ? achievements.length : 0,
    milestone: achievements ? achievements.filter(a => a.category === "milestone").length : 0,
    academic: achievements ? achievements.filter(a => a.category === "academic").length : 0,
    excellence: achievements ? achievements.filter(a => a.category === "excellence").length : 0,
    perseverance: achievements ? achievements.filter(a => a.category === "perseverance").length : 0,
  };

  const unlockedCount = {
    all: achievements ? achievements.filter(a => a.unlocked).length : 0,
    milestone: achievements ? achievements.filter(a => a.unlocked && a.category === "milestone").length : 0,
    academic: achievements ? achievements.filter(a => a.unlocked && a.category === "academic").length : 0,
    excellence: achievements ? achievements.filter(a => a.unlocked && a.category === "excellence").length : 0,
    perseverance: achievements ? achievements.filter(a => a.unlocked && a.category === "perseverance").length : 0,
  };

  const categoryEmojis = {
    milestone: "📅",
    academic: "📖",
    excellence: "⭐",
    perseverance: "💪",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card title="🏆 Achievements & Milestones">
        <p className="text-sm text-slate-500 mb-4">
          Track your academic journey. Unlock achievements as you progress through your degree!
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-1">🎯</div>
            <div className="text-2xl font-bold text-slate-800">{unlocked_achievements || 0}</div>
            <div className="text-xs text-slate-500">of {total_achievements || 0} unlocked</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-2xl font-bold text-indigo-600">{completion_percentage || 0}%</div>
            <div className="text-xs text-slate-500">Completion rate</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-1">🏅</div>
            <div className="text-2xl font-bold text-amber-600">
              {achievements ? achievements.filter(a => a.unlocked && a.category === "excellence").length : 0}
            </div>
            <div className="text-xs text-slate-500">Excellence achievements</div>
          </div>
        </div>
      </Card>

      {/* Filter Controls */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categories).map(([cat, count]) => {
              const emoji = categoryEmojis[cat] || "🏆";
              const unlocked = unlockedCount[cat] || 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {emoji} {cat.charAt(0).toUpperCase() + cat.slice(1)} ({unlocked}/{count})
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showLocked}
              onChange={() => setShowLocked(!showLocked)}
              className="rounded border-slate-300"
            />
            Show locked
          </label>
        </div>
      </Card>

      {/* Achievement Grid */}
      <Card title="Achievements">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No achievements match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-xl p-4 border transition ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:shadow-md"
                    : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{achievement.icon || "🏆"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-sm ${
                        achievement.unlocked ? "text-slate-800" : "text-slate-500"
                      }`}>
                        {achievement.title || "Unknown"}
                      </h4>
                      {achievement.unlocked && (
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          ✅
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{achievement.description || ""}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        achievement.unlocked
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        {achievement.category || "general"}
                      </span>
                      {!achievement.unlocked && (
                        <span className="text-xs text-slate-400">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Unlocks */}
      {achievementData.recent_unlocks && achievementData.recent_unlocks.length > 0 && (
        <Card title="🎉 Recent Unlocks">
          <div className="flex flex-wrap gap-3">
            {achievementData.recent_unlocks.map((a) => (
              <div key={a.id} className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-2xl">{a.icon || "🏆"}</span>
                <div>
                  <div className="font-medium text-slate-800 text-sm">{a.title || "Unknown"}</div>
                  <div className="text-xs text-slate-500">{a.description || ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Milestones */}
      {achievementData.next_milestones && achievementData.next_milestones.length > 0 && (
        <Card title="🔜 Next Milestones">
          <p className="text-sm text-slate-500 mb-3">
            Keep going to unlock these achievements!
          </p>
          <div className="space-y-2">
            {achievementData.next_milestones.map((a) => (
              <div key={a.id} className="bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{a.icon || "🏆"}</span>
                <div className="flex-1">
                  <div className="font-medium text-slate-600 text-sm">{a.title || "Unknown"}</div>
                  <div className="text-xs text-slate-400">{a.description || ""}</div>
                </div>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">In progress</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Achievements;