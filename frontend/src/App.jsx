// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { api } from "./api";
import AdminApp from "./AdminApp";
import PeerComparison from "./components/PeerComparison";
import YearlyBreakdown from "./components/YearlyBreakdown";
import StudentLayout from "./components/layout/StudentLayout";
import SummaryPage from "./pages/student/SummaryPage";
import HistoryPage from "./pages/student/HistoryPage";
import PlanningPage from "./pages/student/PlanningPage";
import TimelinePage from "./pages/student/TimelinePage";
import AchievementsPage from "./pages/student/AchievementsPage";
import CommunityPage from "./pages/student/CommunityPage";
import AssistantWidget from "./components/assistant/AssistantWidget";
import UfhLogo from "./components/branding/UfhLogo";

// Import student components
import DegreeProgressBar from "./components/DegreeProgressBar";
import ModuleStatusBadge from "./components/ModuleStatusBadge";
import ModuleDetailModal from "./components/ModuleDetailModal";
import EnhancedGraduationAudit from "./components/EnhancedGraduationAudit";
import PredictorPage from "./pages/student/PredictorPage";
import PlannerPage from "./pages/student/PlannerPage";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import { motion } from "framer-motion";

// ---------- Shared UI ----------
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      {title && <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

function SuccessBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4 flex justify-between items-start gap-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-600 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    "in-progress": "bg-amber-100 text-amber-700",
    planned: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.planned}`}>
      {status}
    </span>
  );
}

// ---------- Role Picker ----------
function RolePicker({ onPick }) {
  const features = [
    {
      icon: BarChart3,
      title: "Track your progress",
      description: "See credits, modules and degree completion.",
    },
    {
      icon: BookOpenCheck,
      title: "Plan ahead",
      description: "Understand what you've completed and what's next.",
    },
    {
      icon: Target,
      title: "Stay on course",
      description: "Make informed decisions throughout your degree.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        {/* Left branding panel */}
        <section className="relative hidden overflow-hidden bg-[#0b1220] lg:flex lg:flex-col">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 -top-32 size-[420px] rounded-full bg-blue-600/20 blur-[100px]" />

            <div className="absolute -bottom-40 right-[-100px] size-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
          </div>

          <div className="relative z-10 flex h-full flex-col px-12 py-10 xl:px-16 xl:py-12">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-[250px] shrink-0 rounded-2xl bg-white px-5 py-4 shadow-lg shadow-blue-950/30">
                <UfhLogo className="w-full" />
              </div>

              <div>
                <p className="text-[15px] font-semibold tracking-tight text-white">
                  Graduation Credit Tracker
                </p>

                <p className="text-[11px] font-medium text-zinc-500">
                  Academic progress platform
                </p>
              </div>
            </div>

            {/* Main message */}
            <div className="my-auto max-w-xl py-12">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                  <Sparkles size={13} />
                  Your degree, clearly mapped
                </div>

                <h1 className="max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-0.035em] text-white xl:text-5xl">
                  Stay on track.
                  <br />
                  Graduate with
                  <span className="text-blue-400"> confidence.</span>
                </h1>

                <p className="mt-6 max-w-lg text-[15px] leading-7 text-zinc-400">
                  One place to understand academic progress,
                  plan future semesters and keep your degree
                  journey moving forward.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.15,
                }}
                className="mt-10 space-y-5"
              >
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="flex items-center gap-4"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-blue-400">
                        <Icon size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {feature.title}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Academic snapshot */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.25,
                }}
                className="mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Academic journey
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-200">
                      Progress with purpose
                    </p>
                  </div>

                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Track
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      your credits
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">
                      Plan
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      your modules
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">
                      Achieve
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      your goals
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                </div>
              </motion.div>
            </div>

            <p className="text-[11px] text-zinc-600">
              Graduation Credit Tracker · Academic Progress System
            </p>
          </div>
        </section>

        {/* Right side */}
        <section className="relative flex min-h-screen items-center justify-center bg-[#f8f9fb] px-5 py-10 sm:px-8 dark:bg-zinc-950">
          <div className="w-full max-w-[520px]">
            {/* Mobile brand */}
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <GraduationCap size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                  Graduation Credit Tracker
                </p>

                <p className="text-[11px] text-zinc-500">
                  Academic progress platform
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.08,
              }}
            >
              <div className="mb-9">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-blue-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <GraduationCap size={21} />
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-white">
                  Welcome
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Choose how you'd like to access the Graduation
                  Credit Tracker.
                </p>
              </div>

              <div className="space-y-3">
                {/* Student */}
                <button
                  type="button"
                  onClick={() => onPick("student")}
                  className="group relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-950/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
                      <GraduationCap size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-950 dark:text-white">
                          I'm a student
                        </h3>

                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          Student
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        View your academic progress and plan your degree.
                      </p>
                    </div>

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 dark:border-zinc-700 dark:group-hover:border-blue-800 dark:group-hover:bg-blue-500/10">
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </button>

                {/* Administrator */}
                <button
                  type="button"
                  onClick={() => onPick("admin")}
                  className="group relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-950/[0.05] focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-700">
                      <ShieldCheck size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-950 dark:text-white">
                          I'm an administrator
                        </h3>

                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Admin
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Manage students, marks and academic records.
                      </p>
                    </div>

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition group-hover:border-zinc-300 group-hover:bg-zinc-100 group-hover:text-zinc-700 dark:border-zinc-700 dark:group-hover:bg-zinc-800 dark:group-hover:text-white">
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </button>
              </div>

              {/* Access information */}
              <div className="mt-7 flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                  <Users size={14} />
                </div>

                <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  Students sign in using their student details and PIN.
                  Administrator access is restricted to authorised accounts.
                </p>
              </div>
            </motion.div>

            <p className="mt-10 text-center text-[11px] text-zinc-400 lg:text-left">
              Secure academic progress management
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
// ---------- Student Login ----------
function StudentLogin({ onLoggedIn, onBack }) {
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [loading, setLoading] = useState(false);
  const [requestingPin, setRequestingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const features = [
    {
      icon: BarChart3,
      title: "Track your progress",
      description: "See your credits and degree completion at a glance.",
    },
    {
      icon: BookOpenCheck,
      title: "Plan your semesters",
      description: "See what you can take next and build your study plan.",
    },
    {
      icon: Target,
      title: "Stay graduation-ready",
      description: "Understand requirements, prerequisites and what remains.",
    },
  ];

  async function handleRequestPin() {
    setError("");
    setInfo("");

    if (!studentNumber.trim() || !email.trim()) {
      setError(
        "Enter your student number and registered email before requesting a new PIN."
      );
      return;
    }

    setRequestingPin(true);

    try {
      await api.requestPin({
        student_number: studentNumber.trim(),
        email: email.trim(),
      });

      setInfo(
        "If those details match our records, a new PIN has been emailed to you."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestingPin(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setInfo("");

    if (pin.length !== 6) {
      setError("Enter your 6-digit PIN.");
      return;
    }

    setLoading(true);

    try {
      await api.studentLogin({
        student_number: studentNumber.trim(),
        email: email.trim(),
        pin,
      });

      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">

        {/* =====================================================
            LEFT BRANDING PANEL
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-[#0b1220] lg:flex lg:flex-col">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 -top-32 size-[430px] rounded-full bg-blue-600/20 blur-[110px]" />

            <div className="absolute -bottom-40 right-[-100px] size-[520px] rounded-full bg-indigo-500/10 blur-[130px]" />

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            <div className="absolute left-[18%] top-[42%] size-2 rounded-full bg-blue-400/40" />
            <div className="absolute right-[18%] top-[22%] size-1.5 rounded-full bg-indigo-400/30" />
            <div className="absolute bottom-[25%] right-[32%] size-1 rounded-full bg-blue-300/30" />
          </div>

          <div className="relative z-10 flex h-full flex-col px-12 py-10 xl:px-16 xl:py-12">

            {/* Brand */}
            <button
              type="button"
              onClick={onBack}
              className="group flex w-fit items-center gap-3 text-left"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/40">
                <GraduationCap size={23} strokeWidth={2.2} />
              </div>

              <div>
                <p className="text-[15px] font-semibold tracking-tight text-white">
                  Graduation Credit Tracker
                </p>

                <p className="text-[11px] font-medium text-zinc-500">
                  Academic progress platform
                </p>
              </div>
            </button>

            {/* Main content */}
            <div className="my-auto max-w-xl py-10">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                  <Sparkles size={13} />
                  Your academic journey, in one place
                </div>

                <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-white xl:text-5xl">
                  Your degree.
                  <br />
                  Your progress.
                  <br />
                  <span className="text-blue-400">
                    One clear path.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-[15px] leading-7 text-zinc-400">
                  Keep track of your credits, understand your
                  requirements and plan the path toward graduation
                  with confidence.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.14,
                }}
                className="mt-10 space-y-5"
              >
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="flex items-center gap-4"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-blue-400">
                        <Icon size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {feature.title}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Bottom feature card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.24,
                }}
                className="mt-10 max-w-lg rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Built for your degree journey
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-200">
                      From your first module to graduation.
                    </p>
                  </div>

                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Track
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      your credits
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">
                      Plan
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      your semesters
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">
                      Achieve
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      your goals
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                </div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-600">
                Graduation Credit Tracker · Student Portal
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <ShieldCheck size={13} />
                Secure access
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT LOGIN PANEL
        ====================================================== */}
        <section className="relative flex min-h-screen items-center justify-center bg-[#f8f9fb] px-5 py-8 sm:px-8 dark:bg-zinc-950">

          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-white hover:text-zinc-900 sm:left-8 sm:top-7 dark:hover:bg-zinc-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="w-full max-w-[460px]">

            {/* Mobile brand */}
            <div className="mb-10 flex flex-col items-start gap-3 lg:hidden">
              <div className="flex w-full justify-center">
                <UfhLogo className="w-[245px] max-w-full" />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                  Graduation Credit Tracker
                </p>

                <p className="text-[11px] text-zinc-500">
                  Student Portal
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.06,
              }}
            >
              {/* Header */}
              <div className="mb-8">
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-blue-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <GraduationCap size={21} />
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                  Student portal
                </p>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-white">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Sign in to continue to your academic dashboard.
                </p>
              </div>

              {/* Login card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/70">

                <ErrorBanner
                  message={error}
                  onDismiss={() => setError("")}
                />

                <SuccessBanner
                  message={info}
                  onDismiss={() => setInfo("")}
                />

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Student number */}
                  <div>
                    <label
                      htmlFor="student-number"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Student number
                    </label>

                    <div className="relative">
                      <UserRound
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />

                      <input
                        id="student-number"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your student number"
                        value={studentNumber}
                        onChange={(e) =>
                          setStudentNumber(e.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="student-email"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />

                      <input
                        id="student-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-600"
                        required
                      />
                    </div>
                  </div>

                  {/* PIN */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        htmlFor="student-pin"
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        PIN
                      </label>

                      <button
                        type="button"
                        onClick={handleRequestPin}
                        disabled={requestingPin}
                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {requestingPin
                          ? "Sending new PIN..."
                          : "Forgot PIN?"}
                      </button>
                    </div>

                    <div className="relative">
                      <LockKeyhole
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />

                      <input
                        id="student-pin"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter your 6-digit PIN"
                        maxLength={6}
                        value={pin}
                        onChange={(e) =>
                          setPin(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-12 text-sm tracking-[0.25em] text-zinc-950 outline-none transition placeholder:tracking-normal placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-600"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPin((current) => !current)
                        }
                        aria-label={
                          showPin
                            ? "Hide PIN"
                            : "Show PIN"
                        }
                        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        {showPin ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-400">
                      Enter your 6-digit PIN. If you've
                      forgotten it, request a new one using
                      your student number and registered email.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      requestingPin ||
                      pin.length !== 6
                    }
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Log in
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Security notice */}
                <div className="mt-5 flex items-start gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={15} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Secure student access
                    </p>

                    <p className="mt-0.5 text-[11px] leading-5 text-zinc-400">
                      Your PIN is used to securely access your
                      academic progress information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <p className="mt-6 text-center text-[11px] leading-5 text-zinc-400">
                Graduation Credit Tracker · Academic Progress System
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
// ---------- Student Dashboard Components ----------

function SummaryPanel({ summary }) {
  if (!summary) return null;
  const categories = Object.entries(summary.category_breakdown || {});
  
  // State for toggling each year's visibility
  const [openYears, setOpenYears] = useState({});

  const toggleYear = (year) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  return (
    <div className="space-y-6">
      <DegreeProgressBar />

      <div className="grid gap-6 md:grid-cols-2">
        <Card title={summary.programme.name}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Current year</span>
              <span className="font-medium text-slate-800">{summary.current_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Credits completed</span>
              <span className="font-medium text-slate-800">
                {summary.credits_completed} / {summary.credits_required}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(summary.percentage_complete, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{summary.percentage_complete}% complete</span>
              <span>{summary.credits_remaining} credits remaining</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Weighted average</span>
              <span className="font-medium text-slate-800">
                {summary.weighted_average !== null ? summary.weighted_average : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Modules completed</span>
              <span className="font-medium text-slate-800">{summary.modules_completed}</span>
            </div>
          </div>
        </Card>

        <Card title="Credits by category">
          <div className="space-y-3">
            {categories.length === 0 && <p className="text-sm text-slate-400">No completed modules yet.</p>}
            {categories.map(([cat, data]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="capitalize text-slate-600">{cat}</span>
                <span className="text-slate-800 font-medium">
                  {data.credits_completed} credits · {data.modules_completed} modules
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Failed modules" className="md:col-span-2">
          {summary.failed_modules.length === 0 ? (
            <p className="text-sm text-emerald-600">No outstanding failed modules. 🎉</p>
          ) : (
            <div className="space-y-2">
              {summary.failed_modules.map((f) => (
                <div
                  key={f.module.code}
                  className={`text-sm rounded-lg px-3 py-2 flex justify-between items-center ${
                    f.is_prerequisite_for_major 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-slate-50"
                  }`}
                >
                  <div>
                    <span className="font-medium text-slate-800">{f.module.code}</span>{" "}
                    <span className="text-slate-500">{f.module.name}</span>
                    <div className="text-xs text-slate-400">
                      {f.semester} · grade {f.grade} · attempt {f.attempt}
                    </div>
                  </div>
                  {f.is_prerequisite_for_major && (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      Blocks your major
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Missing Compulsory Modules with Dropdown */}
        <Card title="Missing compulsory modules" className="md:col-span-2">
          {summary.missing_compulsory_modules.length === 0 ? (
            <p className="text-sm text-emerald-600">All compulsory modules completed. 🎉</p>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((year) => {
                const modules = summary.missing_compulsory_modules.filter(
                  (m) => m.level === year
                );
                if (modules.length === 0) return null;
                const isOpen = openYears[year] || false;

                return (
                  <div key={year} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">Year {year}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {modules.length} module{modules.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xl">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white border-t border-slate-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {modules.map((m) => (
                            <div
                              key={m.code}
                              className="text-sm bg-slate-50 rounded-lg px-3 py-2 flex justify-between items-center hover:bg-slate-100 transition"
                            >
                              <span>
                                <span className="font-medium text-slate-800">{m.code}</span>
                                <span className="text-xs text-slate-400 ml-1">{m.credits}cr</span>
                              </span>
                              <span className="text-xs text-slate-400">Y{m.level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function HistoryPanel({ history, onModuleClick }) {
  return (
    <Card title="Module history">
      {history.length === 0 ? (
        <p className="text-sm text-slate-400">No modules recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2 font-medium">Module</th>
                <th className="py-2 font-medium">Credits</th>
                <th className="py-2 font-medium">Semester</th>
                <th className="py-2 font-medium">Grade</th>
                <th className="py-2 font-medium">Attempt</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onModuleClick?.(e.module.code)}
                  className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition"
                >
                  <td className="py-2">
                    <div className="font-medium text-slate-800">{e.module.code}</div>
                    <div className="text-slate-400 text-xs">{e.module.name}</div>
                  </td>
                  <td className="py-2 text-slate-600">{e.module.credits}</td>
                  <td className="py-2 text-slate-600">{e.semester}</td>
                  <td className="py-2 text-slate-600">{e.grade ?? "—"}</td>
                  <td className="py-2 text-slate-600">{e.attempt}</td>
                  <td className="py-2">
                    <ModuleStatusBadge status={e.status} grade={e.grade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function EligibleModulesPanel({ modules }) {
  return (
    <Card title="What you can take next">
      {modules.length === 0 ? (
        <p className="text-sm text-slate-400">No eligible modules right now.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {modules.map((m) => (
            <li key={m.code} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex justify-between">
                <span className="font-medium text-slate-800">{m.code}</span>
                <span className="text-slate-400">{m.credits}cr</span>
              </div>
              <div className="text-slate-500">{m.name}</div>
              <div className="text-xs text-emerald-600 mt-1">{m.reason}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------- Student Dashboard ----------
const STUDENT_TABS = [
  { id: "summary", label: "Summary" },
  { id: "history", label: "History" },
  { id: "planning", label: "Planning" },
  { id: "timeline", label: "Timeline" },
  { id: "predictor", label: "Predictor" },
  { id: "planner", label: "Planner" },
  { id: "achievements", label: "Achievements" },
  { id: "peers", label: "Peers" },
  { id: "yearly", label: "Yearly" },
];

function StudentDashboard({ onLogout, onPageChange }) {
  const [tab, setTab] = useState("summary");
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedModule, setSelectedModule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModuleClick = (code) => {
    setSelectedModule(code);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedModule(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const [meData, summaryData, historyData, eligibleData, auditData] = await Promise.all([
          api.me(),
          api.getSummary(),
          api.getHistory(),
          api.getEligibleModules(),
          api.getGraduationAudit(),
        ]);
        setMe(meData);
        setSummary(summaryData);
        setHistory(historyData);
        setEligible(eligibleData);
        setAudit(auditData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const adminStudentView = (() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return false;
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload?.is_impersonation === true || payload?.impersonated_by != null;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    onPageChange?.(tab);
  }, [tab, onPageChange]);

  useEffect(() => {
    if (adminStudentView && tab === "community") {
      setTab("summary");
    }
  }, [adminStudentView, tab]);

  return (
    <StudentLayout
      activeTab={tab}
      onTabChange={setTab}
      student={me}
      onLogout={onLogout}
    >
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading your academic progress...
            </p>
          </div>
        </div>
      )}

      {!loading && tab === "summary" && (
  <SummaryPage
    summary={summary}
    student={me}
    onNavigate={setTab}
  />
)}
      {!loading && tab === "yearly" && (
        <YearlyBreakdown onModuleClick={handleModuleClick} />
      )}
      {!loading && tab === "peers" && <PeerComparison />}
      {!loading && !adminStudentView && tab === "community" && <CommunityPage student={me} />}
      {!loading && tab === "history" && (
  <HistoryPage

    history={history}
    onModuleClick={handleModuleClick}
  />
)}
      {!loading && tab === "planning" && (
  <PlanningPage
    audit={audit}
    eligible={eligible}
    onModuleClick={handleModuleClick}
    onNavigate={setTab}
  />
)}
      {!loading && tab === "timeline" && (
  <TimelinePage
    onModuleClick={handleModuleClick}
  />
)}
      {!loading && tab === "predictor" && (
  <PredictorPage
    eligible={eligible}
    summary={summary}
  />
)}
      {!loading && tab === "planner" && (
  <PlannerPage
    onModuleClick={handleModuleClick}
  />
)}
      {!loading && tab === "achievements" && (
  <AchievementsPage />
)}

      <ModuleDetailModal
        moduleCode={selectedModule}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </StudentLayout>
  );
}

// ---------- Root ----------
export default function App() {
  const [role, setRole] = useState(api.getRole());
  const [pickedRole, setPickedRole] = useState(null);
  const [assistantPage, setAssistantPage] = useState(null);

  function handleLoggedIn() {
    setRole(api.getRole());
  }

  function handleLogout() {
    api.logout();
    setRole(null);
    setPickedRole(null);
  }

  let content;

  if (role === "admin") {
    content = <AdminApp onLogout={handleLogout} />;
  } else if (role === "student") {
    content = (
      <StudentDashboard
        onLogout={handleLogout}
        onPageChange={setAssistantPage}
      />
    );
  } else if (pickedRole === "student") {
    content = (
      <StudentLogin
        onLoggedIn={handleLoggedIn}
        onBack={() => setPickedRole(null)}
      />
    );
  } else if (pickedRole === "admin") {
    content = (
      <AdminApp
        onLogout={handleLogout}
        loginOnly
        onLoggedIn={handleLoggedIn}
        onBack={() => setPickedRole(null)}
      />
    );
  } else {
    content = <RolePicker onPick={setPickedRole} />;
  }

  return (
    <>
      {content}

      <AssistantWidget
        currentPage={assistantPage}
        userRole={
          role === "admin"
            ? "admin"
            : role === "student"
              ? "student"
              : "guest"
        }
      />
    </>
  );
}