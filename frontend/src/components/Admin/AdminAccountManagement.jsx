import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

import { api } from "../../api";

function AdminAccountManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    is_super_admin: false,
  });

  const [myProfile, setMyProfile] = useState(null);

  const loadAdmins = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.adminListAdmins();
      setAdmins(data);

      const me = await api.adminGetMyProfile();
      setMyProfile(me);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return admins;

    return admins.filter((admin) => {
      return (
        admin.name?.toLowerCase().includes(query) ||
        admin.username?.toLowerCase().includes(query)
      );
    });
  }, [admins, search]);

  const stats = useMemo(() => {
    return {
      total: admins.length,
      active: admins.filter((admin) => admin.is_active).length,
      superAdmins: admins.filter(
        (admin) => admin.is_super_admin
      ).length,
      inactive: admins.filter((admin) => !admin.is_active).length,
    };
  }, [admins]);

  const handleCreate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setActionLoading("create");

    try {
      await api.adminCreateAdmin({
        ...form,
        is_super_admin: form.is_super_admin,
      });

      setSuccess(`Admin ${form.username} created successfully.`);

      setIsCreating(false);
      setShowPassword(false);

      setForm({
        name: "",
        username: "",
        password: "",
        is_super_admin: false,
      });

      await loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const admin = admins.find((item) => item.id === id);

    const confirmed = window.confirm(
      currentStatus
        ? `Deactivate ${admin?.name || "this admin"}?`
        : `Reactivate ${admin?.name || "this admin"}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setActionLoading(`status-${id}`);

    try {
      if (currentStatus) {
        await api.adminDeleteAdmin(id);
        setSuccess(
          `${admin?.name || "Admin"} has been deactivated.`
        );
      } else {
        await api.adminReactivateAdmin(id);
        setSuccess(
          `${admin?.name || "Admin"} has been reactivated.`
        );
      }

      await loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (id, username) => {
    const newPassword = window.prompt(
      `Enter a new password for ${username}:`
    );

    if (newPassword === null) return;

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(`password-${id}`);

    try {
      await api.adminResetAdminPassword(id, {
        new_password: newPassword,
      });

      setSuccess(`Password for ${username} was reset successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !myProfile) {
    return <AdminManagementSkeleton />;
  }

  if (!myProfile?.is_super_admin) {
    return (
      <div className="space-y-6">
        <PageHeader
          onCreate={() => {}}
          canCreate={false}
        />

        <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="max-w-md">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <LockKeyhole size={25} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-zinc-950 dark:text-white">
              Super admin access required
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Administrator accounts can only be created, deactivated,
              reactivated, or updated by a super administrator.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        onCreate={() => {
          setIsCreating(true);
          setError("");
          setSuccess("");
        }}
        canCreate
      />

      {/* Notifications */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />

          <span className="flex-1">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 transition hover:text-red-600"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          <span className="flex-1">{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-emerald-500 transition hover:text-emerald-700"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total admins"
          value={stats.total}
          helper="Administrator accounts"
        />

        <StatCard
          icon={UserCheck}
          label="Active"
          value={stats.active}
          helper="Can access the portal"
          variant="success"
        />

        <StatCard
          icon={ShieldCheck}
          label="Super admins"
          value={stats.superAdmins}
          helper="Full administrative access"
          variant="purple"
        />

        <StatCard
          icon={UserX}
          label="Inactive"
          value={stats.inactive}
          helper="Access currently disabled"
          variant="warning"
        />
      </div>

      {/* Create Admin */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <UserPlus size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Create administrator
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Add a new account to the administration portal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setShowPassword(false);
              }}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X size={17} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Full name">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. John Smith"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Username">
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      username: e.target.value,
                    }))
                  }
                  placeholder="e.g. john.smith"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Password"
                helper="Minimum 8 characters"
              >
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter secure password"
                    required
                    minLength={8}
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </FormField>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Account role
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      is_super_admin: !current.is_super_admin,
                    }))
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                    form.is_super_admin
                      ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      form.is_super_admin
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    }`}
                  >
                    <Shield size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Super administrator
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500">
                      Grant full admin-management privileges
                    </p>
                  </div>

                  <div
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                      form.is_super_admin
                        ? "bg-blue-600"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition ${
                        form.is_super_admin
                          ? "left-[18px]"
                          : "left-0.5"
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setShowPassword(false);
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading === "create"}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "create" ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Plus size={16} />
                )}

                {actionLoading === "create"
                  ? "Creating..."
                  : "Create admin"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Admin directory */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              Administrator directory
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Manage access to the administration portal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admins..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-xs text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 sm:w-52"
              />
            </div>

            <button
              type="button"
              onClick={loadAdmins}
              disabled={loading}
              className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Refresh"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto size-5 animate-spin text-blue-600" />
              <p className="mt-3 text-xs text-zinc-500">
                Loading administrators...
              </p>
            </div>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <Users size={20} />
              </div>

              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                No administrators found
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Try changing your search.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-left dark:border-zinc-800 dark:bg-zinc-950/40">
                    <TableHead>Administrator</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </tr>
                </thead>

                <tbody>
                  {filteredAdmins.map((admin) => (
                    <AdminRow
                      key={admin.id}
                      admin={admin}
                      isMe={admin.id === myProfile?.id}
                      actionLoading={actionLoading}
                      onToggleStatus={handleToggleStatus}
                      onResetPassword={handleResetPassword}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 md:hidden">
              {filteredAdmins.map((admin) => (
                <AdminMobileCard
                  key={admin.id}
                  admin={admin}
                  isMe={admin.id === myProfile?.id}
                  actionLoading={actionLoading}
                  onToggleStatus={handleToggleStatus}
                  onResetPassword={handleResetPassword}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PageHeader({ onCreate, canCreate }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-white to-blue-50/80 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold text-blue-600 shadow-sm dark:border-blue-900/60 dark:bg-zinc-900 dark:text-blue-400">
            <ShieldCheck size={13} />
            Access Control
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Admin management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Manage administrator accounts, portal access and elevated
            permissions.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <UserPlus size={16} />
            Add administrator
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  variant = "default",
}) {
  const variants = {
    default:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    success:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    purple:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    warning:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-zinc-400">{helper}</p>
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${variants[variant]}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function AdminRow({
  admin,
  isMe,
  actionLoading,
  onToggleStatus,
  onResetPassword,
}) {
  const statusLoading = actionLoading === `status-${admin.id}`;
  const passwordLoading = actionLoading === `password-${admin.id}`;

  return (
    <tr className="border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:bg-zinc-800/30">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <AdminAvatar name={admin.name} />

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {admin.name}
              </p>

              {isMe && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  You
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-zinc-400">
              @{admin.username}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        {admin.is_super_admin ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
            <ShieldCheck size={12} />
            Super Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <UserCog size={12} />
            Admin
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <StatusBadge active={admin.is_active} />
      </td>

      <td className="px-5 py-4">
        <p className="text-xs text-zinc-500">
          {isMe ? "Current account" : "Administrator"}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          {isMe ? (
            <span className="text-xs text-zinc-400">
              Current account
            </span>
          ) : (
            <>
              <button
                type="button"
                disabled={passwordLoading}
                onClick={() =>
                  onResetPassword(admin.id, admin.username)
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {passwordLoading ? (
                  <RefreshCw className="size-3 animate-spin" />
                ) : (
                  <KeyRound size={12} />
                )}
                Reset password
              </button>

              <button
                type="button"
                disabled={statusLoading}
                onClick={() =>
                  onToggleStatus(admin.id, admin.is_active)
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${
                  admin.is_active
                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {statusLoading ? (
                  <RefreshCw className="size-3 animate-spin" />
                ) : admin.is_active ? (
                  <UserX size={12} />
                ) : (
                  <UserCheck size={12} />
                )}

                {admin.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AdminMobileCard({
  admin,
  isMe,
  actionLoading,
  onToggleStatus,
  onResetPassword,
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <AdminAvatar name={admin.name} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {admin.name}
            </p>

            {isMe && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                You
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-zinc-400">
            @{admin.username}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge active={admin.is_active} />

            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {admin.is_super_admin ? "Super Admin" : "Admin"}
            </span>
          </div>

          {!isMe && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  actionLoading === `password-${admin.id}`
                }
                onClick={() =>
                  onResetPassword(admin.id, admin.username)
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                <KeyRound size={13} />
                Reset password
              </button>

              <button
                type="button"
                disabled={
                  actionLoading === `status-${admin.id}`
                }
                onClick={() =>
                  onToggleStatus(admin.id, admin.is_active)
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                  admin.is_active
                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {admin.is_active ? (
                  <UserX size={13} />
                ) : (
                  <UserCheck size={13} />
                )}

                {admin.is_active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminAvatar({ name }) {
  const initials = (name || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
      {initials}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function TableHead({ children, className = "" }) {
  return (
    <th
      className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

function FormField({ label, helper, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>

        {helper && (
          <span className="text-[10px] text-zinc-400">
            {helper}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function AdminManagementSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>

      <div className="h-80 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}

export default AdminAccountManagement;