// src/views/pages/Dashboard/RiskAssessmentTool.tsx
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

const Spinner: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-8 text-center text-gray-700">
    <div className="h-8 w-8 mx-auto border-b-2 border-[#c17829] rounded-full animate-spin" />
    <p className="mt-3">{text}</p>
  </div>
);

/* ═════════════════ component ═════════════════ */
const RiskAssessmentTool: React.FC = () => {
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
    } catch (err) {
      console.error("Failed to load risk history:", err);
      setError("Failed to load risk assessment history.");
    }
  }

  const mapRisks = (raw: RiskItemBackend[]): RiskItem[] =>
    raw.map((r, idx) => ({
      id: idx + 1,
      section: r.section,
      clause: (r as any).clause ?? r.section, // Use clause if available, fallback to section
      issue: r.risk_description,
      risk: (r.severity || "Low").toLowerCase() as Severity,
      recommendation: r.recommendation ?? "No recommendation provided.",
    }));

  const analyzeNewFile = async () => {
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    setSelectedReportId(null); // Deselect any history item
    try {
      const resp: RiskAnalysisResponse = await analyzeRiskFile(file);
      const items = mapRisks(resp.risks);
      setResults({ id: resp.id, riskItems: items });
      setCurrentFilename(file.name);
      setActiveSection("all");
      const pdfBlob = buildPdfBlob(items, file.name);
      const niceName = file.name.replace(/\.[^.]+$/, "") + "_risk_report.pdf";
      await uploadRiskPdf(resp.id, pdfBlob, niceName);
      loadHistory(); // Refresh history after upload
    } catch (err: any) {
      console.error("Risk analysis failed:", err);
      setError(err.message || "Risk analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeExistingReport = () => {
    if (!selectedReportId) return;
    const item = history.find((r) => r.id === selectedReportId);
    if (item) {
      openReport(item);
    }
  };

  const openReport = async (hItem: RiskHistoryItem) => {
    setError(null);
    setIsAnalyzing(true); // Indicate loading previous report
    setFile(null); // Clear any selected new file
    setSelectedReportId(hItem.id); // Select the history item
    try {
      const rep = await getRiskReport(hItem.id);
      setResults({ id: rep.id, riskItems: mapRisks(rep.risks as any) });
      setCurrentFilename(hItem.filename ?? hItem.report_filename ?? "Report");
      setActiveSection("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      console.error("Failed to open report:", e);
      alert(e.message || "Failed to open report");
      setError("Failed to open report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeletingHistory(true);
    try {
      await deleteRiskReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      if (results?.id === pendingDeleteId) reset(); // Reset if currently viewing the deleted report
      setSelectedReportId(null); // Deselect if the deleted one was selected in dropdown
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(err.message || "Delete failed");
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
    setSelectedReportId(null); // Clear selected history item
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
  };

  const buildPdfBlob = (items: RiskItem[], originalFilename?: string): Blob => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFontSize(18);
    const reportTitle = originalFilename
      ? `Risk Assessment Report for ${originalFilename}`
      : "Risk Assessment Report";
    doc.text(reportTitle, 40, 50);
    autoTable(doc, {
      startY: 80,
      head: [["ID", "Section", "Clause", "Issue", "Risk", "Recommendation"]],
      body: items.map((i) => [
        i.id.toString(),
        i.section,
        i.clause,
        i.issue,
        i.risk[0].toUpperCase() + i.risk.slice(1),
        i.recommendation,
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [193, 120, 41] }, // Custom header color
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 70 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 50 },
        5: { cellWidth: "auto" },
      },
    });
    return doc.output("blob");
  };

  const displayedHistory = showAllHistory ? history : history.slice(0, 3);
  const filteredResults = results
    ? results.riskItems.filter(
        (i) =>
          activeSection === "all" ||
          i.section.toLowerCase() === activeSection.toLowerCase()
      )
    : [];
  const counts: Record<Severity, number> = results
    ? results.riskItems.reduce(
        (acc, i) => ((acc[i.risk] = (acc[i.risk] || 0) + 1), acc),
        { high: 0, medium: 0, low: 0 } as Record<Severity, number>
      )
    : { high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-8 p-6">
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#c17829] to-[var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[var(--accent-light)] p-3 text-[#c17829]">
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

      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <InitialSelectionArea
            file={file}
            setFile={setFile}
            reports={history} // Pass history for dropdown
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
            reportSelectOpen={reportSelectOpen}
            setReportSelectOpen={setReportSelectOpen}
            onAnalyzeNewFile={analyzeNewFile}
            onAnalyzeExisting={analyzeExistingReport}
            isAnalyzing={isAnalyzing}
            error={error}
            tap={tap}
            fileInputRef={fileInputRef}
          />
        ) : (
          <ResultPane
            results={results}
            counts={counts}
            filtered={filteredResults}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            reset={reset}
            filename={currentFilename}
            tap={tap}
          />
        )}
      </section>

      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="font-medium text-[var(--brand-dark)] mb-4">
          Previous Assessments
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No history yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {displayedHistory.map((hItem) => (
                <li
                  key={hItem.id}
                  className="rounded-lg border border-[#c17829]/30 bg-white shadow-sm p-4 flex flex-col sm:flex-row justify-between sm:items-center hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3 sm:mb-0">
                    <p className="font-semibold flex items-center text-sm text-gray-800">
                      <FaFileAlt className="mr-2 text-[#c17829]" />
                      {hItem.filename ?? hItem.report_filename ?? "Risk Report"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 ml-6 sm:ml-0 pl-6 sm:pl-0">
                      {hItem.num_risks} risk(s)
                    </p>
                  </div>
                  <div className="flex gap-3 self-end sm:self-center">
                    <button
                      onClick={() => openReport(hItem)}
                      className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline"
                      disabled={isAnalyzing || isDeletingHistory}
                    >
                      {isAnalyzing && selectedReportId === hItem.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaSearch />
                      )}
                      View
                    </button>
                    {hItem.report_doc_id && (
                      <button
                        onClick={() =>
                          downloadRiskReport(
                            hItem.report_doc_id as string,
                            hItem.report_filename ?? "risk_report.pdf"
                          )
                        }
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline"
                        disabled={isAnalyzing || isDeletingHistory}
                      >
                        <FaDownload /> Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRequest(hItem.id)}
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
                  className={`inline-block ml-1 transition-transform duration-200 ${
                    showAllHistory ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </>
        )}
      </section>

      <AnimatePresence>
        {pendingDeleteId && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
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
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeletingHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeletingHistory ? (
                      <FaSpinner className="animate-spin mr-2 inline-block" />
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
};

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
  tap: any; // Framer motion tap props
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const InitialSelectionArea: React.FC<InitialSelectionAreaProps> = ({
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
}) => {
  const selected = reports.find((r) => r.id === selectedReportId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Previous reports selector */}
      <div className="flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-gray-700 mb-2">Analyze a previous report:</p>
        <div className="relative w-full">
          <button
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setReportSelectOpen(!reportSelectOpen)}
            disabled={isAnalyzing}
          >
            {selected?.filename ||
              selected?.report_filename ||
              "Choose Document"}
            <FaChevronDown
              className={`ml-2 transition-transform ${
                reportSelectOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
          <AnimatePresence>
            {reportSelectOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 overflow-auto"
              >
                {selectedReportId && (
                  <li
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedReportId(null);
                      setReportSelectOpen(false);
                    }}
                  >
                    Clear Selection
                  </li>
                )}
                {reports.length > 0 ? (
                  reports.map((r) => (
                    <li
                      key={r.id}
                      className={`px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${
                        selectedReportId === r.id
                          ? "bg-gray-100 font-semibold"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedReportId(r.id);
                        setReportSelectOpen(false);
                        setFile(null);
                      }} // Clear file when selecting report
                    >
                      <FaFileAlt className="text-[#c17829]" />{" "}
                      {r.filename || r.report_filename || "Unnamed Report"}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm text-gray-500 italic">
                    No reports yet.
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {selectedReportId && (
          <motion.button
            onClick={onAnalyzeExisting}
            disabled={isAnalyzing}
            className="flex items-center gap-2 rounded-md bg-[#c17829] px-6 py-2 text-white hover:bg-[#a66224] disabled:opacity-50"
            {...tap}
          >
            {isAnalyzing && !file ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSearch />
            )}{" "}
            {isAnalyzing && !file ? "Loading..." : "View Report"}
          </motion.button>
        )}
        {error && selectedReportId && !file && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Drag‑drop upload */}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors ${
          isAnalyzing
            ? "opacity-60 cursor-not-allowed"
            : "hover:border-[#c17829]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
        }}
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
        onClick={() => {
          if (!isAnalyzing) fileInputRef.current?.click();
        }}
      >
        <input
          type="file"
          accept=".pdf,.docx" // Added .docx as supported
          className="hidden"
          ref={fileInputRef}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0] ?? null;
            setFile(selectedFile);
            setSelectedReportId(null);
            if (e.target) e.target.value = "";
          }}
          disabled={isAnalyzing}
        />
        {file ? (
          <UploadedFileCard
            file={file}
            reset={() => setFile(null)} // Reset only the file here
            onAnalyze={onAnalyzeNewFile}
            tap={tap}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          <>
            <FaCloudUploadAlt className="text-5xl text-gray-400" />
            <p className="mt-2 text-gray-700">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-400">Supported: PDF, DOCX</p>{" "}
            {/* Updated supported formats */}
          </>
        )}
        {isAnalyzing && file && <Spinner text="Analyzing your document…" />}
        {error && file && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

interface UploadedFileCardProps {
  file: File;
  reset: () => void;
  onAnalyze: () => void;
  tap: any;
  isAnalyzing: boolean;
}

const UploadedFileCard: React.FC<UploadedFileCardProps> = ({
  file,
  reset,
  onAnalyze,
  tap,
  isAnalyzing,
}) => (
  <div>
    <FaFileAlt className="mx-auto text-4xl text-[#c17829]" />
    <p className="mt-3 font-medium text-gray-700">{file.name}</p>
    <p className="text-sm text-gray-500">
      {(file.size / 1024 / 1024).toFixed(2)} MB
    </p>
    {isAnalyzing ? null : ( // Spinner is shown in the parent (InitialSelectionArea) now
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="flex items-center gap-1 bg-gray-100 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
        >
          <FaTrash /> Remove
        </button>
        <motion.button
          {...tap}
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze();
          }}
          className="flex items-center gap-1 bg-[#c17829] text-white rounded-md px-4 py-2 text-sm hover:bg-[#a66224]"
        >
          <FaSearch /> Analyze
        </motion.button>
      </div>
    )}
  </div>
);

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

const ResultPane: React.FC<ResultPaneProps> = ({
  results,
  counts,
  filtered,
  activeSection,
  setActiveSection,
  reset,
  filename,
  tap,
}) => {
  const [showAllRiskItems, setShowAllRiskItems] = useState(false);

  useEffect(() => {
    setShowAllRiskItems(false); // Reset show all when filtered items change (e.g., section filter changes)
  }, [filtered]);

  const displayedRiskItems = showAllRiskItems ? filtered : filtered.slice(0, 3);

  return (
    <>
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FaFileAlt className="text-2xl text-[#c17829]" />
          <div>
            <h3 className="font-medium text-gray-800">
              {filename || "Report"}
            </h3>
            {/* Date display removed as per previous version changes */}
          </div>
        </div>
        <motion.button
          {...tap}
          onClick={reset}
          className="min-w-[140px] flex justify-center bg-[#c17829] text-white rounded-md px-4 py-2 text-sm hover:bg-[#a66224]"
        >
          Analyze Another
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
        {Object.entries(counts).map(([lvl, count]) => (
          <div
            key={lvl}
            className="rounded-lg border bg-white p-4 text-center"
            style={{ boxShadow: SHADOW }}
          >
            <p className="text-sm text-gray-500 mb-1">
              {(lvl as string)[0].toUpperCase() + (lvl as string).slice(1)} Risk
              Items
            </p>
            <p className="text-2xl font-bold text-gray-800">{count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto px-6">
        <div className="flex flex-wrap gap-2 border-b pb-4 pt-2">
          {["all", ...new Set(results?.riskItems.map((i) => i.section))].map(
            (sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  activeSection.toLowerCase() === sec.toLowerCase()
                    ? "bg-[#c17829] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:bg-gray-200"
                }`}
              >
                {sec === "all" ? "All Sections" : sec}
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <FaExclamationTriangle className="mx-auto mb-2 text-3xl text-[#c17829]" />
            No items for this filter.
          </div>
        ) : (
          displayedRiskItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border p-4 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-grow">
                  <p className="font-medium text-gray-800">
                    {item.section}: {item.clause}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{item.issue}</p>
                </div>
                <RiskLevel level={item.risk} />
              </div>
              <div className="flex flex-col md:flex-row gap-2 rounded-md border border-[#c17829]/50 bg-[#c17829]/10 p-3 text-sm">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#c17829] text-white">
                  <FaInfoCircle size={14} />
                </span>
                <span className="text-[#a66224]">{item.recommendation}</span>
              </div>
            </div>
          ))
        )}
        {filtered.length > 3 && (
          <button
            onClick={() => setShowAllRiskItems(!showAllRiskItems)}
            className="mt-2 text-sm text-[#c17829] hover:underline"
          >
            {showAllRiskItems
              ? "Show Less"
              : `Show ${filtered.length - 3} More`}
            <FaChevronDown
              className={`inline-block ml-1 transition-transform duration-200 ${
                showAllRiskItems ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>
    </>
  );
};

export default RiskAssessmentTool;
