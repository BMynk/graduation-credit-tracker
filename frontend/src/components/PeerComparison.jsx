import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronUp,
  GraduationCap,
  Info,
  LockKeyhole,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../api";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Progress } from "./ui/Progress";


const fadeUp = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};


function formatPercent(
  value,
  fallback = "—"
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return `${Number(value).toFixed(1)}%`;
}


function getRankSuffix(rank) {
  const value = Number(rank);

  if (!Number.isFinite(value)) {
    return "";
  }

  const mod100 = value % 100;

  if (
    mod100 >= 11 &&
    mod100 <= 13
  ) {
    return "th";
  }

  switch (value % 10) {
    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}


function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = "brand",
}) {
  const accents = {
    brand:
      "bg-brand-500/10 text-brand-600 dark:text-brand-400",

    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",

    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">

        <div
          className={`
            flex size-10 shrink-0
            items-center justify-center
            rounded-xl
            ${accents[accent] || accents.brand}
          `}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">

          <p className="text-xs text-zinc-500">
            {label}
          </p>

          <p
            className="
              mt-0.5 truncate
              text-xl font-bold
              tracking-tight
              text-zinc-950
              dark:text-white
            "
          >
            {value}
          </p>

          {helper && (
            <p
              className="
                mt-0.5 truncate
                text-[10px]
                text-zinc-400
              "
            >
              {helper}
            </p>
          )}

        </div>

      </div>
    </Card>
  );
}


