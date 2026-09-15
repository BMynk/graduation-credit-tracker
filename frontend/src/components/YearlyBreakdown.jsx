// frontend/src/components/YearlyBreakdown.jsx
import { useState, useEffect } from "react";
import { api } from "../api";
import Card from "./Card";
import ErrorBanner from "./ErrorBanner";
import ModuleStatusBadge from "./ModuleStatusBadge";

function YearlyBreakdown({ onModuleClick }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    api.request("/progress/yearly-breakdown", { auth: true })
      .then(setYears)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onDismiss={() => setError("")} />;
  if (years.length === 0) {
    return (
      <Card title="📅 Year-by-Year Breakdown">
        <p className="text-sm text-slate-400">No academic data found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">📅 Year-by-Year Breakdown</h2>
      {years.map((yearData) => (
        <Card key={yearData.year} className="overflow-hidden">
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-lg transition"
            onClick={() => toggleYear(yearData.year)}
          >
            <div>
              <h3 className="font-bold text-slate-800">{yearData.year}</h3>
              <p className="text-sm text-slate-500">
                {yearData.year_modules} modules · {yearData.year_credits} credits 
                {yearData.year_average !== null && ` · Avg: ${yearData.year_average}%`}
              </p>
            </div>
            <span className="text-2xl">{expandedYears[yearData.year] ? '▼' : '▶'}</span>
          </div>

          {expandedYears[yearData.year] && (
            <div className="mt-4 space-y-4">
              {yearData.semesters.map((sem) => (
                <div key={sem.semester} className="border-l-4 border-indigo-300 pl-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-slate-700">{sem.semester}</h4>
                    <span className="text-sm text-slate-500">
                      {sem.credits_completed} credits · {sem.module_count} modules
                      {sem.average !== null && ` · Avg: ${sem.average}%`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sem.modules.map((enrolment) => (
                      <div 
                        key={enrolment.id}
                        onClick={() => onModuleClick?.(enrolment.module.code)}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      >
                        <div>
                          <span className="font-medium text-slate-800">{enrolment.module.code}</span>
                          <span className="text-slate-500 ml-2">{enrolment.module.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({enrolment.module.credits}cr)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {enrolment.grade !== null && (
                            <span className={`text-sm font-semibold ${enrolment.grade >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {enrolment.grade}%
                            </span>
                          )}
                          <ModuleStatusBadge status={enrolment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export default YearlyBreakdown;