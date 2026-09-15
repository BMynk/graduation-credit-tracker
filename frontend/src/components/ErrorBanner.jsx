// frontend/src/components/ErrorBanner.jsx
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;