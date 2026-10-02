import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function ModulePicker({ modules, value, onChange, disabled = false, loading = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef(null);
  const search = useRef(null);
  const selected = modules.find((item) => item.module_code === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...modules]
      .filter((item) => !term || `${item.module_code} ${item.module_name}`.toLowerCase().includes(term))
      .sort((a, b) => a.module_code.localeCompare(b.module_code, undefined, { numeric: true }));
  }, [modules, query]);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={root} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select module"
        onClick={() => { setQuery(""); setOpen((previous) => !previous); }}
        className="flex h-[46px] w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 outline-none transition hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      >
        <span className="min-w-0 truncate">
          {loading ? "Loading modules..." : selected ? `${selected.module_code} — ${selected.module_name}` : "Select module"}
        </span>
        <ChevronDown size={16} className="shrink-0 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <Search size={16} className="shrink-0 text-zinc-400" />
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code or module name..."
              aria-label="Search modules"
              className="w-full min-w-0 bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
            />
          </div>
          <div role="listbox" aria-label="Modules" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.map((item) => (
              <button
                key={item.module_code}
                type="button"
                role="option"
                aria-selected={item.module_code === value}
                onClick={() => { onChange(item.module_code); setOpen(false); }}
                className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 ${item.module_code === value ? "bg-blue-50 dark:bg-zinc-800" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-zinc-900 dark:text-white">{item.module_code}</span>
                  <span className="block break-words text-xs text-zinc-600 dark:text-zinc-300">{item.module_name}</span>
                </span>
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.is_compulsory ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"}`}>
                  {item.is_compulsory ? "Compulsory" : "Elective"}
                </span>
                {item.module_code === value && <Check size={15} className="mt-0.5 shrink-0 text-blue-600" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-zinc-500">No matching modules</p>}
          </div>
        </div>
      )}
    </div>
  );
}
