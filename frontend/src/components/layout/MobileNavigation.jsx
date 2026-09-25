import { X, LogOut } from "lucide-react";
import UfhLogo from "../branding/UfhLogo";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  ["summary", "Summary"],
  ["history", "History"],
  ["planning", "Planning"],
  ["timeline", "Timeline"],
  ["predictor", "Predictor"],
  ["planner", "Planner"],
  ["community", "Community"],
  ["achievements", "Achievements"],
  ["peers", "Peers"],
  ["yearly", "Yearly"],
];

export default function MobileNavigation({
  open,
  onClose,
  activeTab,
  onTabChange,
  onLogout,
  communityLocked = false,
}) {
  function selectTab(id) {
    onTabChange(id);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          />

          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 35,
            }}
            className="fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col bg-white shadow-2xl lg:hidden dark:bg-zinc-950"
          >
            <div className="flex h-[72px] items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <UfhLogo
                  variant="crest"
                  className="size-10 shrink-0 rounded-xl object-contain shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                />

                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  Credit Tracker
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                aria-label="Close menu"
              >
                <X size={19} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {tabs
                .filter(([id]) => !(communityLocked && id === "community"))
                .map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTab(id)}
                  className={`mb-1 w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                    activeTab === id
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut size={17} />
                Log out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}