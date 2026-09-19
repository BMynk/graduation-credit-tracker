import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  TestTube2,
  Users,
  X,
} from "lucide-react";

import { api } from "../../api";

function AdminBulkEmail() {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    subject: "",
    body: "",
    programme_code: "",
    current_year: "",
    is_active: true,
    send_test: false,
  });

  useEffect(() => {
    api
      .listProgrammes()
      .then(setProgrammes)
      .catch(() => {});
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setPreview(null);
    setResult(null);
    setShowPreview(false);
    setError("");
    setSuccess("");
  };

  const selectedProgramme = useMemo(
    () =>
      programmes.find(
        (programme) =>
          programme.code === form.programme_code
      ),
    [programmes, form.programme_code]
  );

  const buildPayload = (includeTest = false) => ({
    subject: form.subject.trim(),
    body: form.body.trim(),
    programme_code: form.programme_code || null,
    current_year: form.current_year
      ? parseInt(form.current_year, 10)
      : null,
    is_active: form.is_active,
    ...(includeTest
      ? { send_test: form.send_test }
      : {}),
  });

  const validateMessage = () => {
    if (!form.subject.trim()) {
      setError("Please enter an email subject.");
      return false;
    }

    if (!form.body.trim()) {
      setError("Please enter a message.");
      return false;
    }

    if (form.body.length > 10000) {
      setError(
        "The message cannot exceed 10,000 characters."
      );
      return false;
    }

    return true;
  };

  const fetchPreview = async () => {
    if (!validateMessage()) return null;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.request(
        "/email/preview",
        {
          method: "POST",
          body: buildPayload(false),
          auth: true,
        }
      );

      setPreview(response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setShowPreview(false);

    const response = await fetchPreview();

    if (response) {
      setShowPreview(true);
    }
  };

  const handleSend = async () => {
    if (!validateMessage()) return;

    let currentPreview = preview;

    if (!currentPreview) {
      currentPreview = await fetchPreview();

      if (!currentPreview) return;

      setPreview(currentPreview);
    }

    if (
      !form.send_test &&
      currentPreview.recipient_count === 0
    ) {
      setShowPreview(true);
      setError(
        "No students match the selected recipient filters."
      );
      return;
    }

    const confirmMessage = form.send_test
      ? "Send this test email to your administrator account?"
      : `Send this email to ${currentPreview.recipient_count} student${
          currentPreview.recipient_count === 1 ? "" : "s"
        }? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) return;

    setSending(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await api.request(
        "/email/send",
        {
          method: "POST",
          body: buildPayload(true),
          auth: true,
        }
      );

      setResult(response);

      if (response.failed === 0) {
        setSuccess(
          form.send_test
            ? "Test email sent successfully."
            : `Email sent successfully to ${response.total_sent} student${
                response.total_sent === 1 ? "" : "s"
              }.`
        );
      } else {
        setSuccess(
          `Sent ${response.total_sent} successfully. ${response.failed} failed.`
        );
      }

      setShowPreview(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const clearMessage = () => {
    setForm((current) => ({
      ...current,
      subject: "",
      body: "",
    }));

    setPreview(null);
    setResult(null);
    setShowPreview(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-white to-blue-50/80 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold text-blue-600 shadow-sm dark:border-blue-900/60 dark:bg-zinc-900 dark:text-blue-400">
              <Mail size={13} />
              Student Communication
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Bulk email
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Compose announcements and send them to
              targeted groups of students.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/80">
            <ShieldCheck
              size={17}
              className="text-emerald-500"
            />

            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Admin communication
              </p>

              <p className="text-[10px] text-zinc-400">
                Recipient preview enabled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onDismiss={() => setSuccess("")}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* Composer */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <FileText size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Compose message
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Create the email students will receive.
                </p>
              </div>
            </div>

            {(form.subject || form.body) && (
              <button
                type="button"
                onClick={clearMessage}
                className="text-xs font-medium text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-5 p-5">
            <FormField
              label="Subject"
              required
              helper={`${form.subject.length} characters`}
            >
              <input
                type="text"
                value={form.subject}
                onChange={(e) =>
                  updateForm("subject", e.target.value)
                }
                placeholder="e.g. Registration deadline reminder"
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Message"
              required
              helper={`${form.body.length.toLocaleString()} / 10,000`}
            >
              <textarea
                rows={12}
                maxLength={10000}
                value={form.body}
                onChange={(e) =>
                  updateForm("body", e.target.value)
                }
                placeholder="Write your announcement here..."
                className={`${inputClass} min-h-[260px] resize-y leading-6`}
              />
            </FormField>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-zinc-400">
              Preview recipients before sending your
              announcement.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading || sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {loading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Eye size={15} />
                )}

                {loading
                  ? "Checking..."
                  : "Preview recipients"}
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : form.send_test ? (
                  <TestTube2 size={15} />
                ) : (
                  <Send size={15} />
                )}

                {sending
                  ? "Sending..."
                  : form.send_test
                    ? "Send test"
                    : "Send email"}
              </button>
            </div>
          </div>
        </div>

        {/* Recipient settings */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <Users size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                    Recipients
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Target a specific student group.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <FormField label="Programme">
                <SelectWrapper>
                  <select
                    value={form.programme_code}
                    onChange={(e) =>
                      updateForm(
                        "programme_code",
                        e.target.value
                      )
                    }
                    className={selectClass}
                  >
                    <option value="">
                      All programmes
                    </option>

                    {programmes.map((programme) => (
                      <option
                        key={programme.code}
                        value={programme.code}
                      >
                        {programme.code} –{" "}
                        {programme.name}
                      </option>
                    ))}
                  </select>
                </SelectWrapper>
              </FormField>

              <FormField label="Academic year">
                <SelectWrapper>
                  <select
                    value={form.current_year}
                    onChange={(e) =>
                      updateForm(
                        "current_year",
                        e.target.value
                      )
                    }
                    className={selectClass}
                  >
                    <option value="">All years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </SelectWrapper>
              </FormField>

              <ToggleOption
                checked={form.is_active}
                onChange={(checked) =>
                  updateForm("is_active", checked)
                }
                title="Active students only"
                description="Exclude inactive student accounts."
              />

              <ToggleOption
                checked={form.send_test}
                onChange={(checked) =>
                  updateForm("send_test", checked)
                }
                title="Test email"
                description="Send only to the administrator account."
                icon={TestTube2}
              />
            </div>
          </div>

          {/* Selection summary */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Current audience
            </p>

            <div className="mt-4 space-y-3">
              <SummaryRow
                label="Programme"
                value={
                  selectedProgramme
                    ? selectedProgramme.code
                    : "All programmes"
                }
              />

              <SummaryRow
                label="Year"
                value={
                  form.current_year
                    ? `Year ${form.current_year}`
                    : "All years"
                }
              />

              <SummaryRow
                label="Status"
                value={
                  form.is_active
                    ? "Active only"
                    : "All students"
                }
              />

              <SummaryRow
                label="Delivery"
                value={
                  form.send_test
                    ? "Test only"
                    : "Selected students"
                }
              />
            </div>

            {preview && (
              <div className="mt-5 rounded-xl bg-blue-50 p-4 dark:bg-blue-500/10">
                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  Matching recipients
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-300">
                  {preview.recipient_count}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && preview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                Recipient preview
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {preview.recipient_count}{" "}
                {preview.recipient_count === 1
                  ? "student matches"
                  : "students match"}{" "}
                your filters.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            {preview.sample_recipients?.length > 0 ? (
              <>
                <p className="mb-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Sample recipients
                </p>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {preview.sample_recipients.map(
                    (email, index) => (
                      <div
                        key={`${email}-${index}`}
                        className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <Mail
                          size={13}
                          className="shrink-0 text-zinc-400"
                        />

                        <span className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                          {email}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {preview.recipient_count >
                  preview.sample_recipients.length && (
                  <p className="mt-3 text-xs text-zinc-400">
                    And{" "}
                    {preview.recipient_count -
                      preview.sample_recipients.length}{" "}
                    more recipient(s).
                  </p>
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <Users className="mx-auto size-6 text-zinc-300" />

                <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  No matching students
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Change your recipient filters and
                  preview again.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <SendResults result={result} />
      )}
    </div>
  );
}

function SendResults({ result }) {
  const attempted =
    (result.total_sent || 0) + (result.failed || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              Delivery results
            </h2>

            <p className="mt-0.5 text-xs text-zinc-500">
              Summary of the latest email delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <ResultStat
            label="Attempted"
            value={attempted}
          />

          <ResultStat
            label="Successfully sent"
            value={result.total_sent || 0}
            type="success"
          />

          <ResultStat
            label="Failed"
            value={result.failed || 0}
            type={
              result.failed > 0 ? "error" : "default"
            }
          />
        </div>

        {result.errors?.length > 0 && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
              <AlertCircle size={15} />
              Delivery errors
            </div>

            <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
              {result.errors.map((item, index) => (
                <p
                  key={index}
                  className="text-xs leading-5 text-red-600 dark:text-red-400"
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ResultStat({
  label,
  value,
  type = "default",
}) {
  const valueClass = {
    default: "text-zinc-950 dark:text-white",
    success:
      "text-emerald-600 dark:text-emerald-400",
    error: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${valueClass[type]}`}
      >
        {value}
      </p>
    </div>
  );
}

function ToggleOption({
  checked,
  onChange,
  title,
  description,
  icon: Icon = Users,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
        checked
          ? "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20"
          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          checked
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
        }`}
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-zinc-400">
          {description}
        </p>
      </div>

      <div
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked
            ? "bg-blue-600"
            : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-400">
        {label}
      </span>

      <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {value}
      </span>
    </div>
  );
}

function FormField({
  label,
  helper,
  required,
  children,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
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

function SelectWrapper({ children }) {
  return (
    <div className="relative">
      {children}

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
    </div>
  );
}

function Alert({ type, message, onDismiss }) {
  const success = type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      }`}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}

      <span className="flex-1">{message}</span>

      <button
        type="button"
        onClick={onDismiss}
        className="opacity-60 transition hover:opacity-100"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const selectClass =
  "w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-zinc-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200";

export default AdminBulkEmail;