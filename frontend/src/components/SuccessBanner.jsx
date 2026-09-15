// frontend/src/components/SuccessBanner.jsx
function SuccessBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-600 dark:text-emerald-500 dark:hover:text-emerald-300 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

export default SuccessBanner;