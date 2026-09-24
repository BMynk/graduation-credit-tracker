import { useEffect, useState } from "react";
import { Download, FileText, Search, Trash2, Upload } from "lucide-react";
import { api } from "../../api";

export default function PastPapersPanel({ student }) {
  const [papers, setPapers] = useState([]);
  const [moduleFilter, setModuleFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    try { setPapers(await api.getPastPapers({ module: moduleFilter, level: levelFilter })); setError(""); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.paper_file.files[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      await api.uploadPastPaper(file, {
        module_code: form.elements.module_code.value,
        module_name: form.elements.module_name.value,
        paper_year: form.elements.paper_year.value,
        semester: form.elements.semester.value,
        level: form.elements.level.value,
        description: form.elements.description.value,
        sharing_confirmed: form.elements.sharing_confirmed.checked,
      });
      form.reset(); setShowUpload(false); await load();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  }

  async function remove(id) {
    try { await api.deletePastPaper(id); setPapers((items) => items.filter((item) => item.id !== id)); }
    catch (err) { setError(err.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div><h2 className="flex items-center gap-2 text-lg font-bold text-zinc-950 dark:text-white"><FileText size={20}/> Past Paper Library</h2><p className="mt-1 text-sm text-zinc-500">Share permitted PDF past papers with students across levels in your programme.</p></div>
        <button onClick={() => setShowUpload((v) => !v)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"><Upload size={16}/> Upload paper</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      {showUpload && (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Module code<input required name="module_code" maxLength="30" placeholder="CSC324" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 dark:border-zinc-700"/></label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Module name<input name="module_name" maxLength="180" placeholder="Optional" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 dark:border-zinc-700"/></label>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Paper year<input required name="paper_year" type="number" min="1990" max="2100" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 dark:border-zinc-700"/></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Level<input required name="level" type="number" min="1" max="10" defaultValue={student?.current_year || 1} className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 dark:border-zinc-700"/></label><label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Semester<select name="semester" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 dark:border-zinc-700"><option value="">Any</option><option value="1">1</option><option value="2">2</option></select></label></div>
          <label className="text-sm font-medium text-zinc-700 md:col-span-2 dark:text-zinc-300">Description<textarea name="description" maxLength="500" rows="2" placeholder="Optional notes about the paper" className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 dark:border-zinc-700"/></label>
          <label className="text-sm font-medium text-zinc-700 md:col-span-2 dark:text-zinc-300">PDF file (max 8 MB)<input required name="paper_file" type="file" accept="application/pdf,.pdf" className="mt-1.5 block w-full text-sm"/></label>
          <label className="flex items-start gap-2 text-xs leading-5 text-zinc-500 md:col-span-2"><input required name="sharing_confirmed" type="checkbox" className="mt-1"/> I confirm that I am allowed to share this past paper and that it does not contain restricted or private material.</label>
          <div className="md:col-span-2"><button disabled={uploading} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{uploading ? "Uploading…" : "Upload to library"}</button></div>
        </form>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-zinc-400"/><input value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} placeholder="Search module code…" className="w-full rounded-xl border border-zinc-200 bg-transparent py-2.5 pl-9 pr-3 text-sm dark:border-zinc-700"/></div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"><option value="">All levels</option>{[1,2,3,4,5,6].map((n)=><option key={n} value={n}>Level {n}</option>)}</select>
        <button onClick={load} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold dark:border-zinc-700">Search</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {papers.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 md:col-span-2 xl:col-span-3 dark:border-zinc-700">No past papers found yet. Students can help build the library by uploading permitted PDFs.</div>}
        {papers.map((paper) => (
          <article key={paper.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10"><FileText size={19}/></div><span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">Level {paper.level}</span></div>
            <h3 className="mt-3 font-bold text-zinc-950 dark:text-white">{paper.module_code}</h3><p className="text-xs text-zinc-500">{paper.module_name || "Past examination paper"} · {paper.paper_year}{paper.semester ? ` · Semester ${paper.semester}` : ""}</p>
            {paper.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{paper.description}</p>}
            <p className="mt-3 text-[11px] text-zinc-400">Shared by {paper.uploader.name}</p>
            <div className="mt-4 flex gap-2"><a href={paper.file_url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white"><Download size={14}/> View / download</a>{paper.uploader.id === student?.id && <button onClick={() => remove(paper.id)} className="rounded-xl border border-zinc-200 px-3 text-zinc-500 dark:border-zinc-700" title="Remove your upload"><Trash2 size={15}/></button>}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
