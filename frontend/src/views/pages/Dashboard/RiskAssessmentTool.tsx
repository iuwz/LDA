/*  src/views/pages/Dashboard/RiskAssessmentTool.tsx  */
import React, { useState, useEffect } from "react";
import {
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  analyzeRiskFile,
  RiskAnalysisResponse,
  RiskItemBackend,
  listRiskHistory,
  deleteRiskReport,
  getRiskReport,
  downloadRiskReport,
  uploadRiskPdf,
  RiskHistoryItem,
} from "../../../api";

/* ───────── types ───────── */
type Severity = "high" | "medium" | "low";
interface RiskItem {
  id: number;
  section: string;
  clause: string;
  issue: string;
  risk: Severity;
  recommendation: string;
}

/* ───────── visual helpers ───────── */
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";
const palette = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
} as const;

const RiskLevel: React.FC<{ level: Severity }> = ({ level }) => (
  <span
    className={`rounded border px-2 py-1 text-xs font-medium ${palette[level]}`}
  >
    {level[0].toUpperCase() + level.slice(1)} Risk
  </span>
);

/* ═════════════════ component ═════════════════ */
const RiskAssessmentTool: React.FC = () => {
  /* upload / result state */
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{
    id: string;
    riskItems: RiskItem[];
  } | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);

  /* UI helpers */
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [error, setError] = useState<string | null>(null);

  /* history list */
  const [history, setHistory] = useState<RiskHistoryItem[]>([]);
  useEffect(() => {
    (async () => setHistory(await listRiskHistory()))();
  }, []);

  /** backend → UI mapper */
  const mapRisks = (raw: RiskItemBackend[]): RiskItem[] =>
    raw.map((r, idx) => ({
      id: idx + 1,
      section: r.section,
      clause: (r as any).clause ?? r.section,
      issue: r.risk_description,
      risk: (r.severity || "Low").toLowerCase() as Severity,
      recommendation: r.recommendation ?? "No recommendation provided.",
    }));

  /* ───── Run fresh analysis ───── */
  const analyze = async () => {
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    try {
      const resp: RiskAnalysisResponse = await analyzeRiskFile(file);
      const items = mapRisks(resp.risks);
      setResults({ id: resp.id, riskItems: items });
      setCurrentFilename(file.name);
      setActiveSection("all");

      /* build & upload pretty PDF right away */
      const pdfBlob = buildPdfBlob(items);
      const niceName =
        file.name.replace(/\.[^.]+$/, "") + "_risk_report.pdf";
      await uploadRiskPdf(resp.id, pdfBlob, niceName);

      /* refresh history (now has report_doc_id) */
      setHistory(await listRiskHistory());
    } catch (err: any) {
      console.error("Risk analysis failed:", err);
      setError(err.message || "Risk analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ───── Helpers ───── */
  const openReport = async (h: RiskHistoryItem) => {
    try {
      const rep = await getRiskReport(h.id);
      setResults({ id: rep.id, riskItems: mapRisks(rep.risks as any) });
      setCurrentFilename(h.filename ?? h.report_filename ?? "Report");
      setFile(null);
      setActiveSection("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open report");
    }
  };

  const removeReport = async (id: string) => {
    if (!window.confirm("Delete this risk report?")) return;
    try {
      await deleteRiskReport(id);
      setHistory(h => h.filter(r => r.id !== id));
      if (results?.id === id) reset();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setCurrentFilename(null);
    setActiveSection("all");
    setError(null);
  };

  const buildPdfBlob = (items: RiskItem[]): Blob => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFontSize(18);
    doc.text("Risk Assessment Report", 40, 50);
    autoTable(doc, {
      startY: 80,
      head: [["ID", "Section", "Clause", "Issue", "Risk", "Recommendation"]],
      body: items.map(i => [
        i.id.toString(),
        i.section,
        i.clause,
        i.issue,
        i.risk[0].toUpperCase() + i.risk.slice(1),
        i.recommendation,
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [193, 120, 41] },
    });
    return doc.output("blob");
  };

  /* derived */
  const filtered = results
    ? results.riskItems.filter(
      i =>
        activeSection === "all" ||
        i.section.toLowerCase() === activeSection.toLowerCase(),
    )
    : [];

  const counts: Record<Severity, number> = results
    ? results.riskItems.reduce(
      (acc, i) => ((acc[i.risk] = (acc[i.risk] || 0) + 1), acc),
      { high: 0, medium: 0, low: 0 } as Record<Severity, number>,
    )
    : { high: 0, medium: 0, low: 0 };

  const tap = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* ══════ header ══════ */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[rgb(193,120,41)] to-[var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[var(--accent-light)] p-3 text-[rgb(193,120,41)]">
            <FaShieldAlt size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--brand-dark)]">
              Risk Assessment Tool
            </h1>
            <p className="text-gray-600">
              Identify potential legal issues in your documents
            </p>
          </div>
        </div>
      </header>

      {/* ══════ history ══════ */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <h2 className="font-medium text-[var(--brand-dark)] mb-4">
          Previous Assessments
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No history yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map(h => (
              <li
                key={h.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {h.filename ?? h.report_filename ?? "Report"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(h.created_at).toLocaleString()} • {h.num_risks} risks
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => openReport(h)}
                    className="flex items-center gap-1 text-sm text-[rgb(193,120,41)] hover:underline"
                  >

                  </button>
                  {h.report_doc_id && (
                    <button
                      onClick={() =>
                        downloadRiskReport(
                          h.report_doc_id as string,               //  ← assert non‑null
                          h.report_filename ?? "risk_report.pdf",
                        )
                      }
                      className="flex items-center gap-1 text-sm text-[rgb(193,120,41)] hover:underline"
                    >
                      <FaDownload /> PDF
                    </button>
                  )}
                  <button
                    onClick={() => removeReport(h.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ══════ main pane ══════ */}
      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <UploadPane
            file={file}
            setFile={setFile}
            onAnalyze={analyze}
            reset={reset}
            isAnalyzing={isAnalyzing}
            error={error}
            tap={tap}
          />
        ) : (
          <ResultPane
            results={results}
            counts={counts}
            filtered={filtered}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            reset={reset}
            filename={currentFilename}
            tap={tap}
          />
        )}
      </section>
    </div>
  );
};

/* ─────────────── smaller components ─────────────── */

const UploadPane = ({
  file,
  setFile,
  onAnalyze,
  reset,
  isAnalyzing,
  error,
  tap,
}: {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  onAnalyze: () => void;
  reset: () => void;
  isAnalyzing: boolean;
  error: string | null;
  tap: any;
}) => (
  <div className="p-8">
    <div
      className="flex flex-col items-center justify-center gap-2 p-10
                 border-2 border-dashed border-gray-300 rounded-lg
                 text-center cursor-pointer transition-colors
                 hover:border-[rgb(193,120,41)]"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
      }}
      onClick={() => (document.getElementById("file-input") as HTMLInputElement)?.click()}
    >
      <input
        id="file-input"
        type="file"
        className="hidden"
        accept=".pdf,.docx"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) setFile(f);
        }}
      />

      {file ? (
        <UploadedFileCard file={file} reset={reset} onAnalyze={onAnalyze} tap={tap} />
      ) : (
        <EmptyUploadCard />
      )}

      {isAnalyzing && <Spinner text="Analyzing your document…" />}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  </div>
);

