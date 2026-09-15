// frontend/src/components/admin/AdminModuleList.jsx
import { useState, useEffect } from "react";
import { api } from "../../api";
import Card from "../Card";

function AdminModuleList() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", credits: "", category: "", level: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await api.listModules({ limit: 500 });
      setModules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadModules(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, credits: parseInt(form.credits), level: parseInt(form.level) };
      if (isCreating) {
        await api.adminCreateModule(payload);
      } else {
        await api.adminUpdateModule(editing, payload);
      }
      setIsCreating(false);
      setEditing(null);
      setForm({ code: "", name: "", credits: "", category: "", level: "", description: "" });
      loadModules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Delete module ${code}? This cannot be undone if students are enrolled.`)) return;
    try {
      await api.adminDeleteModule(code);
      loadModules();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (module) => {
    setEditing(module.code);
    setForm({
      code: module.code,
      name: module.name,
      credits: module.credits,
      category: module.category,
      level: module.level,
      description: module.description || "",
    });
    setIsCreating(false);
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", credits: "", category: "core", level: "1", description: "" });
    setIsCreating(true);
  };

  return (
    <Card title="📚 Modules">
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <button onClick={startCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 mb-4 transition">
        + Add Module
      </button>

      {(isCreating || editing) && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg mb-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              required
              disabled={!isCreating} // code can't be changed on edit
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Credits</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.credits}
              onChange={(e) => setForm(f => ({ ...f, credits: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.category}
              onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            >
              <option value="core">Core</option>
              <option value="elective">Elective</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.level}
              onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              rows="2"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition">
              {isCreating ? "Create" : "Update"}
            </button>
            <button type="button" onClick={() => { setIsCreating(false); setEditing(null); }} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-slate-400">No modules found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Credits</th>
                <th className="py-2 font-medium">Level</th>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.code} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 font-medium text-slate-800">{m.code}</td>
                  <td className="py-2 text-slate-600">{m.name}</td>
                  <td className="py-2 text-slate-600">{m.credits}</td>
                  <td className="py-2 text-slate-600">{m.level}</td>
                  <td className="py-2 text-slate-600 capitalize">{m.category}</td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => startEdit(m)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(m.code)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default AdminModuleList;