// frontend/src/components/GradePredictor.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card";
import ErrorBanner from "./ErrorBanner";

function GradePredictor() {
  const [eligibleModules, setEligibleModules] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    api.getEligibleModules()
      .then(setEligibleModules)
      .catch((err) => setError(err.message));
  }, []);

  const handleGradeChange = (code, grade) => {
    const index = predictions.findIndex(p => p.module_code === code);
    const value = parseFloat(grade);
    if (isNaN(value) || value < 0 || value > 100) {
      if (index !== -1) {
        setPredictions(predictions.filter(p => p.module_code !== code));
      }
      return;
    }
    if (index !== -1) {
      const updated = [...predictions];
      updated[index].predicted_grade = value;
      setPredictions(updated);
    } else {
      setPredictions([...predictions, { module_code: code, predicted_grade: value }]);
    }
  };

  const handlePredict = async () => {
    if (predictions.length === 0) {
      setError("Please add at least one prediction.");
      return;
    }
    setLoading(true);
    setError("");
    setShowResults(false);
    try {
      const response = await api.request("/progress/predict-grades", {
        method: "POST",
        body: { predictions },
        auth: true,
      });
      setResult(response);
      setShowResults(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPredictions([]);
    setResult(null);
    setShowResults(false);
    setError("");
  };

  return (
    <div className="space-y-6">
      <Card title="📊 What-If Calculator">
        <p className="text-sm text-slate-500 mb-4">
          Predict your new GPA by entering the grades you think you'll get in future modules.
        </p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div className="mb-4">
          <p className="text-sm font-medium text-slate-600 mb-2">Available modules to predict:</p>
          {eligibleModules.length === 0 ? (
            <p className="text-sm text-slate-400">No eligible modules available to predict.</p>
          ) : (
            <div className="grid gap-2">
              {eligibleModules.map((m) => {
                const prediction = predictions.find(p => p.module_code === m.code);
                return (
                  <div key={m.code} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">{m.code}</span>
                      <span className="text-sm text-slate-500 ml-2">{m.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{m.credits}cr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-sm text-center"
                        placeholder="Grade"
                        value={prediction?.predicted_grade || ""}
                        onChange={(e) => handleGradeChange(m.code, e.target.value)}
                      />
                      {prediction && (
                        <button
                          onClick={() => {
                            setPredictions(predictions.filter(p => p.module_code !== m.code));
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePredict}
            disabled={loading || predictions.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
          >
            {loading ? "Calculating..." : "🔮 Calculate"}
          </button>
          <button
            onClick={clearAll}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg px-4 py-2 text-sm transition"
          >
            Clear All
          </button>
        </div>
      </Card>

      {showResults && result && (
        <Card title="📈 Results">
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Current Average</div>
              <div className="text-2xl font-bold text-slate-800">
                {result.current_weighted_average ?? "—"}%
              </div>
            </div>
            <div className={`bg-slate-50 rounded-lg p-4 text-center ${result.change > 0 ? "border-2 border-emerald-200" : result.change < 0 ? "border-2 border-red-200" : ""}`}>
              <div className="text-xs text-slate-500 uppercase tracking-wide">New Average</div>
              <div className={`text-2xl font-bold ${result.change > 0 ? "text-emerald-600" : result.change < 0 ? "text-red-600" : "text-slate-800"}`}>
                {result.new_weighted_average}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Change</div>
              <div className={`text-2xl font-bold ${result.change > 0 ? "text-emerald-600" : result.change < 0 ? "text-red-600" : "text-slate-800"}`}>
                {result.change > 0 ? "+" : ""}{result.change}%
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-slate-600 mb-1">Impact on modules:</p>
            <div className="space-y-1">
              {result.modules_affected.map((m) => (
                <div key={m.code} className="flex justify-between text-sm">
                  <span>
                    <span className="font-medium text-slate-800">{m.code}</span>
                    <span className="text-slate-500 ml-2">{m.name}</span>
                    <span className="text-xs text-slate-400 ml-2">({m.credits}cr)</span>
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{m.predicted_grade}%</span>
                    <span className="text-xs text-slate-400">{m.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-lg p-4 ${result.change >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
            <p className="text-sm">{result.graduation_impact}</p>
          </div>

          {result.eligibility_warnings.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-700 mb-1">⚠️ Warnings:</p>
              <ul className="text-sm text-yellow-600 space-y-1">
                {result.eligibility_warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">
            <p>Credits completed: {result.credits_completed}</p>
            <p>Credits with predictions: {result.credits_with_predictions}</p>
            <p>Total credits after: {result.total_credits_after}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default GradePredictor;