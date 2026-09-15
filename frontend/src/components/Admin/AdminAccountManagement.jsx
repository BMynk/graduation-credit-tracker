// frontend/src/components/admin/AdminAccountManagement.jsx
import { useState, useEffect } from "react";
import { api } from "../../api";
import Card from "../Card";

function AdminAccountManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", is_super_admin: false });
  const [myProfile, setMyProfile] = useState(null);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.adminListAdmins();
      setAdmins(data);
      const me = await api.adminGetMyProfile();
      setMyProfile(me);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ✅ Password length validation
    if (form.password.length < 8) {
      setError("❌ Password must be at least 8 characters long.");
      return;
    }

    try {
      await api.adminCreateAdmin({ ...form, is_super_admin: form.is_super_admin });
      setSuccess(`✅ Admin ${form.username} created.`);
      setIsCreating(false);
      setForm({ name: "", username: "", password: "", is_super_admin: false });
      loadAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!confirm(`Deactivate this admin?`)) return;
    try {
      if (currentStatus) {
        await api.adminDeleteAdmin(id);
      } else {
        await api.adminReactivateAdmin(id);
      }
      loadAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (id, username) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword || newPassword.length < 8) {
      alert("❌ Password must be at least 8 characters.");
      return;
    }
    try {
      await api.adminResetAdminPassword(id, { new_password: newPassword });
      setSuccess(`✅ Password for ${username} reset.`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card title="👤 Admin Accounts">
      {error && <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
      {success && <div className="text-emerald-600 text-sm mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{success}</div>}

      {myProfile && myProfile.is_super_admin ? (
        <>
          <button onClick={() => setIsCreating(!isCreating)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 mb-4 transition">
            {isCreating ? "❌ Cancel" : "➕ Create Admin"}
          </button>

          {isCreating && (
            <form onSubmit={handleCreate} className="bg-slate-50 p-4 rounded-lg mb-4 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={form.username}
                  onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">⚠️ Must be at least 8 characters.</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="super"
                  checked={form.is_super_admin}
                  onChange={(e) => setForm(f => ({ ...f, is_super_admin: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="super" className="text-sm text-slate-600">Super Admin</label>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2">Create</button>
                <button type="button" onClick={() => setIsCreating(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">Cancel</button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-slate-400">No admins found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Username</th>
                    <th className="py-2 font-medium">Role</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 font-medium text-slate-800">{a.name}</td>
                      <td className="py-2 text-slate-600">{a.username}</td>
                      <td className="py-2">{a.is_super_admin ? <span className="text-amber-600 font-medium">Super Admin</span> : "Admin"}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {a.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 flex gap-2">
                        {a.id !== myProfile.id && (
                          <>
                            <button onClick={() => handleToggleStatus(a.id, a.is_active)} className="text-red-600 hover:underline text-xs">
                              {a.is_active ? "Deactivate" : "Reactivate"}
                            </button>
                            <button onClick={() => handleResetPassword(a.id, a.username)} className="text-indigo-600 hover:underline text-xs">Reset Password</button>
                          </>
                        )}
                        {a.id === myProfile.id && <span className="text-xs text-slate-400">(You)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400">🔒 Super admin privileges required to manage admin accounts.</p>
      )}
    </Card>
  );
}

export default AdminAccountManagement;