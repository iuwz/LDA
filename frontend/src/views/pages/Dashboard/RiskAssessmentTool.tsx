/*  src/views/pages/Dashboard/RiskAssessmentTool.tsx
    ──────────────────────────────────────────────────────────────
    Single-file implementation of the Risk-Assessment front-end.
    Card layout:
      • Title / severity badge
      • Grey quote (the offending contract text)
      • Orange suggestion box (recommended fix)
    Back-end should supply an `extracted_text_snippet`; the UI falls
    back gracefully to `clause` or `section` if that’s missing.       */

import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import {
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle,
  FaDownload,
  FaSpinner,
  FaChevronDown,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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

/* ─────────────────── shared helpers ─────────────────── */
type Severity = "high" | "medium" | "low";

interface RiskItem {
  id: number;
  title: string;
  quote: string;
  section: string;
  risk: Severity;
  recommendation: string;
}

const palette = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
} as const;

function RiskLevel({ level }: { level: Severity }) {
  return (
    <span
      className={`rounded border px-2 py-1 text-xs font-medium ${palette[level]}`}
    >
      {level[0].toUpperCase() + level.slice(1)} Risk
    </span>
  );
}

function Spinner({ text }: { text?: string }) {
  return (
    <div className="mt-8 text-center text-gray-700">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#c17829]" />
      {text && <p className="mt-3">{text}</p>}
    </div>
  );
}

/* ─────────────────── UploadedFileCard ─────────────────── */
interface UploadedFileCardProps {
  file: File;
  reset: () => void;
  onAnalyze: () => void;
  tap: any;
  isAnalyzing: boolean;
}