function RankHero({ stats }) {
  const percentile =
    Number(stats.percentile ?? 0);

  const rank = stats.your_rank;

  const total =
    stats.students_with_averages ||
    stats.total_students ||
    1;

  const topPercentage =
    stats.top_percentage ??
    Math.max(
      1,
      Math.round(
        100 - percentile
      )
    );

  return (
    <Card
      className="
        relative overflow-hidden
        border-brand-500/10
      "
    >

      <div
        className="
          pointer-events-none
          absolute -right-32 -top-32
          size-96 rounded-full
          bg-brand-500/[0.10]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute -bottom-36 left-1/4
          size-80 rounded-full
          bg-violet-500/[0.07]
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute left-1/2 top-0
          size-56 rounded-full
          bg-amber-400/[0.05]
          blur-3xl
        "
      />

      <div className="relative p-6 lg:p-8">

        <div
          className="
            grid gap-8
            lg:grid-cols-[1fr_auto]
            lg:items-center
          "
        >

          <div>

            <div
              className="
                flex flex-wrap
                items-center gap-2
              "
            >

              <Badge variant="primary">
                <Users className="size-3.5" />
                Anonymous cohort
              </Badge>

              <span
                className="
                  rounded-full
                  bg-zinc-100
                  px-2.5 py-1
                  text-[10px]
                  font-semibold
                  text-zinc-500
                  dark:bg-zinc-800
                  dark:text-zinc-400
                "
              >
                Year {stats.year}
              </span>

            </div>


            <div className="mt-5">

              <p
                className="
                  text-xs font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-zinc-400
                "
              >
                Your cohort position
              </p>

              <div
                className="
                  mt-2 flex flex-wrap
                  items-end
                  gap-x-3 gap-y-1
                "
              >

                <h2
                  className="
                    text-4xl font-black
                    tracking-tight
                    text-zinc-950
                    sm:text-5xl
                    dark:text-white
                  "
                >
                  #{rank}
                </h2>

                <span
                  className="
                    pb-1
                    text-sm font-semibold
                    text-zinc-500
                  "
                >
                  of {total} students
                </span>

              </div>

              <p
                className="
                  mt-3 max-w-xl
                  text-sm leading-6
                  text-zinc-500
                  dark:text-zinc-400
                "
              >
                Your position is calculated
                using weighted averages from
                students in the same programme
                and academic year.
              </p>

            </div>


            <div className="mt-6 max-w-2xl">

              <div
                className="
                  mb-2 flex
                  items-center
                  justify-between
                  text-[11px]
                "
              >

                <span
                  className="
                    font-semibold
                    text-zinc-600
                    dark:text-zinc-300
                  "
                >
                  Percentile position
                </span>

                <span
                  className="
                    font-bold
                    text-brand-600
                    dark:text-brand-400
                  "
                >
                  {percentile.toFixed(1)}%
                </span>

              </div>


              <div
                className="
                  relative h-2.5
                  overflow-hidden
                  rounded-full
                  bg-zinc-100
                  dark:bg-zinc-800
                "
              >

                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${Math.min(
                      Math.max(
                        percentile,
                        0
                      ),
                      100
                    )}%`,
                  }}
                  transition={{
                    duration: 0.9,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  className="
                    h-full rounded-full
                    bg-gradient-to-r
                    from-brand-500
                    via-violet-500
                    to-emerald-400
                  "
                />

              </div>


              <div
                className="
                  mt-3 flex flex-wrap
                  items-center
                  justify-between
                  gap-2
                  text-[11px]
                  text-zinc-500
                "
              >

                <span>
                  Percentile score{" "}
                  <strong
                    className="
                      text-zinc-900
                      dark:text-white
                    "
                  >
                    {percentile.toFixed(0)}%
                  </strong>
                </span>

                <span
                  className="
                    font-semibold
                    text-brand-600
                    dark:text-brand-400
                  "
                >
                  Top {topPercentage}%
                </span>

              </div>

            </div>

          </div>


          <div
            className="
              relative mx-auto
              flex size-40
              items-center
              justify-center
              lg:mx-0
            "
          >

            <div
              className="
                absolute inset-0
                rounded-full
                bg-gradient-to-br
                from-brand-500/20
                via-violet-500/10
                to-amber-400/20
                blur-xl
              "
            />

            <div
              className="
                relative
                flex size-36
                flex-col
                items-center
                justify-center
                rounded-full
                border
                border-brand-500/20
                bg-white/85
                shadow-xl
                shadow-brand-500/5
                backdrop-blur
                dark:bg-zinc-900/85
              "
            >

              <Trophy
                className="
                  size-7
                  text-amber-500
                "
              />

              <div
                className="
                  mt-2
                  flex items-start
                "
              >

                <span
                  className="
                    text-4xl
                    font-black
                    tracking-tight
                    text-zinc-950
                    dark:text-white
                  "
                >
                  {rank}
                </span>

                <span
                  className="
                    mt-1
                    text-xs
                    font-bold
                    text-zinc-400
                  "
                >
                  {getRankSuffix(rank)}
                </span>

              </div>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-zinc-400
                "
              >
                Cohort rank
              </p>

            </div>

          </div>

        </div>

      </div>

    </Card>
  );
}


function AverageComparison({
  stats,
}) {
  const yourAverage =
    stats.your_average;

  const cohortAverage =
    stats.cohort_average;

  if (
    yourAverage === null ||
    yourAverage === undefined ||
    cohortAverage === null ||
    cohortAverage === undefined
  ) {
    return (
      <Card className="p-6">

        <div
          className="
            flex items-start
            gap-3
          "
        >

          <div
            className="
              flex size-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-zinc-100
              text-zinc-500
              dark:bg-zinc-800
            "
          >
            <BarChart3 className="size-5" />
          </div>

          <div>

            <h3
              className="
                text-sm
                font-semibold
                text-zinc-900
                dark:text-white
              "
            >
              Average comparison
            </h3>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-zinc-500
              "
            >
              More completed and graded
              modules are needed before an
              average comparison can be
              calculated.
            </p>

          </div>

        </div>

      </Card>
    );
  }


  const difference =
    stats.average_difference ??
    (
      Number(yourAverage) -
      Number(cohortAverage)
    );

  const ahead =
    difference >= 0;


  return (
    <Card className="overflow-hidden">

      <div
        className="
          border-b
          border-zinc-100
          px-5 py-4
          dark:border-zinc-800
        "
      >

        <div
          className="
            flex items-center
            gap-2
          "
        >
          <Target
            className="
              size-4
              text-brand-500
            "
          />

          <h2
            className="
              text-sm
              font-semibold
              text-zinc-950
              dark:text-white
            "
          >
            Average comparison
          </h2>
        </div>

        <p
          className="
            mt-1
            text-xs
            text-zinc-500
          "
        >
          Your weighted average compared
          with the cohort average.
        </p>

      </div>


      <div className="p-5">

        <div
          className="
            grid gap-4
            sm:grid-cols-2
          "
        >

          <div
            className="
              rounded-xl
              bg-brand-500/[0.06]
              p-4
            "
          >

            <div
              className="
                flex items-center
                justify-between
              "
            >

              <span
                className="
                  text-xs
                  font-medium
                  text-zinc-500
                "
              >
                Your average
              </span>

              <GraduationCap
                className="
                  size-4
                  text-brand-500
                "
              />

            </div>

            <p
              className="
                mt-3
                text-3xl
                font-black
                tracking-tight
                text-zinc-950
                dark:text-white
              "
            >
              {formatPercent(
                yourAverage
              )}
            </p>

            <div className="mt-4">
              <Progress
                value={Math.min(
                  Number(
                    yourAverage
                  ),
                  100
                )}
              />
            </div>

          </div>


          <div
            className="
              rounded-xl
              bg-zinc-50
              p-4
              dark:bg-zinc-800/50
            "
          >

            <div
              className="
                flex items-center
                justify-between
              "
            >

              <span
                className="
                  text-xs
                  font-medium
                  text-zinc-500
                "
              >
                Cohort average
              </span>

              <Users
                className="
                  size-4
                  text-zinc-400
                "
              />

            </div>

            <p
              className="
                mt-3
                text-3xl
                font-black
                tracking-tight
                text-zinc-950
                dark:text-white
              "
            >
              {formatPercent(
                cohortAverage
              )}
            </p>

            <div className="mt-4">
              <Progress
                value={Math.min(
                  Number(
                    cohortAverage
                  ),
                  100
                )}
              />
            </div>

          </div>

        </div>


        <div
          className={`
            mt-4 flex
            items-start gap-3
            rounded-xl
            border p-4
            ${
              ahead
                ? `
                  border-emerald-500/15
                  bg-emerald-500/[0.06]
                `
                : `
                  border-amber-500/15
                  bg-amber-500/[0.06]
                `
            }
          `}
        >

          <div
            className={`
              flex size-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              ${
                ahead
                  ? `
                    bg-emerald-500/10
                    text-emerald-600
                    dark:text-emerald-400
                  `
                  : `
                    bg-amber-500/10
                    text-amber-600
                    dark:text-amber-400
                  `
              }
            `}
          >

            {ahead ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}

          </div>


          <div>

            <p
              className="
                text-xs
                font-semibold
                text-zinc-900
                dark:text-white
              "
            >
              {ahead
                ? `${Math.abs(
                    difference
                  ).toFixed(
                    1
                  )} percentage points above the cohort average`
                : `${Math.abs(
                    difference
                  ).toFixed(
                    1
                  )} percentage points below the cohort average`
              }
            </p>

            <p
              className="
                mt-1
                text-[11px]
                leading-5
                text-zinc-500
              "
            >
              This comparison uses weighted
              academic averages and does not
              expose another student's
              identity or individual marks.
            </p>

          </div>

        </div>

      </div>

    </Card>
  );
}


function DistributionTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div
      className="
        rounded-lg
        border
        border-zinc-200
        bg-white
        px-3 py-2
        shadow-lg
        dark:border-zinc-700
        dark:bg-zinc-900
      "
    >

      <p
        className="
          text-[10px]
          font-semibold
          text-zinc-500
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xs
          font-bold
          text-zinc-900
          dark:text-white
        "
      >
        {payload[0].value}{" "}
        {payload[0].value === 1
          ? "student"
          : "students"}
      </p>

    </div>
  );
}


function DistributionChart({
  stats,
}) {
  const distribution =
    stats.distribution || [];

  const yourAverage =
    stats.your_average;


  const chartData = useMemo(
    () =>
      distribution.map(
        (item) => ({
          ...item,

          count: Number(
            item.count || 0
          ),
        })
      ),

    [distribution]
  );


  const yourBucket =
    useMemo(() => {
      if (
        yourAverage === null ||
        yourAverage === undefined
      ) {
        return null;
      }

      const average =
        Number(yourAverage);

      if (average >= 90) {
        return "90-100%";
      }

      const low =
        Math.floor(
          average / 10
        ) * 10;

      return `${low}-${low + 10}%`;
    }, [yourAverage]);


  if (!distribution.length) {
    return (
      <Card className="p-6">

        <div
          className="
            flex flex-col
            items-center
            justify-center
            py-8
            text-center
          "
        >

          <div
            className="
              flex size-11
              items-center
              justify-center
              rounded-xl
              bg-zinc-100
              text-zinc-400
              dark:bg-zinc-800
            "
          >
            <BarChart3 className="size-5" />
          </div>

          <h3
            className="
              mt-4
              text-sm
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            Distribution not available yet
          </h3>

          <p
            className="
              mt-1
              max-w-sm
              text-xs
              leading-5
              text-zinc-500
            "
          >
            The chart will appear once
            students in your cohort have
            completed graded modules.
          </p>

        </div>

      </Card>
    );
  }


  return (
    <Card className="overflow-hidden">

      <div
        className="
          flex flex-col
          gap-2
          border-b
          border-zinc-100
          px-5 py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          dark:border-zinc-800
        "
      >

        <div>

          <div
            className="
              flex items-center
              gap-2
            "
          >

            <BarChart3
              className="
                size-4
                text-violet-500
              "
            />

            <h2
              className="
                text-sm
                font-semibold
                text-zinc-950
                dark:text-white
              "
            >
              Cohort distribution
            </h2>

          </div>

          <p
            className="
              mt-1
              text-xs
              text-zinc-500
            "
          >
            Number of students in each
            average range.
          </p>

        </div>


        {yourBucket && (
          <div
            className="
              flex items-center
              gap-1.5
              text-[10px]
              font-semibold
              text-brand-600
              dark:text-brand-400
            "
          >

            <span
              className="
                size-2
                rounded-full
                bg-brand-500
              "
            />

            Your range: {yourBucket}

          </div>
        )}

      </div>


      <div className="p-5">

        <div
          className="
            h-[300px]
            w-full
          "
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 5,
              }}
            >

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.08}
              />

              <XAxis
                dataKey="range"
                tick={{
                  fontSize: 10,
                  fill: "#71717a",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 10,
                  fill: "#71717a",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                cursor={{
                  fill:
                    "rgba(113,113,122,0.06)",
                }}
                content={
                  <DistributionTooltip />
                }
              />

              <Bar
                dataKey="count"
                radius={[
                  6,
                  6,
                  2,
                  2,
                ]}
                maxBarSize={48}
              >

                {chartData.map(
                  (entry) => (
                    <Cell
                      key={
                        entry.range
                      }
                      fill={
                        entry.range ===
                        yourBucket
                          ? "#3B6FF5"
                          : "#A1A1AA"
                      }
                      opacity={
                        entry.range ===
                        yourBucket
                          ? 1
                          : 0.45
                      }
                    />
                  )
                )}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>


        <div
          className="
            mt-3 flex
            items-start
            gap-2
            rounded-lg
            bg-zinc-50
            px-3 py-2.5
            dark:bg-zinc-800/40
          "
        >

          <Info
            className="
              mt-0.5
              size-3.5
              shrink-0
              text-zinc-400
            "
          />

          <p
            className="
              text-[10px]
              leading-4
              text-zinc-500
            "
          >
            The highlighted bar shows the
            range containing your current
            weighted average. The chart
            displays grouped data only.
          </p>

        </div>

      </div>

    </Card>
  );
}


function CohortRange({
  stats,
}) {
  const min =
    stats.min_average;

  const max =
    stats.max_average;

  const own =
    stats.your_average;


  if (
    min === null ||
    min === undefined ||
    max === null ||
    max === undefined
  ) {
    return (
      <Card className="p-5">

        <div
          className="
            flex items-center
            gap-2
          "
        >
          <Medal
            className="
              size-4
              text-amber-500
            "
          />

          <h2
            className="
              text-sm
              font-semibold
              text-zinc-950
              dark:text-white
            "
          >
            Cohort average range
          </h2>
        </div>

        <p
          className="
            mt-4
            text-xs
            leading-5
            text-zinc-500
          "
        >
          The lowest and highest peer
          averages will appear here when
          cohort data becomes available.
        </p>

      </Card>
    );
  }


  const range =
    Math.max(
      Number(max) -
        Number(min),
      1
    );


  const position =
    own !== null &&
    own !== undefined
      ? Math.min(
          100,
          Math.max(
            0,
            (
              (
                Number(own) -
                Number(min)
              ) /
              range
            ) *
              100
          )
        )
      : null;


  return (
    <Card className="p-5">

      <div
        className="
          flex items-center
          gap-2
        "
      >

        <Medal
          className="
            size-4
            text-amber-500
          "
        />

        <h2
          className="
            text-sm
            font-semibold
            text-zinc-950
            dark:text-white
          "
        >
          Cohort average range
        </h2>

      </div>

      <p
        className="
          mt-1
          text-xs
          text-zinc-500
        "
      >
        Lowest and highest peer averages
        currently recorded.
      </p>


      <div className="mt-6">

        <div
          className="
            relative h-2
            rounded-full
            bg-gradient-to-r
            from-zinc-300
            via-brand-400
            to-emerald-400
            dark:from-zinc-700
          "
        >

          {position !== null && (
            <motion.div
              initial={{
                left: "0%",
              }}
              animate={{
                left: `${position}%`,
              }}
              transition={{
                duration: 0.8,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              className="
                absolute top-1/2
                -translate-x-1/2
                -translate-y-1/2
              "
            >

              <div
                className="
                  size-4
                  rounded-full
                  border-[3px]
                  border-white
                  bg-brand-600
                  shadow-md
                  dark:border-zinc-900
                "
              />

              <div
                className="
                  absolute bottom-5
                  left-1/2
                  -translate-x-1/2
                  whitespace-nowrap
                  rounded-md
                  bg-zinc-900
                  px-2 py-1
                  text-[9px]
                  font-bold
                  text-white
                  dark:bg-white
                  dark:text-zinc-900
                "
              >
                You {formatPercent(own)}
              </div>

            </motion.div>
          )}

        </div>


        <div
          className="
            mt-3 flex
            items-center
            justify-between
          "
        >

          <div>

            <p
              className="
                text-[9px]
                uppercase
                tracking-wider
                text-zinc-400
              "
            >
              Lowest
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-zinc-900
                dark:text-white
              "
            >
              {formatPercent(min)}
            </p>

          </div>


          <div className="text-right">

            <p
              className="
                text-[9px]
                uppercase
                tracking-wider
                text-zinc-400
              "
            >
              Highest
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-zinc-900
                dark:text-white
              "
            >
              {formatPercent(max)}
            </p>

          </div>

        </div>

      </div>

    </Card>
  );
}


function PrivacyCard() {
  return (
    <Card
      className="
        border-emerald-500/10
        bg-emerald-500/[0.025]
        p-5
      "
    >

      <div
        className="
          flex items-start
          gap-3
        "
      >

        <div
          className="
            flex size-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-emerald-500/10
            text-emerald-600
            dark:text-emerald-400
          "
        >
          <ShieldCheck className="size-4" />
        </div>


        <div>

          <h3
            className="
              text-xs
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            Your peers remain anonymous
          </h3>

          <p
            className="
              mt-1.5
              text-[11px]
              leading-5
              text-zinc-500
            "
          >
            Peer Comparison uses aggregated
            academic statistics. Student
            names, student numbers and
            individual peer marks are not
            displayed.
          </p>

          <div
            className="
              mt-3 flex
              items-center
              gap-1.5
              text-[10px]
              font-semibold
              text-emerald-600
              dark:text-emerald-400
            "
          >

            <LockKeyhole className="size-3" />

            Privacy protected

          </div>

        </div>

      </div>

    </Card>
  );
}


function InsightCard({
  stats,
}) {
  const own =
    stats.your_average;

  const cohort =
    stats.cohort_average;


  let title =
    "Keep building your academic record";

  let description =
    "Complete more graded modules to make your peer comparison more representative.";

  let Icon = BookOpen;

  let accent =
    "bg-brand-500/10 text-brand-600 dark:text-brand-400";


  if (
    own !== null &&
    own !== undefined &&
    cohort !== null &&
    cohort !== undefined
  ) {
    const difference =
      stats.average_difference ??
      (
        Number(own) -
        Number(cohort)
      );

    if (difference > 0) {
      title =
        "Above the cohort average";

      description =
        `Your weighted average is ${difference.toFixed(
          1
        )} percentage points above the current cohort average.`;

      Icon =
        TrendingUp;

      accent =
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    else if (
      difference < 0
    ) {
      title =
        "Room to close the gap";

      description =
        `Your weighted average is ${Math.abs(
          difference
        ).toFixed(
          1
        )} percentage points below the current cohort average.`;

      Icon =
        Target;

      accent =
        "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }

    else {
      title =
        "Right on the cohort average";

      description =
        "Your weighted average currently matches the cohort average.";

      Icon =
        Award;

      accent =
        "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    }
  }


  return (
    <Card className="p-5">

      <div
        className="
          flex items-start
          gap-3
        "
      >

        <div
          className={`
            flex size-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${accent}
          `}
        >
          <Icon className="size-4" />
        </div>


        <div>

          <div
            className="
              flex items-center
              gap-2
            "
          >

            <h3
              className="
                text-xs
                font-semibold
                text-zinc-900
                dark:text-white
              "
            >
              {title}
            </h3>

            <Sparkles
              className="
                size-3
                text-amber-500
              "
            />

          </div>


          <p
            className="
              mt-1.5
              text-[11px]
              leading-5
              text-zinc-500
            "
          >
            {description}
          </p>

        </div>

      </div>

    </Card>
  );
}


function CohortDetails({
  stats,
}) {
  return (
    <Card className="p-5">

      <div
        className="
          flex items-center
          gap-2
        "
      >

        <BookOpen
          className="
            size-4
            text-brand-500
          "
        />

        <h2
          className="
            text-sm
            font-semibold
            text-zinc-950
            dark:text-white
          "
        >
          Your cohort
        </h2>

      </div>


      <div className="mt-5 space-y-4">

        <div
          className="
            flex items-center
            justify-between
            border-b
            border-zinc-100
            pb-3
            dark:border-zinc-800
          "
        >

          <span
            className="
              text-xs
              text-zinc-500
            "
          >
            Programme
          </span>

          <span
            className="
              max-w-[60%]
              text-right
              text-xs
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            {stats.programme_code}
          </span>

        </div>


        <div
          className="
            flex items-center
            justify-between
            border-b
            border-zinc-100
            pb-3
            dark:border-zinc-800
          "
        >

          <span
            className="
              text-xs
              text-zinc-500
            "
          >
            Programme name
          </span>

          <span
            className="
              max-w-[60%]
              text-right
              text-xs
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            {stats.programme_name}
          </span>

        </div>


        <div
          className="
            flex items-center
            justify-between
            border-b
            border-zinc-100
            pb-3
            dark:border-zinc-800
          "
        >

          <span
            className="
              text-xs
              text-zinc-500
            "
          >
            Academic year
          </span>

          <span
            className="
              text-xs
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            Year {stats.year}
          </span>

        </div>


        <div
          className="
            flex items-center
            justify-between
            border-b
            border-zinc-100
            pb-3
            dark:border-zinc-800
          "
        >

          <span
            className="
              text-xs
              text-zinc-500
            "
          >
            Students
          </span>

          <span
            className="
              text-xs
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            {stats.total_students || 1}
          </span>

        </div>


        <div
          className="
            flex items-center
            justify-between
          "
        >

          <span
            className="
              text-xs
              text-zinc-500
            "
          >
            With graded averages
          </span>

          <span
            className="
              text-xs
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            {stats.students_with_averages ?? "—"}
          </span>

        </div>

      </div>

    </Card>
  );
}


export default function PeerComparison() {
  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    loadComparison();
  }, []);


  async function loadComparison() {
    try {
      setLoading(true);

      setError("");

      const result =
        await api.getPeerComparison();

      setData(result);
    }

    catch (err) {
      setError(
        err?.message ||
          "Unable to load peer comparison."
      );
    }

    finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">

        <div className="space-y-3">

          <div
            className="
              h-6 w-32
              animate-pulse
              rounded
              bg-zinc-200
              dark:bg-zinc-800
            "
          />

          <div
            className="
              h-9 w-72
              animate-pulse
              rounded
              bg-zinc-200
              dark:bg-zinc-800
            "
          />

          <div
            className="
              h-4 w-96
              max-w-full
              animate-pulse
              rounded
              bg-zinc-200
              dark:bg-zinc-800
            "
          />

        </div>


        <div
          className="
            h-72
            animate-pulse
            rounded-2xl
            bg-zinc-100
            dark:bg-zinc-900
          "
        />


        <div
          className="
            grid gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="
                  h-28
                  animate-pulse
                  rounded-xl
                  bg-zinc-100
                  dark:bg-zinc-900
                "
              />
            )
          )}

        </div>


        <div
          className="
            grid gap-4
            lg:grid-cols-2
          "
        >

          <div
            className="
              h-96
              animate-pulse
              rounded-xl
              bg-zinc-100
              dark:bg-zinc-900
            "
          />

          <div
            className="
              h-96
              animate-pulse
              rounded-xl
              bg-zinc-100
              dark:bg-zinc-900
            "
          />

        </div>

      </div>
    );
  }


  if (error) {
    return (
      <Card className="p-8">

        <div
          className="
            mx-auto
            max-w-sm
            text-center
          "
        >

          <div
            className="
              mx-auto
              flex size-11
              items-center
              justify-center
              rounded-xl
              bg-red-500/10
              text-red-500
            "
          >
            <Users className="size-5" />
          </div>


          <h2
            className="
              mt-4
              font-semibold
              text-zinc-900
              dark:text-white
            "
          >
            Peer comparison unavailable
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-zinc-500
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={loadComparison}
            className="
              mt-5
              inline-flex h-9
              items-center
              gap-2
              rounded-lg
              bg-brand-600
              px-4
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-brand-700
            "
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>

        </div>

      </Card>
    );
  }


  const stats =
    data?.stats;


  if (!stats) {
    return (
      <Card className="p-8 text-center">

        <Users
          className="
            mx-auto
            size-6
            text-zinc-300
          "
        />

        <p
          className="
            mt-3
            text-sm
            font-semibold
            text-zinc-900
            dark:text-white
          "
        >
          No comparison data
        </p>

        <p
          className="
            mt-1
            text-xs
            text-zinc-500
          "
        >
          Peer statistics are not
          available yet.
        </p>

      </Card>
    );
  }


  const hasComparison =
    stats.cohort_average !== null &&
    stats.cohort_average !== undefined &&
    stats.your_rank !== null &&
    stats.your_rank !== undefined;


  const difference =
    stats.average_difference ??
    (
      hasComparison &&
      stats.your_average !== null &&
      stats.your_average !== undefined
        ? Number(
            stats.your_average
          ) -
          Number(
            stats.cohort_average
          )
        : null
    );


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

      <motion.div variants={fadeUp}>

        <Badge variant="primary">
          <Users className="size-3.5" />
          Peer Comparison
        </Badge>


        <div
          className="
            mt-3
            flex flex-col
            gap-4
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          <div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-zinc-950
                sm:text-3xl
                dark:text-white
              "
            >
              See how you compare
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-zinc-500
                dark:text-zinc-400
              "
            >
              Compare your academic
              performance with anonymous
              students in the same
              programme and year.
            </p>

          </div>


          <div
            className="
              flex items-center
              gap-2
              text-xs
              text-zinc-500
            "
          >

            <ShieldCheck
              className="
                size-4
                text-emerald-500
              "
            />

            <span>
              Anonymous comparison
            </span>

          </div>

        </div>

      </motion.div>


      {hasComparison ? (
        <motion.div variants={fadeUp}>
          <RankHero stats={stats} />
        </motion.div>
      ) : (
        <motion.div variants={fadeUp}>

          <Card
            className="
              relative
              overflow-hidden
              p-6
              lg:p-8
            "
          >

            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                size-56
                rounded-full
                bg-brand-500/[0.08]
                blur-3xl
              "
            />


            <div
              className="
                relative
                flex items-start
                gap-4
              "
            >

              <div
                className="
                  flex size-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-brand-500/10
                  text-brand-600
                  dark:text-brand-400
                "
              >
                <Users className="size-6" />
              </div>


              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-zinc-950
                    dark:text-white
                  "
                >
                  Your cohort is still
                  building data
                </h2>

                <p
                  className="
                    mt-2
                    max-w-xl
                    text-sm
                    leading-6
                    text-zinc-500
                  "
                >
                  {data?.message ||
                    "Peer comparison will become available as students complete graded modules."}
                </p>

              </div>

            </div>

          </Card>

        </motion.div>
      )}


      <motion.div
        variants={fadeUp}
        className="
          grid gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        <StatCard
          icon={GraduationCap}
          label="Your average"
          value={formatPercent(
            stats.your_average
          )}
          helper="Weighted academic average"
          accent="brand"
        />


        <StatCard
          icon={Users}
          label="Cohort average"
          value={formatPercent(
            stats.cohort_average
          )}
          helper={
            difference === null
              ? "Waiting for cohort data"
              : difference >= 0
                ? `${difference.toFixed(
                    1
                  )} pts below you`
                : `${Math.abs(
                    difference
                  ).toFixed(
                    1
                  )} pts above you`
          }
          accent="violet"
        />


        <StatCard
          icon={Medal}
          label="Cohort rank"
          value={
            hasComparison
              ? `#${stats.your_rank}`
              : "—"
          }
          helper={
            stats.students_with_averages
              ? `${stats.students_with_averages} graded students`
              : "Waiting for graded data"
          }
          accent="amber"
        />


        <StatCard
  icon={ChevronUp}
  label="Percentile"
  value={
    hasComparison &&
    stats.percentile !== null &&
    stats.percentile !== undefined
      ? `${Number(stats.percentile).toFixed(1)}%`
      : "—"
  }
  helper={
    hasComparison
      ? "Relative cohort position"
      : "Waiting for cohort data"
  }
  accent="emerald"
/>

      </motion.div>


      <motion.div
        variants={fadeUp}
        className="
          grid gap-6
          xl:grid-cols-[0.9fr_1.1fr]
        "
      >

        <AverageComparison
          stats={stats}
        />

        <DistributionChart
          stats={stats}
        />

      </motion.div>


      <motion.div
        variants={fadeUp}
        className="
          grid gap-4
          lg:grid-cols-2
        "
      >

        <CohortRange
          stats={stats}
        />

        <CohortDetails
          stats={stats}
        />

      </motion.div>


      <motion.div
        variants={fadeUp}
        className="
          grid gap-4
          lg:grid-cols-2
        "
      >

        <InsightCard
          stats={stats}
        />

        <PrivacyCard />

      </motion.div>

    </motion.div>
  );
}