const UploadedFileCard = ({
  file,
  reset,
  onAnalyze,
  tap,
}: {
  file: File;
  reset: () => void;
  onAnalyze: () => void;
  tap: any;
}) => (
  <div>
    <FaFileAlt className="mx-auto text-4xl text-[rgb(193,120,41)]" />
    <p className="mt-3 font-medium text-gray-700">{file.name}</p>
    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
    <div className="mt-4 flex justify-center gap-3">
      <button
        onClick={reset}
        className="flex items-center gap-1 bg-gray-100 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
      >
        <FaTrash /> Remove
      </button>
      <motion.button
        {...tap}
        onClick={e => {
          e.stopPropagation();
          onAnalyze();
        }}
        className="flex items-center gap-1 bg-[rgb(193,120,41)] text-white rounded-md px-4 py-2 text-sm hover:bg-[rgb(173,108,37)]"
      >
        <FaSearch /> Analyze
      </motion.button>
    </div>
  </div>
);

const EmptyUploadCard = () => (
  <>
    <FaCloudUploadAlt className="text-5xl text-gray-400" />
    <p className="mt-4 text-gray-700">Drag & drop or click to upload</p>
    <p className="text-xs text-gray-400">PDF, DOCX only (≤10 MB)</p>
  </>
);

const Spinner = ({ text }: { text: string }) => (
  <div className="mt-8 text-center text-gray-700">
    <div className="h-8 w-8 mx-auto border-b-2 border-[rgb(193,120,41)] rounded-full animate-spin" />
    <p className="mt-3">{text}</p>
  </div>
);