function UploadedFileCard({
  file,
  reset,
  onAnalyze,
  tap,
  isAnalyzing,
}: UploadedFileCardProps) {
  return (
    <div className="text-center">
      <FaFileAlt className="mx-auto text-4xl text-[#c17829]" />
      <p className="mt-3 font-medium text-gray-700">{file.name}</p>
      <p className="text-sm text-gray-500">
        {(file.size / 1024 / 1024).toFixed(2)} MB
      </p>
      {!isAnalyzing && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="flex items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            <FaTrash /> Remove
          </button>
          <motion.button
            {...tap}
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze();
            }}
            className="flex items-center gap-1 rounded-md bg-[#c17829] px-4 py-2 text-sm text-white hover:bg-[#a66224]"
          >
            <FaSearch /> Analyze
          </motion.button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── ResultPane ─────────────────── */
interface ResultPaneProps {
  results: { id: string; riskItems: RiskItem[] };
  counts: Record<Severity, number>;
  filtered: RiskItem[];
  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
  reset: () => void;
  filename: string | null;
  tap: any;
}

function ResultPane({
  results,
  counts,
  filtered,
  activeSection,
  setActiveSection,
  reset,
  filename,
  tap,
}: ResultPaneProps) {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [filtered]);

  const displayed = showAll ? filtered : filtered.slice(0, 3);

  return (
    <>
      {/* top bar */}
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FaFileAlt className="text-2xl text-[#c17829]" />
          <h3 className="font-medium text-gray-800">{filename || "Report"}</h3>
        </div>
        <motion.button
          {...tap}
          onClick={reset}
          className="rounded-md bg-[#c17829] px-4 py-2 text-sm text-white hover:bg-[#a66224]"
        >
          Analyze Another
        </motion.button>
      </div>

      {/* counts */}
      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
        {Object.entries(counts).map(([lvl, c]) => (
          <div
            key={lvl}
            className="rounded-lg border bg-white p-4 text-center shadow-sm"
          >
            <p className="mb-1 text-sm text-gray-500">
              {(lvl as string)[0].toUpperCase() + (lvl as string).slice(1)} Risk
            </p>
            <p className="text-2xl font-bold text-gray-800">{c}</p>
          </div>
        ))}
      </div>

      {/* section filter */}
      <div className="overflow-x-auto px-6">
        <div className="flex flex-wrap gap-2 border-b pb-4 pt-2">
          {["all", ...new Set(results.riskItems.map((i) => i.section))].map(
            (sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${
                  activeSection.toLowerCase() === sec.toLowerCase()
                    ? "bg-[#c17829] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sec === "all" ? "All Sections" : sec}
              </button>
            )
          )}
        </div>
      </div>

      {/* risk cards */}
      <div className="space-y-4 p-6">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <FaExclamationTriangle className="mx-auto mb-2 text-3xl text-[#c17829]" />
            No items for this filter.
          </div>
        ) : (
          displayed.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-lg"
            >
              {/* headline + severity */}
              <div className="mb-2 flex items-start justify-between gap-4">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <RiskLevel level={item.risk} />
              </div>

              {/* quote */}
              <blockquote className="mb-3 border-l-4 border-gray-300 pl-3 text-sm italic text-gray-700">
                “{item.quote}”
              </blockquote>

              {/* suggestion */}
              <div className="flex gap-2 rounded-md border border-[#c17829]/50 bg-[#c17829]/10 p-3 text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#c17829] text-white">
                  <FaInfoCircle size={14} />
                </span>
                <span className="text-[#a66224]">{item.recommendation}</span>
              </div>
            </div>
          ))
        )}

        {filtered.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 text-sm text-[#c17829] hover:underline"
          >
            {showAll ? "Show Less" : `Show ${filtered.length - 3} More`}
            <FaChevronDown
              className={`ml-1 inline-block transition-transform ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>
    </>
  );
}

/* ─────────────────── InitialSelectionArea ─────────────────── */
interface InitialSelectionAreaProps {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  reports: RiskHistoryItem[];
  selectedReportId: string | null;
  setSelectedReportId: React.Dispatch<React.SetStateAction<string | null>>;
  reportSelectOpen: boolean;
  setReportSelectOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAnalyzeNewFile: () => void;
  onAnalyzeExisting: () => void;
  isAnalyzing: boolean;
  error: string | null;
  tap: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function InitialSelectionArea({
  file,
  setFile,
  reports,
  selectedReportId,
  setSelectedReportId,
  reportSelectOpen,
  setReportSelectOpen,
  onAnalyzeNewFile,
  onAnalyzeExisting,
  isAnalyzing,
  error,
  tap,
  fileInputRef,
}: InitialSelectionAreaProps) {
  const selected = reports.find((r) => r.id === selectedReportId);

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
      {/* dropdown */}
      <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-gray-700">Analyze a previous report:</p>
        <div className="relative w-full">
          <button
            className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setReportSelectOpen(!reportSelectOpen)}
            disabled={isAnalyzing}
          >
            {selected?.filename ||
              selected?.report_filename ||
              "Choose Document"}
            <FaChevronDown
              className={`ml-2 transition-transform ${
                reportSelectOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {reportSelectOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
              >
                {selectedReportId && (
                  <li
                    className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setSelectedReportId(null);
                      setReportSelectOpen(false);
                    }}
                  >
                    Clear Selection
                  </li>
                )}
                {reports.length ? (
                  reports.map((r) => (
                    <li
                      key={r.id}
                      className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        selectedReportId === r.id
                          ? "bg-gray-100 font-semibold"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedReportId(r.id);
                        setReportSelectOpen(false);
                        setFile(null);
                      }}
                    >
                      <FaFileAlt className="text-[#c17829]" />
                      {r.filename || r.report_filename || "Unnamed Report"}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm italic text-gray-500">
                    No reports yet.
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {selectedReportId && (
          <motion.button
            {...tap}
            onClick={onAnalyzeExisting}
            disabled={isAnalyzing}
            className="flex items-center gap-2 rounded-md bg-[#c17829] px-6 py-2 text-white hover:bg-[#a66224] disabled:opacity-50"
          >
            {isAnalyzing && !file ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSearch />
            )}
            {isAnalyzing && !file ? "Loading..." : "View Report"}
          </motion.button>
        )}

        {error && selectedReportId && !file && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* drag-drop/upload */}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors ${
          isAnalyzing
            ? "cursor-not-allowed opacity-60"
            : "hover:border-[#c17829]"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (isAnalyzing) return;
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) {
            if (
              droppedFile.type === "application/pdf" ||
              droppedFile.type.includes("word")
            ) {
              setFile(droppedFile);
              setSelectedReportId(null);
            } else {
              alert("Invalid file type. Please upload PDF or DOCX files.");
            }
          }
        }}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          ref={fileInputRef}
          className="hidden"
          disabled={isAnalyzing}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setSelectedReportId(null);
            if (e.target) e.target.value = "";
          }}
        />

        {file ? (
          <UploadedFileCard
            file={file}
            reset={() => setFile(null)}
            onAnalyze={onAnalyzeNewFile}
            tap={tap}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          <>
            <FaCloudUploadAlt className="text-5xl text-gray-400" />
            <p className="mt-2 text-gray-700">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-400">Supported: PDF, DOCX</p>
          </>
        )}

        {isAnalyzing && file && <Spinner text="Analyzing your document…" />}
        {error && file && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

/* ─────────────────── main tool ─────────────────── */
function RiskAssessmentTool() {
  /* ------------- state & refs ------------- */
  const [file, setFile] = useState<File | null>(null);
  const [history, setHistory] = useState<RiskHistoryItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportSelectOpen, setReportSelectOpen] = useState(false);

  const [results, setResults] = useState<{
    id: string;
    riskItems: RiskItem[];
  } | null>(null);

  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [activeSection, setActiveSection] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const [showAllHistory, setShowAllHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tap = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  /* ------------- load history on mount ------------- */
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const h = await listRiskHistory();
      h.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(h);
    } catch (e) {
      console.error(e);
      setError("Failed to load risk assessment history.");
    }
  }

  /* ------------- mapping helper ------------- */
  const mapRisks = (raw: RiskItemBackend[]): RiskItem[] =>
    raw.map((r, idx) => ({
      id: idx + 1,
      title: r.risk_description,
      quote:
        (r as any).extracted_text_snippet ||
        (r as any).clause ||
        r.section ||
        "(no snippet)",
      section: r.section,
      risk: (r.severity || "Low").toLowerCase() as Severity,
      recommendation: r.recommendation ?? "No recommendation provided.",
    }));

  /* ------------- PDF builder ------------- */
  const buildPdfBlob = (items: RiskItem[], srcName?: string): Blob => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFontSize(18);
    doc.text(
      srcName
        ? `Risk Assessment Report for ${srcName}`
        : "Risk Assessment Report",
      40,
      50
    );
    autoTable(doc, {
      startY: 80,
      head: [["ID", "Section", "Risk", "Quote", "Recommendation"]],
      body: items.map((i) => [
        i.id.toString(),
        i.section,
        i.risk[0].toUpperCase() + i.risk.slice(1),
        i.quote,
        i.recommendation,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [193, 120, 41] },
      columnStyles: { 3: { cellWidth: 180 }, 4: { cellWidth: 180 } },
    });
    return doc.output("blob");
  };

  /* ------------- analyze new upload ------------- */
  const analyzeNewFile = async () => {
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    setSelectedReportId(null);
    try {
      const resp: RiskAnalysisResponse = await analyzeRiskFile(file);
      const items = mapRisks(resp.risks);
      setResults({ id: resp.id, riskItems: items });
      setCurrentFilename(file.name);
      setActiveSection("all");

      const pdfBlob = buildPdfBlob(items, file.name);
      const nice = file.name.replace(/\.[^.]+$/, "") + "_risk_report.pdf";
      await uploadRiskPdf(resp.id, pdfBlob, nice);

      loadHistory();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Risk analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ------------- open previous report ------------- */
  const openReport = async (id: string) => {
    setError(null);
    setIsAnalyzing(true);
    setFile(null);
    setSelectedReportId(id);
    try {
      const rep = await getRiskReport(id);
      setResults({ id: rep.id, riskItems: mapRisks(rep.risks as any) });
      const src = history.find((h) => h.id === id);
      setCurrentFilename(src?.filename ?? src?.report_filename ?? "Report");
      setActiveSection("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open report");
      setError("Failed to open report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ------------- delete helpers ------------- */
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeletingHistory(true);
    try {
      await deleteRiskReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      if (results?.id === pendingDeleteId) reset();
      setSelectedReportId(null);
    } catch (e: any) {
      alert(e.message || "Delete failed");
      setError("Failed to delete report.");
    } finally {
      setIsDeletingHistory(false);
      setPendingDeleteId(null);
    }
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setCurrentFilename(null);
    setActiveSection("all");
    setError(null);
    setSelectedReportId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ------------- derived values ------------- */
  const displayedHistory = showAllHistory ? history : history.slice(0, 3);
  const filtered = results
    ? results.riskItems.filter(
        (i) =>
          activeSection === "all" ||
          i.section.toLowerCase() === activeSection.toLowerCase()
      )
    : [];
  const counts = results
    ? results.riskItems.reduce(
        (acc, i) => ((acc[i.risk] = (acc[i.risk] || 0) + 1), acc),
        { high: 0, medium: 0, low: 0 } as Record<Severity, number>
      )
    : { high: 0, medium: 0, low: 0 };

  /* ------------- render UI ------------- */
  return (
    <div className="space-y-8 p-6">
      {/* header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#c17829] to-[var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[var(--accent-light)] p-3 text-[#c17829]">
            <FaShieldAlt size={22} />
          </span>
          <h1 className="font-serif text-2xl font-bold text-[var(--brand-dark)]">
            Risk Assessment Tool
          </h1>
        </div>
      </header>

      {/* main panel */}
      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <InitialSelectionArea
            file={file}
            setFile={setFile}
            reports={history}
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
            reportSelectOpen={reportSelectOpen}
            setReportSelectOpen={setReportSelectOpen}
            onAnalyzeNewFile={analyzeNewFile}
            onAnalyzeExisting={() =>
              selectedReportId && openReport(selectedReportId)
            }
            isAnalyzing={isAnalyzing}
            error={error}
            tap={tap}
            fileInputRef={fileInputRef}
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

      {/* history list (download has inner guard for TS) */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="mb-4 font-medium text-[var(--brand-dark)]">
          Previous Assessments
        </h2>
        {history.length === 0 ? (
          <p className="text-sm italic text-gray-500">No history yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {displayedHistory.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-col rounded-lg border border-[#c17829]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="mb-3 sm:mb-0">
                    <p className="flex items-center text-sm font-semibold text-gray-800">
                      <FaFileAlt className="mr-2 text-[#c17829]" />
                      {h.filename ?? h.report_filename ?? "Risk Report"}
                    </p>
                    <p className="ml-6 mt-1 text-xs text-gray-500 sm:ml-0 sm:pl-0">
                      {h.num_risks} risk(s)
                    </p>
                  </div>

                  <div className="flex gap-3 self-end sm:self-center">
                    <button
                      onClick={() => openReport(h.id)}
                      className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                      disabled={isAnalyzing || isDeletingHistory}
                    >
                      {isAnalyzing && selectedReportId === h.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaSearch />
                      )}
                      View
                    </button>

                    {h.report_doc_id && (
                      <button
                        onClick={() => {
                          if (h.report_doc_id) {
                            downloadRiskReport(
                              h.report_doc_id,
                              h.report_filename ?? "risk_report.pdf"
                            );
                          }
                        }}
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                        disabled={isAnalyzing || isDeletingHistory}
                      >
                        <FaDownload /> Download
                      </button>
                    )}

                    <button
                      onClick={() => setPendingDeleteId(h.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={isAnalyzing || isDeletingHistory}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {history.length > 3 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="mt-4 text-sm text-[#c17829] hover:underline"
              >
                {showAllHistory
                  ? "Show Less"
                  : `Show ${history.length - 3} More`}
                <FaChevronDown
                  className={`ml-1 inline-block transition-transform duration-200 ${
                    showAllHistory ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </>
        )}
      </section>

      {/* delete modal */}
      <AnimatePresence>
        {pendingDeleteId && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeletingHistory && setPendingDeleteId(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h4 className="text-lg font-semibold text-[var(--brand-dark)]">
                  Delete Risk Report
                </h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this risk assessment report?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    disabled={isDeletingHistory}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeletingHistory}
                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeletingHistory ? (
                      <FaSpinner className="mr-2 inline-block animate-spin" />
                    ) : null}
                    {isDeletingHistory ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RiskAssessmentTool;
