import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Gem,
  GraduationCap,
  LockKeyhole,
  Medal,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { api } from "../../api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const CATEGORY_CONFIG = {
  milestone: {
    label: "Milestones",
    icon: Trophy,
  },
  academic: {
    label: "Academic",
    icon: GraduationCap,
  },
  excellence: {
    label: "Excellence",
    icon: Star,
  },
  perseverance: {
    label: "Perseverance",
    icon: Flame,
  },
};

const RARITY_CONFIG = {
  common: {
    label: "Common",
    badge:
      "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    border:
      "border-zinc-200 dark:border-zinc-800",
    glow: "",
  },

  uncommon: {
    label: "Uncommon",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    border:
      "border-emerald-200/80 dark:border-emerald-500/20",
    glow: "bg-emerald-400/10",
  },

  rare: {
    label: "Rare",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
    border:
      "border-blue-200/80 dark:border-blue-500/20",
    glow: "bg-blue-400/10",
  },

  epic: {
    label: "Epic",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400",
    border:
      "border-violet-300/80 dark:border-violet-500/30",
    glow: "bg-violet-500/15",
  },

  legendary: {
    label: "Legendary",
    badge:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    border:
      "border-amber-300 dark:border-amber-500/40",
    glow: "bg-amber-400/20",
  },
};

function getRarity(rarity) {
  return (
    RARITY_CONFIG[rarity?.toLowerCase()] ||
    RARITY_CONFIG.common
  );
}

function AchievementIcon({ achievement }) {
  const rarity = getRarity(achievement.rarity);

  if (!achievement.unlocked) {
    return (
      <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800/70 dark:text-zinc-500">
        <LockKeyhole className="size-5" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${rarity.border} bg-white shadow-sm dark:bg-zinc-900`}
    >
      {rarity.glow && (
        <div
          className={`absolute inset-0 ${rarity.glow}`}
        />
      )}

      <span className="relative text-2xl">
        {achievement.icon}
      </span>

      <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-zinc-900">
        <CheckCircle2 className="size-3" />
      </div>
    </div>
  );
}

function RarityBadge({ rarity }) {
  const config = getRarity(rarity);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.badge}`}
    >
      {config.label}
    </span>
  );
}

