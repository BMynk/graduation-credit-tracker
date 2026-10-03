import { useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { api } from "../../api";
import { Card } from "../../components/ui/Card";

export default function XpLeaderboard() {
  const [board, setBoard] = useState(null);
  const [division, setDivision] = useState("overall");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    setError("");
    try { setBoard(await api.getXpLeaderboard(division)); }
    catch (err) { setError(err?.message || "Unable to load leaderboard."); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [division]);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
        <div><div className="flex items-center gap-2"><Trophy className="size-5 text-amber-500"/><h2 className="font-bold text-zinc-900 dark:text-white">EXP leaderboard</h2></div>
          <p className="mt-1 text-xs text-zinc-500">Lifetime EXP ranking · Student names</p></div>
        <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700"><RefreshCw className="size-3.5"/>Refresh</button>
      </div>
      <div className="p-5">
        <div role="group" aria-label="Leaderboard division" className="mb-4 flex flex-wrap gap-2">
          {[["overall", "Overall"], ["programme", "My programme"], ["year", "My year"], ["programme_year", "Programme + year"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setBoard(null); setDivision(id); }}
              aria-pressed={division === id}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${division === id ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"}`}>{label}</button>
          ))}
        </div>
        {board && <p className="mb-3 text-xs text-zinc-500">{[board.programme, board.year ? `Year ${board.year}` : null].filter(Boolean).join(" · ") || "All participating students"} · {board.participants} ranked</p>}
        {loading && <p className="text-sm text-zinc-500">Loading rankings…</p>}
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        {!loading && board && <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand-500/10 p-4"><p className="text-xs text-zinc-500">Your rank</p><p className="mt-1 text-2xl font-black text-brand-600 dark:text-brand-400">#{board.my_rank ?? "—"}</p></div>
            <div className="rounded-xl bg-amber-500/10 p-4"><p className="text-xs text-zinc-500">Your lifetime EXP</p><p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{board.my_xp.toLocaleString()}</p></div>
          </div>
          <ol className="space-y-2">
            {board.leaders.map((person) => (
              <li key={person.rank} className={`flex items-center gap-3 rounded-xl border p-3 ${person.is_me ? "border-brand-300 bg-brand-500/5 dark:border-brand-500/40" : "border-zinc-100 dark:border-zinc-800"}`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{person.rank <= 3 ? ["🥇", "🥈", "🥉"][person.rank - 1] : `#${person.rank}`}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">{person.label}</span>
                <span className="shrink-0 text-sm font-bold text-amber-600 dark:text-amber-400">{person.xp.toLocaleString()} EXP</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-5 text-zinc-500">{board.note}</p>
        </>}
      </div>
    </Card>
  );
}

