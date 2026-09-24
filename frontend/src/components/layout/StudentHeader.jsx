import { useEffect, useRef, useState } from "react";
import { Bell, Search, Menu, Command, Moon, Sun } from "lucide-react";
import { api } from "../../api";

export default function StudentHeader({ student, onOpenMobileMenu, darkMode, onToggleDarkMode, onOpenCommunity }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const boxRef = useRef(null);

  async function refresh() {
    try { setNotifications(await api.getStudentNotifications()); } catch { /* keep header unobtrusive */ }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const close = (event) => { if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function toggleNotifications() {
    const next = !open;
    setOpen(next);
    if (next) await refresh();
  }

  async function markRead() {
    try {
      await api.markStudentNotificationsRead();
      await refresh();
    } catch { /* no-op */ }
  }

  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onOpenMobileMenu} className="flex size-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-900" aria-label="Open navigation"><Menu size={20} /></button>
          <div className="hidden md:block"><p className="text-sm font-semibold text-zinc-900 dark:text-white">Student Dashboard</p><p className="text-xs text-zinc-500 dark:text-zinc-400">Track your academic progress</p></div>
        </div>

        <button type="button" className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-left text-sm text-zinc-400 transition hover:border-zinc-300 hover:bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"><Search size={16}/><span className="flex-1">Search modules...</span><span className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"><Command size={10}/> K</span></button>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={onToggleDarkMode} className="flex size-10 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>{darkMode ? <Sun size={19}/> : <Moon size={19}/>}</button>

          <div className="relative" ref={boxRef}>
            <button type="button" onClick={toggleNotifications} className="relative flex size-10 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" aria-label="Notifications">
              <Bell size={19}/>
              {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}
            </button>
            {open && (
              <div className="absolute right-0 top-12 w-[340px] max-w-[90vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800"><div><p className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</p><p className="text-[11px] text-zinc-500">{notifications.length} unread</p></div>{notifications.length > 0 && <button onClick={markRead} className="text-xs font-semibold text-brand-600 dark:text-brand-400">Mark messages read</button>}</div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length === 0 ? <p className="px-3 py-8 text-center text-sm text-zinc-500">You're all caught up.</p> : notifications.map((item) => (
                    <button key={item.id} onClick={() => { setOpen(false); onOpenCommunity?.(); }} className="w-full rounded-xl px-3 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-zinc-500">{item.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-8 w-px bg-zinc-200 sm:block dark:bg-zinc-800"/>
          <div className="hidden text-right sm:block"><p className="max-w-40 truncate text-xs font-semibold text-zinc-900 dark:text-white">{student?.name || "Student"}</p><p className="text-[11px] text-zinc-500 dark:text-zinc-400">Year {student?.current_year || "—"}</p></div>
        </div>
      </div>
    </header>
  );
}
