import { useEffect, useState } from "react";
import { api } from "../../api";

export default function CurriculumVerification() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    setError("");
    api.adminCurriculumVerification().then(setReport)
      .catch((err) => setError(err.message || "Could not load verification report"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  return <section className="space-y-5 p-1">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Curriculum verification</h1>
        <p className="mt-1 text-sm text-slate-500">Read-only comparison with the bundled 2026 reference.</p></div>
      <button type="button" onClick={load} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Refresh report</button>
    </div>
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      This is an internal consistency check, not official UFH prospectus certification.
      Earlier student cohorts may follow different valid curricula. No student records are changed.
    </p>
    {loading && <p role="status">Checking programme mappings…</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {report && <div className="space-y-3">{report.programmes.map((programme) =>
      <details key={programme.programme_code} className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold">
          {programme.programme_code} — {programme.programme_name}
          <span className="ml-3 text-sm font-normal text-slate-500">
            {programme.issue_count ? `${programme.issue_count} discrepancies` : "Matches bundled reference"}
          </span>
        </summary>
        {programme.issues.length ? <ul className="mt-3 space-y-2 text-sm">
          {programme.issues.map((issue, index) => <li key={index} className="border-t pt-2">
            <strong>{issue.module || "Programme"}</strong>: {issue.detail}
          </li>)}
        </ul> : <p className="mt-2 text-sm text-slate-500">No differences found against the bundled reference.</p>}
      </details>
    )}</div>}
  </section>;
}