function AchievementCard({ achievement, index }) {
  const category =
    CATEGORY_CONFIG[achievement.category] ||
    CATEGORY_CONFIG.milestone;

  const rarity = getRarity(achievement.rarity);
  const CategoryIcon = category.icon;

  const special =
    achievement.rarity === "legendary" ||
    achievement.rarity === "epic";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.025, 0.2),
      }}
      whileHover={
        achievement.unlocked
          ? {
              y: -4,
              transition: { duration: 0.18 },
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all ${
        achievement.unlocked
          ? `${rarity.border} bg-white shadow-sm hover:shadow-md dark:bg-zinc-900/80`
          : "border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/30"
      }`}
    >
      {achievement.unlocked && rarity.glow && (
        <div
          className={`pointer-events-none absolute -right-12 -top-12 size-32 rounded-full blur-3xl ${rarity.glow}`}
        />
      )}

      {special && achievement.unlocked && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
      )}

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <RarityBadge
            rarity={achievement.rarity}
          />

          <div
            className={`flex items-center gap-1 text-[10px] font-bold ${
              achievement.unlocked
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-400"
            }`}
          >
            <Zap className="size-3" />
            +{achievement.xp || 0} XP
          </div>
        </div>

        <div className="flex items-start gap-4">
          <AchievementIcon
            achievement={achievement}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-sm font-bold ${
                  achievement.unlocked
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {achievement.title}
              </h3>

              {achievement.unlocked && (
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                </span>
              )}
            </div>

            <p
              className={`mt-1.5 text-xs leading-5 ${
                achievement.unlocked
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {achievement.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
            <CategoryIcon className="size-3.5" />
            {category.label}
          </div>

          {achievement.unlocked ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Unlocked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
              <LockKeyhole className="size-3" />
              Locked
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = "brand",
}) {
  const accentClasses = {
    brand:
      "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            accentClasses[accent] ||
            accentClasses.brand
          }`}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-zinc-500">
            {label}
          </p>

          <p className="mt-0.5 truncate text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          {helper && (
            <p className="mt-0.5 text-[10px] text-zinc-400">
              {helper}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function LevelHero({ data, unlocked, total }) {
  const level = data?.level || 1;
  const levelTitle =
    data?.level_title || "Rookie";

  const totalXp = data?.total_xp || 0;

  const levelProgress =
    data?.level_progress ?? 0;

  const xpToNext =
    data?.xp_to_next_level ?? 0;

  const nextLevelTitle =
    data?.next_level_title;

  return (
    <Card className="relative overflow-hidden border-brand-500/10">
      <div className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full bg-brand-500/[0.10] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 size-52 rounded-full bg-amber-400/[0.06] blur-3xl" />

      <div className="relative p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">
                <Trophy className="size-3.5" />
                Achievement journey
              </Badge>

              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Zap className="size-3" />
                {totalXp.toLocaleString()} XP
              </span>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                  Level {level}
                </h2>

                <span className="pb-1 text-sm font-bold text-brand-600 dark:text-brand-400">
                  {levelTitle}
                </span>
              </div>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Every achievement earns XP. Keep
                progressing through your degree to
                increase your achievement level.
              </p>
            </div>

            <div className="mt-6 max-w-2xl">
              <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  Level progress
                </span>

                <span className="font-bold text-zinc-900 dark:text-white">
                  {Math.round(levelProgress)}%
                </span>
              </div>

              <div className="relative h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      levelProgress,
                      100,
                    )}%`,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-amber-400"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                {nextLevelTitle ? (
                  <>
                    <span>
                      <strong className="text-zinc-900 dark:text-white">
                        {xpToNext.toLocaleString()} XP
                      </strong>{" "}
                      until {nextLevelTitle}
                    </span>

                    <span>
                      Next:{" "}
                      <strong className="text-brand-600 dark:text-brand-400">
                        {nextLevelTitle}
                      </strong>
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                    <Crown className="size-3.5" />
                    Maximum level reached
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex size-36 items-center justify-center lg:mx-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/20 via-violet-500/10 to-amber-400/20 blur-xl" />

            <div className="relative flex size-32 flex-col items-center justify-center rounded-full border border-brand-500/20 bg-white/80 shadow-xl shadow-brand-500/5 backdrop-blur dark:bg-zinc-900/80">
              <Crown className="size-6 text-amber-500" />

              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                {level}
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                {levelTitle}
              </p>

              <div className="mt-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {unlocked}/{total}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RecentUnlocks({ achievements }) {
  if (!achievements?.length) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />

          <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
            Recent unlocks
          </h2>
        </div>

        <span className="text-[10px] text-zinc-400">
          Latest achievements
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto p-5">
        {achievements.map((achievement) => {
          const rarity = getRarity(
            achievement.rarity,
          );

          return (
            <motion.div
              key={achievement.id}
              whileHover={{ y: -2 }}
              className={`relative min-w-[235px] overflow-hidden rounded-xl border ${rarity.border} bg-white p-4 dark:bg-zinc-900`}
            >
              {rarity.glow && (
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 size-20 rounded-full blur-2xl ${rarity.glow}`}
                />
              )}

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-xl dark:bg-zinc-800">
                    {achievement.icon}
                  </div>

                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                    <Zap className="size-3" />
                    +{achievement.xp || 0}
                  </span>
                </div>

                <p className="mt-3 truncate text-xs font-bold text-zinc-900 dark:text-white">
                  {achievement.title}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <RarityBadge
                    rarity={achievement.rarity}
                  />

                  <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Unlocked
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

function RarityOverview({ achievements }) {
  const unlocked = achievements.filter(
    (achievement) => achievement.unlocked,
  );

  const counts = unlocked.reduce(
    (acc, achievement) => {
      const rarity =
        achievement.rarity || "common";

      acc[rarity] = (acc[rarity] || 0) + 1;

      return acc;
    },
    {},
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Gem className="size-4 text-violet-500" />

        <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
          Rarity collection
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Object.entries(RARITY_CONFIG).map(
          ([id, config]) => (
            <div
              key={id}
              className="rounded-xl bg-zinc-50 px-3 py-3 text-center dark:bg-zinc-800/50"
            >
              <p className="text-lg font-black text-zinc-950 dark:text-white">
                {counts[id] || 0}
              </p>

              <span
                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${config.badge}`}
              >
                {config.label}
              </span>
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

export default function AchievementsPage() {
  const [data, setData] = useState(null);

  const [filter, setFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [rarityFilter, setRarityFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      setLoading(true);
      setError("");

      const result =
        await api.getAchievements();

      setData(result);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load your achievements.",
      );
    } finally {
      setLoading(false);
    }
  }

  const achievements =
    data?.achievements || [];

  const unlocked =
    data?.unlocked_achievements || 0;

  const total =
    data?.total_achievements || 0;

  const locked =
    data?.locked_achievements ??
    Math.max(total - unlocked, 0);

  const percentage =
    data?.completion_percentage || 0;

  const filteredAchievements = useMemo(
    () =>
      achievements.filter((achievement) => {
        const categoryMatches =
          filter === "all" ||
          achievement.category === filter;

        const rarityMatches =
          rarityFilter === "all" ||
          achievement.rarity === rarityFilter;

        let statusMatches = true;

        if (statusFilter === "unlocked") {
          statusMatches =
            achievement.unlocked === true;
        }

        if (statusFilter === "locked") {
          statusMatches =
            achievement.unlocked !== true;
        }

        return (
          categoryMatches &&
          rarityMatches &&
          statusMatches
        );
      }),
    [
      achievements,
      filter,
      statusFilter,
      rarityFilter,
    ],
  );

  const categoryCounts = useMemo(() => {
    return achievements.reduce(
      (acc, achievement) => {
        acc[achievement.category] =
          (acc[achievement.category] || 0) +
          1;

        return acc;
      },
      {},
    );
  }, [achievements]);

  const highestUnlockedRarity =
    useMemo(() => {
      const order = [
        "legendary",
        "epic",
        "rare",
        "uncommon",
        "common",
      ];

      return (
        order.find((rarity) =>
          achievements.some(
            (achievement) =>
              achievement.unlocked &&
              achievement.rarity === rarity,
          ),
        ) || "None"
      );
    }, [achievements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
              />
            ),
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <Award className="size-5" />
          </div>

          <h2 className="mt-4 font-semibold text-zinc-900 dark:text-white">
            Achievements unavailable
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadAchievements}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
          },
        },
      }}
      className="space-y-6"
    >
      {/* Header */}

      <motion.div variants={fadeUp}>
        <Badge variant="primary">
          <Trophy className="size-3.5" />
          Achievements
        </Badge>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              Your achievements
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Earn achievements, collect XP and
              level up as you progress through your
              degree.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="size-4 text-amber-500" />

            <span>
              <strong className="text-zinc-900 dark:text-white">
                {unlocked}
              </strong>{" "}
              of {total} unlocked
            </span>
          </div>
        </div>
      </motion.div>

      {/* XP Hero */}

      <motion.div variants={fadeUp}>
        <LevelHero
          data={data}
          unlocked={unlocked}
          total={total}
        />
      </motion.div>

      {/* Stats */}

      <motion.div
        variants={fadeUp}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={Zap}
          label="Total XP"
          value={(data?.total_xp || 0).toLocaleString()}
          helper={`Level ${data?.level || 1} • ${
            data?.level_title || "Rookie"
          }`}
          accent="amber"
        />

        <StatCard
          icon={Trophy}
          label="Achievements"
          value={`${unlocked}/${total}`}
          helper={`${locked} still to unlock`}
          accent="brand"
        />

        <StatCard
          icon={Target}
          label="Collection"
          value={`${percentage}%`}
          helper="Overall completion"
          accent="emerald"
        />

        <StatCard
          icon={Gem}
          label="Best rarity"
          value={
            highestUnlockedRarity === "None"
              ? "None"
              : getRarity(
                  highestUnlockedRarity,
                ).label
          }
          helper="Highest rarity unlocked"
          accent="violet"
        />
      </motion.div>

      {/* Recent unlocks */}

      <motion.div variants={fadeUp}>
        <RecentUnlocks
          achievements={data?.recent_unlocks}
        />
      </motion.div>

      {/* Rarity overview */}

      <motion.div variants={fadeUp}>
        <RarityOverview
          achievements={achievements}
        />
      </motion.div>

      {/* Filters */}

      <motion.div
        variants={fadeUp}
        className="space-y-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              All
            </button>

            {Object.entries(
              CATEGORY_CONFIG,
            ).map(
              ([
                category,
                { label, icon: Icon },
              ]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setFilter(category)
                  }
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    filter === category
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <Icon className="size-3.5" />

                  {label}

                  {categoryCounts[
                    category
                  ] ? (
                    <span className="opacity-60">
                      {
                        categoryCounts[
                          category
                        ]
                      }
                    </span>
                  ) : null}
                </button>
              ),
            )}
          </div>

          <div className="inline-flex w-fit rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {[
              ["all", "All"],
              ["unlocked", "Unlocked"],
              ["locked", "Locked"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setStatusFilter(id)
                }
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                  statusFilter === id
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rarity filters */}

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Rarity
          </span>

          <button
            type="button"
            onClick={() =>
              setRarityFilter("all")
            }
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
              rarityFilter === "all"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            All
          </button>

          {Object.entries(
            RARITY_CONFIG,
          ).map(([id, config]) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setRarityFilter(id)
              }
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                rarityFilter === id
                  ? config.badge
                  : "border-zinc-200 text-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Achievement collection */}

      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Achievement collection
            </h2>

            <p className="mt-1 text-[11px] text-zinc-500">
              Build your collection as you progress.
            </p>
          </div>

          <span className="text-xs text-zinc-400">
            {filteredAchievements.length} shown
          </span>
        </div>

        {filteredAchievements.length >
        0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAchievements.map(
              (achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  index={index}
                />
              ),
            )}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <LockKeyhole className="mx-auto size-6 text-zinc-300" />

              <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No achievements here
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Try another category, rarity or
                status filter.
              </p>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Next challenges */}

      {data?.next_milestones?.length >
        0 && (
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-brand-500" />

                <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Next challenges
                </h2>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Keep progressing to collect these
                XP rewards.
              </p>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.next_milestones.map(
                (achievement) => {
                  const rarity =
                    getRarity(
                      achievement.rarity,
                    );

                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${rarity.border} bg-zinc-50 dark:bg-zinc-800`}
                      >
                        <span className="text-lg opacity-60 grayscale">
                          {achievement.icon}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {achievement.title}
                          </p>

                          <RarityBadge
                            rarity={
                              achievement.rarity
                            }
                          />
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          {
                            achievement.description
                          }
                        </p>
                      </div>

                      <div className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600 sm:flex dark:text-amber-400">
                        <Zap className="size-3" />
                        +{achievement.xp || 0} XP
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}