// frontend/src/components/admin/AdminPrerequisiteManager.jsx
import { useState, useEffect } from "react";
import { api } from "../../api";
import Card from "../Card";

function AdminPrerequisiteManager() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [prerequisites, setPrerequisites] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.listModules({ limit: 500 })
      .then(setAllModules)
      .catch(() => {});
  }, []);

  const loadModule = async (code) => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.adminGetPrerequisites(code);
      setPrerequisites(data);
      setSelectedModule(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrerequisite = async (prereqCode) => {
    try {
      await api.adminAddPrerequisite(selectedModule, prereqCode);
      setSuccess(`Added ${prereqCode} as prerequisite.`);
      loadModule(selectedModule);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemovePrerequisite = async (prereqCode) => {
    if (!confirm(`Remove ${prereqCode} from prerequisites?`)) return;
    try {
      await api.adminRemovePrerequisite(selectedModule, prereqCode);
      setSuccess(`Removed ${prereqCode}.`);
      loadModule(selectedModule);
    } catch (err) {
      setError(err.message);
    }
  };

  const availablePrereqs = allModules.filter(
    m => m.code !== selectedModule && !prerequisites.some(p => p.code === m.code)
  );

  return (
    <Card title="🔗 Prerequisites">
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">Select Module</label>
        <select
          className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={selectedModule}
          onChange={(e) => loadModule(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {allModules.map(m => (
            <option key={m.code} value={m.code}>{m.code} – {m.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      {success && <div className="text-emerald-600 text-sm mb-4">{success}</div>}

      {selectedModule && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Current Prerequisites:</p>
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : prerequisites.length === 0 ? (
              <p className="text-sm text-slate-400">None</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prerequisites.map(p => (
                  <span key={p.code} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-sm">
                    {p.code}
                    <button onClick={() => handleRemovePrerequisite(p.code)} className="text-red-500 hover:text-red-700">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Add Prerequisite:</p>
            <div className="flex gap-2">
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white flex-1"
                onChange={(e) => { if (e.target.value) handleAddPrerequisite(e.target.value); e.target.value = ""; }}
                value=""
              >
                <option value="">-- Select module --</option>
                {availablePrereqs.map(m => (
                  <option key={m.code} value={m.code}>{m.code} – {m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default AdminPrerequisiteManager;