const ResultPane = ({
  results,
  counts,
  filtered,
  activeSection,
  setActiveSection,
  reset,
  filename,
  tap,
}: {
  results: { id: string; riskItems: RiskItem[] };
  counts: Record<Severity, number>;
  filtered: RiskItem[];
  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
  reset: () => void;
  filename: string | null;
  tap: any;
}) => (
  <>
    {/* top bar */}
    <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <FaFileAlt className="text-2xl text-gray-500" />
        <div>
          <h3 className="font-medium text-gray-800">{filename || "Report"}</h3>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
      <motion.button
        {...tap}
        onClick={reset}
        className="min-w-[140px] flex justify-center bg-[rgb(193,120,41)] text-white rounded-md px-4 py-2 text-sm hover:bg-[rgb(173,108,37)]"
      >
        Analyze Another
      </motion.button>
    </div>

    {/* counts */}
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
      {Object.entries(counts).map(([lvl, count]) => (
        <div
          key={lvl}
          className="rounded-lg border bg-gray-50 p-4 text-center"
          style={{ boxShadow: SHADOW }}
        >
          <p className="text-sm text-gray-500 mb-1">
            {lvl[0].toUpperCase() + lvl.slice(1)} Risk Items
          </p>
          <p className="text-2xl font-bold text-gray-800">{count}</p>
        </div>
      ))}
    </div>

    {/* section filter */}
    <div className="overflow-x-auto px-6">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {["all", ...new Set(results.riskItems.map(i => i.section))].map(sec => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors ${activeSection === sec
              ? "bg-[rgb(193,120,41)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {sec === "all" ? "All Sections" : sec}
          </button>
        ))}
      </div>
    </div>

    {/* list */}
    <div className="space-y-4 p-6">
      {filtered.length ? (
        filtered.map(item => (
          <div
            key={item.id}
            className="rounded-lg border p-4 hover:shadow-md transition-shadow"
          >
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  {item.section}: {item.clause}
                </p>
                <p className="text-sm text-gray-600">{item.issue}</p>
              </div>
              <RiskLevel level={item.risk} />
            </div>
            <div className="flex flex-col md:flex-row gap-2 rounded-md border border-[rgb(193,120,41)] bg-[rgb(193,120,41)]/10 p-3 text-sm">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(193,120,41)] text-white">
                <FaInfoCircle size={14} />
              </span>
              <span className="text-[rgb(193,120,41)]">
                {item.recommendation}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="py-8 text-center text-gray-500">
          <FaExclamationTriangle className="mx-auto mb-2 text-3xl text-gray-300" />
          No items for this filter.
        </div>
      )}
    </div>
  </>
);

export default RiskAssessmentTool;
