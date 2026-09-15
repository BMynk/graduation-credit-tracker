// frontend/src/components/admin/AdminBulkEmail.jsx
import { useState, useEffect } from "react";
import { api } from "../../api";
import Card from "../Card";
import ErrorBanner from "../ErrorBanner";
import SuccessBanner from "../SuccessBanner";

function AdminBulkEmail() {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState(null);

  // Form state
  const [form, setForm] = useState({
    subject: "",
    body: "",
    programme_code: "",
    current_year: "",
    is_active: true,
    send_test: false,
  });

  useEffect(() => {
    api.listProgrammes().then(setProgrammes).catch(() => {});
  }, []);

  const updateForm = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear results when form changes
    setResult(null);
    setShowPreview(false);
  };

  const handlePreview = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      setError("Please enter both a subject and body.");
      return;
    }

    setLoading(true);
    setError("");
    setShowPreview(false);

    try {
      const response = await api.request("/email/preview", {
        method: "POST",
        body: {
          subject: form.subject,
          body: form.body,
          programme_code: form.programme_code || null,
          current_year: form.current_year ? parseInt(form.current_year) : null,
          is_active: form.is_active,
        },
        auth: true,
      });
      setPreview(response);
      setShowPreview(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      setError("Please enter both a subject and body.");
      return;
    }

    if (!preview) {
      await handlePreview();
      if (error) return;
    }

    const confirmMsg = form.send_test
      ? `Send a test email to yourself (${api.getAdminEmail() || "your email"})?`
      : `Send this email to ${preview?.recipient_count || 0} students? This action cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    setSending(true);
    setError("");
    setSuccess("");
    setResult(null);

    try {
      const response = await api.request("/email/send", {
        method: "POST",
        body: {
          subject: form.subject,
          body: form.body,
          programme_code: form.programme_code || null,
          current_year: form.current_year ? parseInt(form.current_year) : null,
          is_active: form.is_active,
          send_test: form.send_test,
        },
        auth: true,
      });
      setResult(response);
      if (response.failed === 0) {
        setSuccess(`✅ Email sent to ${response.total_sent} students successfully!`);
      } else {
        setSuccess(`✅ Sent to ${response.total_sent} students, failed: ${response.failed}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
      setShowPreview(false);
    }
  };

  const getAdminEmail = () => {
    // This would need to be fetched from the admin profile
    // For now, we'll use a placeholder
    return "admin@credit-tracker.com";
  };

  return (
    <div className="space-y-6">
      <Card title="📧 Bulk Email">
        <p className="text-sm text-slate-500 mb-4">
          Send announcements to students by programme and/or year. All emails will be sent from your configured email address.
        </p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <SuccessBanner message={success} onDismiss={() => setSuccess("")} />

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g., Registration Deadline Reminder"
              value={form.subject}
              onChange={(e) => updateForm("subject", e.target.value)}
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
              rows="8"
              placeholder="Enter your announcement here..."
              value={form.body}
              onChange={(e) => updateForm("body", e.target.value)}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {form.body.length} characters (max 10,000)
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Programme</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.programme_code}
                onChange={(e) => updateForm("programme_code", e.target.value)}
              >
                <option value="">All Programmes</option>
                {programmes.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Year</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.current_year}
                onChange={(e) => updateForm("current_year", e.target.value)}
              >
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateForm("is_active", e.target.checked)}
                className="rounded border-slate-300"
              />
              Only active students
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.send_test}
                onChange={(e) => updateForm("send_test", e.target.checked)}
                className="rounded border-slate-300"
              />
              Send test email (only to me)
            </label>
          </div>

          {/* Preview */}
          {showPreview && preview && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-slate-700">
                  📊 Preview: {preview.recipient_count} student(s) will receive this email
                </p>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-sm text-slate-400 hover:text-slate-600"
                >
                  Hide
                </button>
              </div>
              {preview.sample_recipients.length > 0 && (
                <div className="text-sm text-slate-500">
                  <p>Sample recipients:</p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {preview.sample_recipients.map((email, i) => (
                      <li key={i}>{email}</li>
                    ))}
                    {preview.recipient_count > 5 && (
                      <li>... and {preview.recipient_count - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "👁️ Preview"}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
            >
              {sending ? "Sending..." : form.send_test ? "📧 Send Test" : "📧 Send to All"}
            </button>
          </div>
        </form>
      </Card>

      {/* Results */}
      {result && (
        <Card title="📋 Send Results">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Total Attempted</div>
              <div className="text-xl font-bold text-slate-800">
                {result.total_sent + result.failed}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Sent Successfully</div>
              <div className="text-xl font-bold text-emerald-600">{result.total_sent}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500">Failed</div>
              <div className={`text-xl font-bold ${result.failed > 0 ? "text-red-600" : "text-slate-800"}`}>
                {result.failed}
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-600 max-h-40 overflow-y-auto">
              <p className="font-medium mb-1">Errors:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default AdminBulkEmail;