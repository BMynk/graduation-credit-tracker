// frontend/src/AdminApp.jsx
import { useEffect, useState } from "react";
import { api } from "./api";
import ProgrammeBreakdownView from "./components/ProgrammeBreakdown";
import AdminStudentListEnhanced from "./components/Admin/AdminStudentListEnhanced";
import AdminViewAsStudent from "./components/Admin/AdminViewAsStudent";
import AdminBulkEmail from "./components/Admin/AdminBulkEmail";
import AdminAccountManagement from "./components/Admin/AdminAccountManagement";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AtRiskPage from "./pages/admin/AtRiskPage";
import AdminBulkUpload from "./components/Admin/AdminBulkUpload";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  GraduationCap,
  Hash,
  Info,
  Target,
  Layers3,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UploadCloud,
  UserPlus,
  UserRound,
  Users,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  Sun,
} from "lucide-react";

// ---------- Shared UI Components ----------
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

// ---------- Admin Login ----------
function AdminLogin({ onLoggedIn, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.adminLogin({
        username: username.trim(),
        password,
      });

      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const adminFeatures = [
    {
      icon: Users,
      title: "Student management",
      description:
        "Manage student profiles, programmes and academic records.",
    },
    {
      icon: BarChart3,
      title: "Academic oversight",
      description:
        "Monitor degree progress and identify students who need attention.",
    },
    {
      icon: BookOpenCheck,
      title: "Curriculum management",
      description:
        "Maintain modules, prerequisites and programme requirements.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">

        {/* =====================================================
            LEFT ADMIN BRANDING
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-[#0b1220] lg:flex lg:flex-col">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 -top-32 size-[430px] rounded-full bg-blue-600/20 blur-[110px]" />

            <div className="absolute -bottom-40 right-[-100px] size-[520px] rounded-full bg-violet-500/10 blur-[130px]" />

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            <div className="absolute left-[18%] top-[42%] size-2 rounded-full bg-blue-400/40" />
            <div className="absolute right-[18%] top-[22%] size-1.5 rounded-full bg-violet-400/30" />
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
                  Administration platform
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
                  <ShieldCheck size={13} />
                  Administrator access
                </div>

                <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-white xl:text-5xl">
                  Manage academics.
                  <br />
                  Support students.
                  <br />
                  <span className="text-blue-400">
                    Stay in control.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-[15px] leading-7 text-zinc-400">
                  Access the administration workspace to manage
                  student records, curriculum information and
                  academic progress from one place.
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
                {adminFeatures.map((feature) => {
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

              {/* Admin workspace card */}
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
                      Administration workspace
                    </p>

                    <p className="mt-1 text-sm font-medium text-zinc-200">
                      Everything you need to manage academic data.
                    </p>
                  </div>

                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Manage
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      student records
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">
                      Monitor
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      academic progress
                    </p>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-white">
                      Maintain
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      curriculum data
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-600">
                Graduation Credit Tracker · Admin Portal
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <ShieldCheck size={13} />
                Restricted access
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RIGHT LOGIN PANEL
        ====================================================== */}
        <section className="relative flex min-h-screen items-center justify-center bg-[#f8f9fb] px-5 py-8 sm:px-8 dark:bg-zinc-950">

          {/* Back */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-white hover:text-zinc-900 sm:left-8 sm:top-7 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}

          <div className="w-full max-w-[460px]">

            {/* Mobile branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <GraduationCap size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                  Graduation Credit Tracker
                </p>

                <p className="text-[11px] text-zinc-500">
                  Administrator Portal
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
              {/* Heading */}
              <div className="mb-8">
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-blue-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <ShieldCheck size={21} />
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                  Administrator portal
                </p>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-white">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Sign in to access the administration workspace.
                </p>
              </div>

              {/* Login card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/70">

                <ErrorBanner
                  message={error}
                  onDismiss={() => setError("")}
                />

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Username */}
                  <div>
                    <label
                      htmlFor="admin-username"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Username
                    </label>

                    <div className="relative">
                      <UserRound
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />

                      <input
                        id="admin-username"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value)
                        }
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-600 dark:disabled:bg-zinc-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />

                      <input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-12 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-zinc-600 dark:disabled:bg-zinc-900"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Login */}
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !username.trim() ||
                      !password
                    }
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#18243a] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111b2d] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
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

                {/* Security */}
                <div className="mt-5 flex items-start gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <ShieldCheck size={15} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Restricted administrator access
                    </p>

                    <p className="mt-0.5 text-[11px] leading-5 text-zinc-400">
                      This area contains administrative and
                      academic management tools. Access is
                      limited to authorised administrators.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] leading-5 text-zinc-400">
                Graduation Credit Tracker · Administration System
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------- Create Student ----------
function CreateStudentForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    student_number: "",
    email: "",
    programme_code: "",
    current_year: 1,
  });

  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listProgrammes()
      .then(setProgrammes)
      .catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.adminCreateStudent({
        ...form,
        name: form.name.trim(),
        student_number: form.student_number.trim(),
        email: form.email.trim(),
        current_year: Number(form.current_year),
      });

      setForm({
        name: "",
        student_number: "",
        email: "",
        programme_code: "",
        current_year: 1,
      });

      setSuccess(
        "Student created successfully. Their login PIN has been emailed to them."
      );
      window.setTimeout(() => onCreated(), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedProgramme = programmes.find(
    (programme) =>
      programme.code === form.programme_code
  );

  const completedFields = [
    form.name.trim(),
    form.student_number.trim(),
    form.email.trim(),
    form.programme_code,
    form.current_year,
  ].filter(Boolean).length;

  const completion =
    (completedFields / 5) * 100;

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 dark:border-blue-950 dark:from-blue-950/20 dark:via-zinc-950 dark:to-violet-950/20 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            <UserPlus size={14} />
            Student Management
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Add a new student
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Create a student account and assign their
            programme and current academic year.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Form */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-100 px-5 py-5 dark:border-zinc-900 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-zinc-950 dark:text-white">
                  Student information
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Enter the student's account and
                  academic details.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6"
          >
            {success && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <Info
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full name */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <input
                    value={form.name}
                    onChange={(event) =>
                      update(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Mishael Kwaku Yeboah"
                    autoComplete="name"
                    required
                    className={`${fieldClass} pl-10`}
                  />
                </div>

                <p className="mt-1.5 text-xs text-zinc-400">
                  Enter the student's full registered name.
                </p>
              </div>

              {/* Student number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Student number
                </label>

                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <input
                    value={form.student_number}
                    onChange={(event) =>
                      update(
                        "student_number",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 203422940"
                    required
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      update(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="student@example.com"
                    autoComplete="email"
                    required
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>

              {/* Programme */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Programme
                </label>

                <div className="relative">
                  <BookOpen
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <select
                    value={form.programme_code}
                    onChange={(event) =>
                      update(
                        "programme_code",
                        event.target.value
                      )
                    }
                    required
                    className={`${fieldClass} pl-10`}
                  >
                    <option value="">
                      Select programme
                    </option>

                    {programmes.map((programme) => (
                      <option
                        key={programme.code}
                        value={programme.code}
                      >
                        {programme.code} —{" "}
                        {programme.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Current academic year
                </label>

                <div className="relative">
                  <GraduationCap
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <select
                    value={form.current_year}
                    onChange={(event) =>
                      update(
                        "current_year",
                        event.target.value
                      )
                    }
                    className={`${fieldClass} pl-10`}
                  >
                    {[1, 2, 3, 4].map((year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-7 flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-400">
                All fields are required.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating student...
                  </>
                ) : (
                  <>
                    Create student
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Right panel */}
        <aside className="space-y-4">
          {/* Completion */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Form progress
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Complete the student profile
                </p>
              </div>

              <span className="text-sm font-semibold text-blue-600">
                {Math.round(completion)}%
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${completion}%`,
                }}
                className="h-full rounded-full bg-blue-600"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
              <CheckCircle2
                size={14}
                className={
                  completion === 100
                    ? "text-emerald-500"
                    : "text-zinc-300"
                }
              />

              {completedFields} of 5 fields completed
            </div>
          </section>

          {/* Preview */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Student preview
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Account being created
            </p>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {form.name.trim()
                  ? form.name
                      .trim()
                      .charAt(0)
                      .toUpperCase()
                  : "?"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {form.name.trim() ||
                    "Student name"}
                </p>

                <p className="truncate text-xs text-zinc-400">
                  {form.student_number.trim() ||
                    "Student number"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-zinc-400">
                  Programme
                </span>

                <span className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedProgramme
                    ? selectedProgramme.code
                    : "Not selected"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400">
                  Academic year
                </span>

                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Year {form.current_year}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-zinc-400">
                  Email
                </span>

                <span className="max-w-[150px] truncate text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {form.email.trim() ||
                    "Not entered"}
                </span>
              </div>
            </div>
          </section>

          {/* Info */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-950 dark:bg-blue-950/20">
            <div className="flex gap-3">
              <Info
                size={17}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  After creation
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700/80 dark:text-blue-300/70">
                  The new student will be added to the
                  student directory. Their permanent login PIN
                  will be emailed directly to their registered
                  email address.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </motion.div>
  );
}

// ---------- Bulk Upload ----------
function BulkUploadPanel() {
  const [studentsFile, setStudentsFile] = useState(null);
  const [marksFile, setMarksFile] = useState(null);
  const [studentsReport, setStudentsReport] = useState(null);
  const [marksReport, setMarksReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadStudents() {
    if (!studentsFile) return;
    setError("");
    setLoading(true);
    try {
      setStudentsReport(await api.adminUploadStudentsCsv(studentsFile));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadMarks() {
    if (!marksFile) return;
    setError("");
    setLoading(true);
    try {
      setMarksReport(await api.adminUploadMarksCsv(marksFile));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function ReportTable({ report }) {
    if (!report) return null;
    return (
      <div className="mt-3 text-sm">
        <p className="text-slate-600 mb-2">
          {report.succeeded} succeeded, {report.failed} failed out of {report.total_rows} rows.
        </p>
        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
          {report.results.map((r, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 border-b border-slate-50 last:border-0 flex justify-between ${r.status === "error" ? "bg-red-50" : ""}`}
            >
              <span>Row {r.row}: {r.identifier}</span>
              <span className={r.status === "error" ? "text-red-600" : "text-emerald-600"}>
                {r.status}
                {r.detail ? ` - ${r.detail}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Bulk upload students">
        <p className="text-xs text-slate-500 mb-3">
          CSV columns:{" "}
          <code className="bg-slate-100 px-1 rounded">
            name, student_number, email, programme_code, current_year
          </code>
          . Existing student numbers are updated.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setStudentsFile(e.target.files[0])}
          className="text-sm mb-3"
        />
        <button
          onClick={uploadStudents}
          disabled={!studentsFile || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Upload
        </button>
        <ReportTable report={studentsReport} />
      </Card>

      <Card title="Bulk upload marks">
        <p className="text-xs text-slate-500 mb-3">
          CSV columns:{" "}
          <code className="bg-slate-100 px-1 rounded">student_number, module_code, semester, grade</code>.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setMarksFile(e.target.files[0])}
          className="text-sm mb-3"
        />
        <button
          onClick={uploadMarks}
          disabled={!marksFile || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Upload
        </button>
        <ReportTable report={marksReport} />
      </Card>

      <div className="md:col-span-2">
        <ErrorBanner message={error} onDismiss={() => setError("")} />
      </div>
    </div>
  );
}

// ---------- Student Detail ----------
function StudentDetail({ studentId, onBack, onChanged }) {
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [markForm, setMarkForm] = useState({
    module_code: "",
    semester: "",
    grade: "",
  });

  const [savingMark, setSavingMark] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [programmeModules, setProgrammeModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [resettingPin, setResettingPin] = useState(false);

  async function load() {
    try {
      setError("");

      const [s, sum] = await Promise.all([
        api.adminGetStudent(studentId),
        api.adminGetStudentSummary(studentId),
      ]);

      setStudent(s);
      setSummary(sum);

      setEditForm({
        name: s.name,
        email: s.email,
        programme_code: s.programme.code,
        current_year: s.current_year,
        target_average: s.target_average,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [studentId]);

  useEffect(() => {
    api
      .listProgrammes()
      .then(setProgrammes)
      .catch(() => {});
  }, []);

useEffect(() => {
  if (!student?.programme?.code) return;

  setLoadingModules(true);

  api
    .adminGetProgrammeModules(student.programme.code)
    .then((modules) => {
      setProgrammeModules(modules || []);
    })
    .catch((err) => {
      setError(err.message);
      setProgrammeModules([]);
    })
    .finally(() => {
      setLoadingModules(false);
    });
}, [student?.programme?.code]);

  async function handleDeactivate() {
    if (
      !confirm(
        `Deactivate ${student.name}? They will no longer be able to log in.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.adminDeactivateStudent(studentId);

      setSuccess("Student account deactivated successfully.");

      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRecordMark(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSavingMark(true);

    try {
      const result = await api.adminRecordMark(studentId, {
        module_code: markForm.module_code
          .trim()
          .toUpperCase(),
        semester: markForm.semester.trim(),
        grade: Number(markForm.grade),
      });

      setSuccess(
        `${result.module.code} recorded as ${result.status} with a grade of ${result.grade}%.`
      );

      setMarkForm({
        module_code: "",
        semester: "",
        grade: "",
      });

      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMark(false);
    }
  }

  async function handleRegeneratePin() {
    if (
      !confirm(
        `Generate a new PIN for ${student.name}? Their old PIN will stop working.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setResettingPin(true);

      await api.adminRegeneratePin(studentId);

      setSuccess(
        "New PIN generated successfully and emailed to the student."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setResettingPin(false);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSavingEdit(true);

    try {
      await api.adminUpdateStudent(studentId, {
        ...editForm,
        current_year: Number(editForm.current_year),
        target_average: Number(
          editForm.target_average
        ),
      });

      setSuccess("Student details updated successfully.");
      setEditing(false);

      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  function cancelEditing() {
    if (!student) return;

    setEditForm({
      name: student.name,
      email: student.email,
      programme_code: student.programme.code,
      current_year: student.current_year,
      target_average: student.target_average,
    });

    setEditing(false);
  }

  if (!student) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600 dark:border-zinc-800 dark:border-t-blue-500" />
              <p className="mt-3 text-sm text-zinc-500">
                Loading student profile...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const initials = student.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const creditsCompleted =
    summary?.credits_completed ?? 0;

  const creditsRequired =
    summary?.credits_required ?? 0;

  const progress =
    creditsRequired > 0
      ? Math.min(
          100,
          Math.round(
            (creditsCompleted / creditsRequired) * 100
          )
        )
      : 0;

  const weightedAverage =
    summary?.weighted_average ?? null;

  const failedPending =
    summary?.modules_failed_pending_retake ?? 0;

  const failedModules =
    summary?.failed_modules || [];

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-10"
    >
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
      >
        <span aria-hidden="true">←</span>
        Back to student list
      </button>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <Info
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 transition hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span className="flex-1">{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-emerald-500 transition hover:text-emerald-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* PROFILE / EDIT CARD */}
      {/* ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {!editing ? (
          <>
            {/* Profile hero */}
            <div className="relative overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 dark:border-zinc-900 dark:from-blue-950/20 dark:via-zinc-950 dark:to-violet-950/20 sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {/* Avatar */}
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-semibold text-white shadow-lg shadow-blue-600/20 sm:size-20 sm:text-2xl">
                    {initials || "ST"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                        {student.name}
                      </h2>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          student.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            student.is_active
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />

                        {student.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {student.student_number}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={14} />
                        {student.email}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={14} />
                        {student.programme.name}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap size={14} />
                        Year {student.current_year}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <AdminViewAsStudent
                    studentId={student.id}
                    studentName={student.name}
                  />

                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Edit details
                  </button>
                </div>
              </div>
            </div>

            {/* Profile information */}
            <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
              <div className="border-b border-zinc-100 p-5 dark:border-zinc-900 md:border-r xl:border-b-0">
                <p className="text-xs font-medium text-zinc-400">
                  Programme
                </p>

                <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
                  {student.programme.name}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  {student.programme.code}
                </p>
              </div>

              <div className="border-b border-zinc-100 p-5 dark:border-zinc-900 xl:border-b-0 xl:border-r">
                <p className="text-xs font-medium text-zinc-400">
                  Academic year
                </p>

                <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
                  Year {student.current_year}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Current study level
                </p>
              </div>

              <div className="border-b border-zinc-100 p-5 dark:border-zinc-900 md:border-r xl:border-b-0">
                <p className="text-xs font-medium text-zinc-400">
                  Target average
                </p>

                <p className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-white">
                  {student.target_average}%
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Student goal
                </p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-zinc-400">
                  Account
                </p>

                <p
                  className={`mt-1.5 text-sm font-semibold ${
                    student.is_active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {student.is_active
                    ? "Active"
                    : "Inactive"}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Login access
                </p>
              </div>
            </div>

            {/* Account actions */}
            <div className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 dark:border-zinc-900 dark:bg-zinc-900/30 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Account security
                </p>

                <p className="mt-0.5 text-xs text-zinc-400">
                  Reset the student's PIN or manage
                  account access.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRegeneratePin}
                  disabled={resettingPin}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-blue-900 dark:hover:text-blue-400"
                >
                  <ShieldCheck size={15} />

                  {resettingPin
                    ? "Resetting..."
                    : "Reset login PIN"}
                </button>

                {student.is_active && (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <AlertTriangle size={15} />
                    Deactivate account
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ================================================== */
          /* EDIT MODE */
          /* ================================================== */

          <form onSubmit={handleSaveEdit}>
            <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-50/80 to-white px-5 py-5 dark:border-zinc-900 dark:from-blue-950/20 dark:to-zinc-950 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <UserRound size={19} />
                </div>

                <div>
                  <h2 className="font-semibold text-zinc-950 dark:text-white">
                    Edit student details
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Update account and academic information
                    for {student.name}.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          name: e.target.value,
                        }))
                      }
                      required
                      className={`${fieldClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          email: e.target.value,
                        }))
                      }
                      required
                      className={`${fieldClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Programme */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Programme
                  </label>

                  <div className="relative">
                    <BookOpen
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <select
                      value={editForm.programme_code}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          programme_code:
                            e.target.value,
                        }))
                      }
                      required
                      className={`${fieldClass} pl-10`}
                    >
                      {programmes.map((programme) => (
                        <option
                          key={programme.code}
                          value={programme.code}
                        >
                          {programme.code} —{" "}
                          {programme.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Current academic year
                  </label>

                  <div className="relative">
                    <GraduationCap
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <select
                      value={editForm.current_year}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          current_year:
                            e.target.value,
                        }))
                      }
                      className={`${fieldClass} pl-10`}
                    >
                      {[1, 2, 3, 4].map((year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          Year {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Target average
                  </label>

                  <div className="relative">
                    <Target
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.target_average}
                      onChange={(e) =>
                        setEditForm((form) => ({
                          ...form,
                          target_average:
                            e.target.value,
                        }))
                      }
                      className={`${fieldClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Student number read-only */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Student number
                  </label>

                  <div className="relative">
                    <Hash
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      value={student.student_number}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-3.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 dark:border-zinc-900 dark:bg-zinc-900/30 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={savingEdit}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEdit ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ================================================== */}
      {/* ACADEMIC OVERVIEW */}
      {/* ================================================== */}

      {summary && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                Academic overview
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                Current graduation and academic performance.
              </p>
            </div>

            <span className="text-xs font-medium text-zinc-400">
              {progress}% complete
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Credits */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <GraduationCap size={17} />
                </div>

                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {progress}%
                </span>
              </div>

              <p className="mt-4 text-xs font-medium text-zinc-500">
                Credits completed
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {creditsCompleted}
                <span className="text-base font-medium text-zinc-400">
                  /{creditsRequired}
                </span>
              </p>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progress}%`,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-blue-600"
                />
              </div>
            </div>

            {/* Average */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <BarChart3 size={17} />
              </div>

              <p className="mt-4 text-xs font-medium text-zinc-500">
                Weighted average
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {weightedAverage !== null
                  ? `${weightedAverage}%`
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                Target: {student.target_average}%
              </p>
            </div>

            {/* Failed */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div
                className={`flex size-9 items-center justify-center rounded-xl ${
                  failedPending > 0
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}
              >
                {failedPending > 0 ? (
                  <AlertTriangle size={17} />
                ) : (
                  <CheckCircle2 size={17} />
                )}
              </div>

              <p className="mt-4 text-xs font-medium text-zinc-500">
                Pending retakes
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {failedPending}
              </p>

              <p className="mt-2 text-xs text-zinc-400">
                {failedPending === 0
                  ? "No failed modules pending"
                  : "Requires academic attention"}
              </p>
            </div>

            {/* Year */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <BookOpenCheck size={17} />
              </div>

              <p className="mt-4 text-xs font-medium text-zinc-500">
                Current year
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                Year {student.current_year}
              </p>

              <p className="mt-2 truncate text-xs text-zinc-400">
                {student.programme.code}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* RECORD MARK */}
      {/* ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 px-5 py-5 dark:border-zinc-900 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <BookOpenCheck size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-zinc-950 dark:text-white">
                Record an official mark
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                Add or update an official module result for
                this student.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleRecordMark}
          className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_1fr_0.7fr_auto] lg:items-end"
        >
          <div>
  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
    Module
  </label>

  <select
    value={markForm.module_code}
    onChange={(e) =>
      setMarkForm((form) => ({
        ...form,
        module_code: e.target.value,
      }))
    }
    required
    disabled={loadingModules}
    className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
  >
    <option value="">
      {loadingModules ? "Loading modules..." : "Select module"}
    </option>

    {programmeModules.map((item) => (
      <option
        key={item.module_code}
        value={item.module_code}
      >
        {item.module_code} — {item.module_name}
        {item.is_compulsory ? " • Compulsory" : " • Elective"}
      </option>
    ))}
  </select>

  {!loadingModules && programmeModules.length === 0 && (
    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
      No modules are assigned to this programme.
    </p>
  )}
</div>

          <div>
  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
    Semester
  </label>

  <select
    value={markForm.semester}
    onChange={(e) =>
      setMarkForm((form) => ({
        ...form,
        semester: e.target.value,
      }))
    }
    required
    className={fieldClass}
  >
    <option value="">Select semester</option>

    {Array.from({ length: 10 }, (_, index) => {
      const year = new Date().getFullYear() - index;

      return [
        <option key={`${year}-S1`} value={`${year}-S1`}>
          {year} - Semester 1
        </option>,
        <option key={`${year}-S2`} value={`${year}-S2`}>
          {year} - Semester 2
        </option>,
      ];
    })}
  </select>
</div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Grade
            </label>

            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={markForm.grade}
                onChange={(e) =>
                  setMarkForm((form) => ({
                    ...form,
                    grade: e.target.value,
                  }))
                }
                placeholder="0"
                required
                className={`${fieldClass} pr-9`}
              />

              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                %
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingMark}
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingMark ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Record mark
              </>
            )}
          </button>
        </form>
      </section>

      {/* ================================================== */}
      {/* FAILED MODULES */}
      {/* ================================================== */}

      {failedModules.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-950 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-red-100 bg-red-50/60 px-5 py-4 dark:border-red-950 dark:bg-red-950/20 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <AlertTriangle size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Failed modules
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Modules currently requiring a retake.
                </p>
              </div>
            </div>

            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {failedModules.length}
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {failedModules.map((failed) => (
              <div
                key={failed.module.code}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {failed.grade}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {failed.module.code}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500">
                      {failed.module.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    Grade {failed.grade}%
                  </span>

                  {failed.is_prerequisite_for_major && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                      Blocks major
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

// ---------- Dashboard Home ----------
function DashboardHome({ onSelectStudent, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600 dark:border-zinc-800 dark:border-t-blue-500" />
          <p className="mt-3 text-sm text-zinc-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">
          Dashboard data is unavailable.
        </p>
      </div>
    );
  }

  return (
    <AdminDashboardPage
      dashboard={stats}
      onNavigate={onNavigate}
      onStudentClick={(student) => {
        onSelectStudent(student.id);
      }}
    />
  );
}

// ---------- At-Risk Students ----------
function AtRiskStudents({ onSelectStudent }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function exportCsv(students) {
    const rows = [
      [
        "Name",
        "Student number",
        "Programme",
        "Weighted average",
        "Target average",
        "Failed blocking modules",
        "Reasons",
      ],
      ...students.map((student) => [
        student.name,
        student.student_number,
        student.programme_code,
        student.weighted_average ?? "",
        student.target_average,
        student.failed_blocking_count,
        student.reasons.join("; "),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `at-risk-students-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-zinc-500">
            Loading at-risk students...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error || "Unable to load at-risk students."}
      </div>
    );
  }

  return (
    <AtRiskPage
      students={stats.at_risk_students || []}
      onStudentClick={(student) =>
        onSelectStudent(student.id)
      }
      onExport={exportCsv}
    />
  );
}

// ---------- Curriculum Management ----------

// ---------- Admin Dashboard Shell ----------

const ADMIN_NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "at-risk",
        label: "At risk",
        icon: AlertTriangle,
      },
      {
        id: "programme-breakdown",
        label: "Programme breakdown",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Students",
    items: [
      {
        id: "students",
        label: "Students",
        icon: Users,
      },
      {
        id: "add",
        label: "Add student",
        icon: UserPlus,
      },
      {
        id: "bulk",
        label: "Bulk upload",
        icon: UploadCloud,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        id: "bulk-email",
        label: "Bulk Email",
        icon: Mail,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        id: "admin-management",
        label: "Admin Management",
        icon: ShieldCheck,
      },
    ],
  },
];

const ADMIN_TAB_LABELS = Object.fromEntries(
  ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => [item.id, item.label])
  )
);

function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] =
    useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [admin, setAdmin] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("admin-theme");
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("admin-theme", darkMode ? "dark" : "light");
    } catch {
      // Ignore storage errors.
    }
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("admin-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "admin-sidebar-collapsed",
        String(sidebarCollapsed)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    api.adminMe()
      .then(setAdmin)
      .catch(() => {});
  }, []);

  function navigateTo(nextTab) {
    setSelectedStudentId(null);
    setTab(nextTab);
    setMobileMenuOpen(false);
  }

  const pageTitle = selectedStudentId
    ? "Student details"
    : ADMIN_TAB_LABELS[tab] || "Administration";

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "AD";

  function SidebarContent({ collapsed = false, mobile = false }) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div
          className={`relative flex h-[76px] shrink-0 items-center border-b border-zinc-800 ${
            collapsed ? "justify-center px-3" : "px-5"
          }`}
        >
          <button
            type="button"
            onClick={() => navigateTo("dashboard")}
            title={collapsed ? "Graduation Tracker" : undefined}
            className={`flex min-w-0 items-center ${
              collapsed ? "justify-center" : "gap-3 text-left"
            }`}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
              <GraduationCap size={21} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-white">
                  Graduation Tracker
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                  Administration
                </p>
              </div>
            )}
          </button>

          {mobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="ml-auto flex size-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto py-5 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <nav className={collapsed ? "space-y-4" : "space-y-6"}>
            {ADMIN_NAV_GROUPS.map((group, groupIndex) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                    {group.label}
                  </p>
                )}

                {collapsed && groupIndex > 0 && (
                  <div className="mx-auto mb-2 h-px w-7 bg-zinc-800" />
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = !selectedStudentId && tab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        title={collapsed ? item.label : undefined}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        className={`group flex w-full items-center rounded-xl py-2.5 text-sm font-medium transition ${
                          collapsed
                            ? "justify-center px-2"
                            : "gap-3 px-3 text-left"
                        } ${
                          active
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-950/20"
                            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={`shrink-0 ${
                            active
                              ? "text-white"
                              : "text-zinc-500 transition group-hover:text-zinc-300"
                          }`}
                        />

                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            {active && (
                              <ChevronRight size={14} className="text-blue-200" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Admin account */}
        <div
          className={`shrink-0 border-t border-zinc-800 ${
            collapsed ? "p-2" : "p-3"
          }`}
        >
          {collapsed ? (
            <div className="space-y-2">
              <div
                title={`${admin?.name || "Administrator"} — ${
                  admin?.username || "Admin account"
                }`}
                className="flex justify-center"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200">
                  {initials}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
                className="flex w-full items-center justify-center rounded-lg py-2.5 text-zinc-500 transition hover:bg-red-950/30 hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-900 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-200">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-200">
                    {admin?.name || "Administrator"}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                    {admin?.username || "Admin account"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-400"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-zinc-800 bg-zinc-950 transition-[width] duration-300 ease-in-out lg:block ${
          sidebarCollapsed ? "w-[80px]" : "w-[260px]"
        }`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />

        <button
          type="button"
          onClick={() => setSidebarCollapsed((current) => !current)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[88px] z-50 flex size-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-lg transition hover:border-blue-500 hover:bg-blue-600 hover:text-white"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={14} />
          ) : (
            <PanelLeftClose size={14} />
          )}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <motion.button
          type="button"
          aria-label="Close navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: mobileMenuOpen ? 0 : "-100%",
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 35,
        }}
        className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-zinc-800 bg-zinc-950 lg:hidden"
      >
        <SidebarContent mobile />
      </motion.aside>

      {/* Main area */}
      <div
        className={`min-h-screen transition-[padding] duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85">
          <div className="flex h-[76px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                <span>Administration</span>

                <ChevronRight size={12} />

                <span className="truncate text-zinc-500 dark:text-zinc-400">
                  {pageTitle}
                </span>
              </div>

              <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                {pageTitle}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDarkMode((current) => !current)}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {admin?.name ||
                    "Administrator"}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-400">
                  Admin portal
                </p>
              </div>

              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {selectedStudentId ? (
            <StudentDetail
              studentId={selectedStudentId}
              onBack={() =>
                setSelectedStudentId(null)
              }
              onChanged={() =>
                setRefreshKey((key) => key + 1)
              }
            />
          ) : (
            <>
              {tab === "dashboard" && (
                <DashboardHome
                  onSelectStudent={
                    setSelectedStudentId
                  }
                  onNavigate={navigateTo}
                />
              )}

              {tab === "at-risk" && (
                <AtRiskStudents
                  onSelectStudent={
                    setSelectedStudentId
                  }
                />
              )}

              {tab ===
                "programme-breakdown" && (
                <ProgrammeBreakdownView
                  onSelectStudent={
                    setSelectedStudentId
                  }
                />
              )}

              {tab === "students" && (
                <AdminStudentListEnhanced
                  key={refreshKey}
                  onSelectStudent={
                    setSelectedStudentId
                  }
                />
              )}

              {tab === "add" && (
                <CreateStudentForm
                  onCreated={() => {
                    setRefreshKey(
                      (key) => key + 1
                    );
                    navigateTo("students");
                  }}
                />
              )}

             {tab === "bulk" && <AdminBulkUpload />}

              {tab ===
                "admin-management" && (
                <AdminAccountManagement />
              )}

              {tab === "bulk-email" && (
                <AdminBulkEmail />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- Entry Point ----------
export default function AdminApp({ onLogout, loginOnly, onLoggedIn, onBack }) {
  if (loginOnly) {
    return <AdminLogin onLoggedIn={onLoggedIn} onBack={onBack} />;
  }
  return <AdminDashboard onLogout={onLogout} />;
}