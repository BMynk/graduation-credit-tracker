// frontend/src/components/admin/AdminProgrammeModules.jsx
import { useState, useEffect } from "react";
import { api } from "../../api";

// Card component inline (or import from existing)
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      {title && <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

function AdminProgrammeModules() {
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [modules, setModules] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.listProgrammes().then(setProgrammes).catch(() => {});
    api.listModules({ limit: 500 }).then(setAllModules).catch(() => {});
  }, []);

  const loadProgrammeModules = async (code) => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.adminGetProgrammeModules(code);
      setModules(data);
      setSelectedProgramme(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompulsory = async (moduleCode, currentStatus) => {
    try {
      await api.adminUpdateProgrammeModule(selectedProgramme, moduleCode, { is_compulsory: !currentStatus });
      setSuccess(`Updated ${moduleCode} status.`);
      loadProgrammeModules(selectedProgramme);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveModule = async (moduleCode) => {
    if (!confirm(`Remove ${moduleCode} from programme?`)) return;
    try {
      await api.adminRemoveModuleFromProgramme(selectedProgramme, moduleCode);
      setSuccess(`Removed ${moduleCode}.`);
      loadProgrammeModules(selectedProgramme);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddModule = async (moduleCode) => {
    if (!moduleCode) return;
    try {
      await api.adminAddModuleToProgramme(selectedProgramme, { module_code: moduleCode, is_compulsory: false });
      setSuccess(`Added ${moduleCode}.`);
      loadProgrammeModules(selectedProgramme);
    } catch (err) {
      setError(err.message);
    }
  };

  const programmeModuleCodes = modules.map(m => m.module_code);
  const availableModules = allModules.filter(m => !programmeModuleCodes.includes(m.code));

  return (
    <Card title="📋 Programme Curriculum">
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">Select Programme</label>
        <select
          className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={selectedProgramme}
          onChange={(e) => loadProgrammeModules(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {programmes.map(p => (
            <option key={p.code} value={p.code}>{p.code} – {p.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
      {success && <div className="text-emerald-600 text-sm mb-4">{success}</div>}

      {selectedProgramme && (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Modules in Programme:</p>
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : modules.length === 0 ? (
              <p className="text-sm text-slate-400">No modules linked.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-medium">Code</th>
                      <th className="py-2 font-medium">Name</th>
                      <th className="py-2 font-medium">Compulsory?</th>
                      <th className="py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(m => (
                      <tr key={m.module_code} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 font-medium text-slate-800">{m.module_code}</td>
                        <td className="py-2 text-slate-600">{m.module_name}</td>
                        <td className="py-2">
                          <span className={m.is_compulsory ? "text-emerald-600" : "text-slate-400"}>
                            {m.is_compulsory ? "✅ Compulsory" : "Elective"}
                          </span>
                        </td>
                        <td className="py-2 flex gap-2">
                          <button onClick={() => handleToggleCompulsory(m.module_code, m.is_compulsory)} className="text-indigo-600 hover:underline text-xs">
                            {m.is_compulsory ? "Make Elective" : "Make Compulsory"}
                          </button>
                          <button onClick={() => handleRemoveModule(m.module_code)} className="text-red-600 hover:underline text-xs">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Add Module to Programme:</p>
            <div className="flex gap-2">
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white flex-1"
                onChange={(e) => { if (e.target.value) handleAddModule(e.target.value); e.target.value = ""; }}
                value=""
              >
                <option value="">-- Select module --</option>
                {availableModules.map(m => (
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

export default AdminProgrammeModules;