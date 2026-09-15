// frontend/src/components/ModuleStatusBadge.jsx
function ModuleStatusBadge({ status, grade }) {
  const statusMap = {
    completed: {
      label: "✅ Completed",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    failed: {
      label: "❌ Failed",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    "in-progress": {
      label: "🔄 In Progress",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    planned: {
      label: "📋 Planned",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    not_taken: {
      label: "○ Not Taken",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

  const config = statusMap[status] || statusMap.not_taken;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.className}`}>
      {config.label}
      {grade !== null && grade !== undefined && (
        <span className={`ml-1 ${grade >= 50 ? "text-emerald-600" : "text-red-600"}`}>
          ({grade}%)
        </span>
      )}
    </span>
  );
}

export default ModuleStatusBadge;