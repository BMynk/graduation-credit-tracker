import { useEffect, useMemo, useState } from "react";
import { Check, Coins, LockKeyhole, ShoppingBag, Sparkles } from "lucide-react";
import { api } from "../../api";
import { Card } from "../../components/ui/Card";

const CATEGORY_LABELS = {
  title: "Titles",
  theme: "Profile Themes",
  frame: "Profile Frames",
  marcel: "Marcel Cosmetics",
};

export default function RewardsShop({ onWalletChange }) {
  const [data, setData] = useState(null);
  const [category, setCategory] = useState("all");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await api.getRewards();
      setData(result);
      onWalletChange?.(result);
    } catch (err) {
      setError(err?.message || "Unable to load XP rewards.");
    }
  }

  useEffect(() => { load(); }, []);

  const rewards = useMemo(() => {
    const all = data?.rewards || [];
    return category === "all" ? all : all.filter((item) => item.category === category);
  }, [data, category]);

  async function act(kind, reward) {
    try {
      setBusy(reward.id);
      setError("");
      const result =
        kind === "purchase" ? await api.purchaseReward(reward.id) :
        reward.equipped ? await api.unequipReward(reward.id) :
        await api.equipReward(reward.id);
      setData(result);
      onWalletChange?.(result);
    } catch (err) {
      setError(err?.message || "Unable to update this reward.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-brand-500" />
              <h2 className="font-bold text-zinc-950 dark:text-white">EXP Rewards Shop</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Spend available EXP on cosmetics. Lifetime EXP and your level never decrease when you buy a reward.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-amber-500/10 px-4 py-2">
              <p className="text-[10px] font-semibold text-zinc-500">Available EXP</p>
              <p className="font-black text-amber-600 dark:text-amber-400">{(data?.available_xp || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-brand-500/10 px-4 py-2">
              <p className="text-[10px] font-semibold text-zinc-500">Lifetime EXP</p>
              <p className="font-black text-brand-600 dark:text-brand-400">{(data?.lifetime_xp || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {[["all","All"], ...Object.entries(CATEGORY_LABELS)].map(([id,label]) => (
            <button key={id} type="button" onClick={() => setCategory(id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${category === id ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
              {label}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => {
          const locked = !reward.level_unlocked;
          const affordable = (data?.available_xp || 0) >= reward.cost_xp;
          return (
            <div key={reward.id} className="relative rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">{reward.icon}</div>
                {reward.equipped && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-600"><Check className="size-3"/> Equipped</span>}
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">{reward.name}</p>
              <p className="mt-1 min-h-10 text-xs leading-5 text-zinc-500">{reward.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400"><Coins className="size-3.5"/>{reward.cost_xp.toLocaleString()} EXP</span>
                <span className="text-[10px] text-zinc-400">Level {reward.min_level}+</span>
              </div>
              <button type="button" disabled={busy === reward.id || locked || (!reward.owned && !affordable)}
                onClick={() => act(reward.owned ? "equip" : "purchase", reward)}
                className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800">
                {busy === reward.id ? "Updating..." : locked ? <><LockKeyhole className="size-3.5"/>Reach Level {reward.min_level}</> : reward.owned ? reward.equipped ? "Unequip" : <><Sparkles className="size-3.5"/>Equip</> : affordable ? "Purchase" : "Not enough EXP"}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
