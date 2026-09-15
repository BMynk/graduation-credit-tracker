// frontend/src/components/Card.jsx
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      {title && <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

export default Card;