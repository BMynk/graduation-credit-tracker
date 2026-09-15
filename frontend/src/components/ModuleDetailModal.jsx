// frontend/src/components/ModuleDetailModal.jsx
import { useState, useEffect } from "react";
import { api } from "../api";

function ModuleDetailModal({ moduleCode, isOpen, onClose }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !moduleCode) return;
    
    setLoading(true);
    setError("");
    
    api.getModuleDetail(moduleCode)
      .then((data) => {
        console.log("Module detail:", data);
        setModule(data);
      })
      .catch((err) => {
        console.error("Module detail error:", err);
        setError(err.message || "Failed to load module details");
      })
      .finally(() => setLoading(false));
  }, [moduleCode, isOpen]);

  if (!isOpen) return null;

  const handleModalClick = (e) => e.stopPropagation();

  // Helper function for status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      completed: { label: "✅ Completed", color: "text-emerald-600" },
      failed: { label: "❌ Failed", color: "text-red-600" },
      "in-progress": { label: "🔄 In Progress", color: "text-amber-600" },
      planned: { label: "📋 Planned", color: "text-blue-600" },
      not_taken: { label: "○ Not Taken", color: "text-slate-400" },
    };
    return statusMap[status] || statusMap.not_taken;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" 
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-slate-800">📖 Module Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {module && (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-bold text-indigo-600">{module.code || "N/A"}</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusDisplay(module.status).color} bg-slate-100`}>
                    {getStatusDisplay(module.status).label}
                  </span>
                  {module.is_compulsory && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      📌 Compulsory
                    </span>
                  )}
                </div>
                <p className="text-lg font-medium text-slate-800 mt-1">{module.name || "Unknown Module"}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Credits</div>
                  <div className="font-semibold text-slate-800">{module.credits || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Level</div>
                  <div className="font-semibold text-slate-800">{module.level || "—"}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Category</div>
                  <div className="font-semibold text-slate-800 capitalize">{module.category || "—"}</div>
                </div>
              </div>

              {/* Description */}
              {module.description && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Description</p>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{module.description}</p>
                </div>
              )}

              {/* Prerequisites */}
              <div>
                <p className="text-sm font-medium text-slate-600">🔗 Prerequisites</p>
                {!module.prerequisites || module.prerequisites.length === 0 ? (
                  <p className="text-sm text-slate-400 mt-1">None – you can take this module anytime!</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {module.prerequisites.map((p) => (
                      <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Unlocks */}
              {module.unlocks && module.unlocks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600">🔓 Unlocks</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {module.unlocks.map((u) => (
                      <span key={u} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade & Attempt */}
              {module.grade !== null && module.grade !== undefined && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Grade</div>
                    <div className={`font-semibold ${module.grade >= 50 ? "text-emerald-600" : "text-red-600"}`}>
                      {module.grade}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">Attempt</div>
                    <div className="font-semibold text-slate-800">{module.attempt || 1}</div>
                  </div>
                </div>
              )}

              {/* Status explanation */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-400">
                {module.status === "completed" && "✅ You've successfully completed this module."}
                {module.status === "failed" && "❌ You need to retake this module."}
                {module.status === "in-progress" && "🔄 You're currently enrolled in this module."}
                {module.status === "planned" && "📋 You've planned to take this module."}
                {module.status === "not_taken" && "○ You haven't taken this module yet."}
              </div>

              {/* Close Button */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModuleDetailModal;