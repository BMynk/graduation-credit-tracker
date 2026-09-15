// frontend/src/components/admin/AdminViewAsStudent.jsx
import { useState } from "react";
import { api } from "../../api";
import { setSession } from "../../api"; // You'll need to export setSession from api.js

function AdminViewAsStudent({ studentId, studentName }) {
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!confirm(`View as ${studentName}? You will see exactly what they see.`)) return;
    setLoading(true);
    try {
      const tokens = await api.adminImpersonate(studentId);
      // Save tokens as student role
      setSession(tokens, "student");
      // Reload the page to switch to student view
      window.location.reload();
    } catch (err) {
      alert("Failed to impersonate: " + err.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleImpersonate}
      disabled={loading}
      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 transition disabled:opacity-50"
    >
      {loading ? "Loading..." : "👁️ View as Student"}
    </button>
  );
}

export default AdminViewAsStudent;