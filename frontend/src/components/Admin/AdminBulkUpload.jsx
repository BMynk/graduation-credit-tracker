import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  GraduationCap,
  RefreshCw,
  Upload,
  Users,
  X,
} from "lucide-react";

import { api } from "../../api";

export default function AdminBulkUpload() {
  const [studentsFile, setStudentsFile] = useState(null);
  const [marksFile, setMarksFile] = useState(null);

  const [studentsReport, setStudentsReport] = useState(null);
  const [marksReport, setMarksReport] = useState(null);

  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateFile = (file) => {
    if (!file) return false;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return false;
    }

    return true;
  };

  const handleStudentsFile = (file) => {
    setError("");
    setSuccess("");
    setStudentsReport(null);

    if (!file) {
      setStudentsFile(null);
      return;
    }

    if (!validateFile(file)) return;

    setStudentsFile(file);
  };

  const handleMarksFile = (file) => {
    setError("");
    setSuccess("");
    setMarksReport(null);

    if (!file) {
      setMarksFile(null);
      return;
    }

    if (!validateFile(file)) return;

    setMarksFile(file);
  };

  const uploadStudents = async () => {
    if (!studentsFile) {
      setError("Choose a students CSV file first.");
      return;
    }

    setUploading("students");
    setError("");
    setSuccess("");
    setStudentsReport(null);

    try {
      const report =
        await api.adminUploadStudentsCsv(studentsFile);

      setStudentsReport(report);
      setSuccess("Student CSV processing completed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  const uploadMarks = async () => {
    if (!marksFile) {
      setError("Choose a marks CSV file first.");
      return;
    }

    setUploading("marks");
    setError("");
    setSuccess("");
    setMarksReport(null);

    try {
      const report =
        await api.adminUploadMarksCsv(marksFile);

      setMarksReport(report);
      setSuccess("Marks CSV processing completed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-white to-blue-50/80 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/20">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold text-blue-600 shadow-sm dark:border-blue-900/60 dark:bg-zinc-900 dark:text-blue-400">
              <FileSpreadsheet size={13} />
              Data Import
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Bulk upload
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Import multiple student records or academic
              results from CSV files.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/80">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                CSV import
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-400">
                Validation & reports enabled
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

      {/* Upload cards */}
      <div className="grid gap-6 xl:grid-cols-2">
        <UploadCard
          type="students"
          title="Student records"
          description="Create new students or update existing student records."
          icon={Users}
          file={studentsFile}
          onFileChange={handleStudentsFile}
          onUpload={uploadStudents}
          uploading={uploading === "students"}
          disabled={uploading !== null}
          columns={[
            "name",
            "student_number",
            "email",
            "programme_code",
            "current_year",
          ]}
        />

        <UploadCard
          type="marks"
          title="Academic marks"
          description="Import module results for existing students."
          icon={GraduationCap}
          file={marksFile}
          onFileChange={handleMarksFile}
          onUpload={uploadMarks}
          uploading={uploading === "marks"}
          disabled={uploading !== null}
          columns={[
            "student_number",
            "module_code",
            "semester",
            "grade",
          ]}
        />
      </div>

      {/* Reports */}
      {studentsReport && (
        <UploadReport
          title="Student upload report"
          report={studentsReport}
        />
      )}

      {marksReport && (
        <UploadReport
          title="Marks upload report"
          report={marksReport}
        />
      )}

      {/* Information */}
      {!studentsReport && !marksReport && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <AlertCircle size={17} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Before uploading
              </h3>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Make sure the first row of your CSV contains
                the required column names exactly as shown
                above. Student numbers are used to identify
                existing student records.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadCard({
  type,
  title,
  description,
  icon: Icon,
  file,
  onFileChange,
  onUpload,
  uploading,
  disabled,
  columns,
}) {
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  const removeFile = () => {
    onFileChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Icon size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Required columns */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Required CSV columns
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {columns.map((column) => (
              <code
                key={column}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
              >
                {column}
              </code>
            ))}
          </div>
        </div>

        {/* Drop area */}
        <div
          onDragOver={(event) =>
            event.preventDefault()
          }
          onDrop={handleDrop}
          onClick={() =>
            !file && inputRef.current?.click()
          }
          className={`mt-5 rounded-2xl border-2 border-dashed p-6 text-center transition ${
            file
              ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
              : "cursor-pointer border-zinc-200 hover:border-blue-300 hover:bg-blue-50/30 dark:border-zinc-700 dark:hover:border-blue-800 dark:hover:bg-blue-950/10"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) =>
              onFileChange(
                event.target.files?.[0] || null
              )
            }
          />

          {file ? (
            <div>
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <FileSpreadsheet size={22} />
              </div>

              <p className="mt-3 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                {formatFileSize(file.size)}
              </p>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeFile();
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <X size={13} />
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <FileUp size={22} />
              </div>

              <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Drop your CSV here
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                or click to browse your computer
              </p>

              <span className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                Choose CSV
              </span>
            </div>
          )}
        </div>

        {/* Upload */}
        <button
          type="button"
          onClick={onUpload}
          disabled={!file || disabled}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none dark:disabled:bg-zinc-800"
        >
          {uploading ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={15} />
              Upload {type === "students"
                ? "students"
                : "marks"}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function UploadReport({ title, report }) {
  const succeeded = report?.succeeded ?? 0;
  const failed = report?.failed ?? 0;
  const total =
    report?.total_rows ??
    succeeded + failed;

  const successRate =
    total > 0
      ? Math.round((succeeded / total) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            CSV processing results.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={13} />
          {successRate}% successful
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <ReportStat
            label="Total rows"
            value={total}
          />

          <ReportStat
            label="Successful"
            value={succeeded}
            type="success"
          />

          <ReportStat
            label="Failed"
            value={failed}
            type={
              failed > 0 ? "error" : "default"
            }
          />
        </div>

        {report?.results?.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Row details
              </p>
            </div>

            <div className="max-h-[360px] overflow-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-left dark:border-zinc-800">
                    <TableHead>Row</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </tr>
                </thead>

                <tbody>
                  {report.results.map(
                    (item, index) => {
                      const successful =
                        item.status === "success" ||
                        item.status === "succeeded";

                      return (
                        <tr
                          key={`${item.row}-${index}`}
                          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                        >
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {item.row ?? index + 1}
                          </td>

                          <td className="px-4 py-3 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                            {item.identifier || "—"}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                successful
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  successful
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                }`}
                              />

                              {successful
                                ? "Success"
                                : "Failed"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {item.detail || "—"}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReportStat({
  label,
  value,
  type = "default",
}) {
  const styles = {
    default:
      "text-zinc-950 dark:text-white",
    success:
      "text-emerald-600 dark:text-emerald-400",
    error:
      "text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${styles[type]}`}
      >
        {value}
      </p>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
      {children}
    </th>
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

      <span className="flex-1">
        {message}
      </span>

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

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}