/*  src/views/pages/Dashboard/ComplianceChecker.tsx  */

import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import {
  FaClipboardCheck,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
  FaFilePdf,
  FaFileWord,
  FaExclamationCircle,
  FaInfoCircle,
  FaSpinner,
  FaDownload,
  FaChevronDown,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  uploadDocument,
  listDocuments,
  checkCompliance,
  downloadComplianceReportPdf,
  DocumentRecord,
  ComplianceReportResponse,
  ComplianceIssue,
  listComplianceHistory,
  deleteComplianceReport,
  getComplianceReport,
  ComplianceHistoryItem,
} from "../../../api";

/* ─────────────── local types ─────────────── */
interface DisplayAnalysisResult extends ComplianceReportResponse {
  overallStatus: "compliant" | "non-compliant" | "warning" | "unknown";
  complianceScore: number;
  analyzedFilename?: string;
}

/* ─────────────── constants ─────────────── */
const BRAND = { dark: "#1a202c" };
const ACCENT = { dark: "#c17829", light: "#ffe9d1" };
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

/* ─────────────── status badge ─────────────── */
const ComplianceStatus: React.FC<{ status: string }> = ({ status }) => {
  const displayStatus: "compliant" | "non-compliant" | "warning" | "unknown" =
    status.toLowerCase() === "ok"
      ? "compliant"
      : status.toLowerCase() === "issue found"
        ? "non-compliant"
        : status.toLowerCase() === "warning"
          ? "warning"
          : "unknown";

  const palette: Record<typeof displayStatus, string> = {
    compliant: "bg-green-100 text-green-800 border-green-200",
    "non-compliant": "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unknown: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const icons: Record<typeof displayStatus, React.ReactNode> = {
    compliant: <FaClipboardCheck className="mr-1" />,
    "non-compliant": <FaExclamationCircle className="mr-1" />,
    warning: <FaInfoCircle className="mr-1" />,
    unknown: <FaInfoCircle className="mr-1" />,
  };
  const labels: Record<typeof displayStatus, string> = {
    compliant: "Compliant",
    "non-compliant": "Non-Compliant",
    warning: "Warning",
    unknown: "Unknown Status",
  };

  return (
    <span
      className={`flex items-center px-2 py-1 text-xs font-medium rounded border ${palette[displayStatus]}`}
    >
      {icons[displayStatus]}
      {labels[displayStatus]}
    </span>
  );
};

/* ═════════════════════════ COMPONENT ═════════════════════════ */
const ComplianceChecker: React.FC = () => {
  /* uploaded docs list */
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);

  /* new upload */
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* analysis state */
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DisplayAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* history of stored reports */
  const [history, setHistory] = useState<ComplianceHistoryItem[]>([]);

  /* ───── initial data load ───── */
  useEffect(() => {
    fetchUploadedDocuments();
    loadHistory();
  }, []);

  /* keep displayed filename in results up‑to‑date */
  useEffect(() => {
    if (selectedDocId && uploadedDocs.length) {
      const doc = uploadedDocs.find(d => d._id === selectedDocId);
      setResults(prev =>
        prev ? { ...prev, analyzedFilename: doc?.filename } : null,
      );
    } else if (fileToUpload) {
      setResults(prev =>
        prev ? { ...prev, analyzedFilename: fileToUpload.name } : null,
      );
    } else {
      setResults(prev =>
        prev ? { ...prev, analyzedFilename: undefined } : null,
      );
    }
  }, [selectedDocId, fileToUpload, uploadedDocs]);

  /* ─────────────────────────────────── helpers ─────────────────────────────────── */

  async function fetchUploadedDocuments() {
    setFetchingDocs(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
      /* clear stale selection */
      if (selectedDocId && !docs.find(d => d._id === selectedDocId)) {
        setSelectedDocId(null);
        setResults(null);
      }
    } catch (e: any) {
      setError("Failed to load uploaded documents.");
      console.error(e);
    } finally {
      setFetchingDocs(false);
    }
  }

  /* fetch stored history */
  async function loadHistory() {
    try {
      const h = await listComplianceHistory();
      setHistory(h);
    } catch (e) {
      console.error("Compliance history load failed", e);
    }
  }

  /* derive overallStatus + score from issue list (shared) */
  function deriveStatusAndScore(
    issues: ComplianceIssue[],
  ): { overallStatus: DisplayAnalysisResult["overallStatus"]; complianceScore: number } {
    let overall: DisplayAnalysisResult["overallStatus"] = "compliant";
    let nonCompliant = 0;
    let warning = 0;
    let ok = 0;

    issues.forEach(i => {
      const st = i.status.toLowerCase();
      if (st === "issue found") {
        overall = "non-compliant";
        nonCompliant++;
      } else if (st === "warning") {
        if (overall !== "non-compliant") overall = "warning";
        warning++;
      } else if (st === "ok") {
        ok++;
      }
    });

    if (
      issues.length > 0 &&
      overall === "compliant" &&
      nonCompliant === 0 &&
      warning === 0 &&
      ok !== issues.length
    ) {
      overall = "unknown";
    } else if (issues.length === 0) {
      overall = "compliant";
    }

    const score =
      nonCompliant + warning > 0
        ? Math.max(0, 100 - (nonCompliant * 15 + warning * 5))
        : 100;

    return { overallStatus: overall, complianceScore: score };
  }

  /* open a stored report from history */
  async function openReport(id: string) {
    try {
      const rep = await getComplianceReport(id);
      const { overallStatus, complianceScore } =
        deriveStatusAndScore(rep.issues);

      setResults({
        ...rep,
        overallStatus,
        complianceScore,
        analyzedFilename: rep.report_filename || rep.report_id,
      } as DisplayAnalysisResult);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open report");
    }
  }

  /* delete a stored report */
  async function removeReport(id: string) {
    if (!window.confirm("Delete this compliance report?")) return;
    try {
      await deleteComplianceReport(id);
      setHistory(h => h.filter(r => r.id !== id));
      setResults(prev => (prev && prev.report_id === id ? null : prev));
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  }

  /* icon helper */
  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FaFilePdf className="text-red-600" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-600" />;
      case "txt":
        return <FaFileAlt className="text-gray-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  /* ─────────────────────────── fresh analysis ─────────────────────────── */
  const handleAnalyze = async () => {
    let docIdToAnalyze: string | null = null;
    let uploadedFilename: string | undefined;

    setAnalyzing(true);
    setResults(null);
    setError(null);

    /* upload new file if provided */
    if (fileToUpload) {
      try {
        const uploadRes = await uploadDocument(fileToUpload);
        docIdToAnalyze = uploadRes.doc_id;
        uploadedFilename = fileToUpload.name;
        fetchUploadedDocuments();
      } catch (e: any) {
        setError(`File upload failed: ${e.message || "Unknown error"}`);
        setAnalyzing(false);
        return;
      }
    } else if (selectedDocId) {
      docIdToAnalyze = selectedDocId;
      uploadedFilename =
        uploadedDocs.find(d => d._id === selectedDocId)?.filename ||
        "Unknown Document";
    } else {
      setError("Please select or upload a document to analyze.");
      setAnalyzing(false);
      return;
    }

    try {
      const report = await checkCompliance({ doc_id: docIdToAnalyze! });
      const { overallStatus, complianceScore } =
        deriveStatusAndScore(report.issues);

      setResults({
        ...report,
        overallStatus,
        complianceScore,
        analyzedFilename: uploadedFilename,
      } as DisplayAnalysisResult);

      /* refresh history */
      loadHistory();
    } catch (e: any) {
      setError(
        `Compliance check failed: ${e.message || "Unknown error"}`,
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* download currently displayed report */
  const handleDownloadReport = async () => {
    if (!results?.report_id) {
      setError("No report available to download.");
      return;
    }
    try {
      await downloadComplianceReportPdf(results.report_id);
    } catch (e: any) {
      setError(`Download failed: ${e.message}`);
    }
  };

  /* selection helpers */
  const handleDocSelection = (docId: string | null) => {
    setSelectedDocId(docId);
    setFileToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDocSelectOpen(false);
    setResults(null);
    setError(null);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] || null;
    setFileToUpload(f);
    setSelectedDocId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setResults(null);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFileChange(e as any);
  };

  /* full reset */
  const reset = () => {
    setSelectedDocId(null);
    setFileToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setResults(null);
    setError(null);
    fetchUploadedDocuments();
    loadHistory();
  };

  /* disable analyse button? */
  const isAnalyzeDisabled =
    (!selectedDocId && !fileToUpload) || analyzing || fetchingDocs;

  /* counts for summary cards */
  const resultCounts = results
    ? results.issues.reduce(
      (acc, { status }) => {
        const key: "compliant" | "non-compliant" | "warning" | "unknown" =
          status.toLowerCase() === "ok"
            ? "compliant"
            : status.toLowerCase() === "issue found"
              ? "non-compliant"
              : status.toLowerCase() === "warning"
                ? "warning"
                : "unknown";
        acc[key]++;
        return acc;
      },
      { compliant: 0, "non-compliant": 0, warning: 0, unknown: 0 },
    )
    : { compliant: 0, "non-compliant": 0, warning: 0, unknown: 0 };

  /* ─────────────────────────────────── render ─────────────────────────────────── */

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
            <FaClipboardCheck size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[color:var(--brand-dark)]">
              Compliance Checker
            </h1>
            <p className="text-gray-600">International Law — Saudi Arabia</p>
          </div>
        </div>
      </header>

      {/* History list */}
      <section className="rounded-xl border bg-white shadow-sm p-6 mb-8">
        <h2 className="font-medium text-[color:var(--brand-dark)] mb-4">
          Previous Compliance Reports
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
                    {h.report_filename || "Compliance report"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(h.created_at).toLocaleString()} • {h.num_issues} issues
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openReport(h.id)}
                    className="flex items-center gap-1 text-sm text-[rgb(193,120,41)] hover:underline"
                  >
                    <FaSearch /> View
                  </button>

                  {h.report_doc_id && (
                    <button
                      onClick={() => downloadComplianceReportPdf(h.id)}
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

      {/* Main panel */}
      <section className="rounded-xl border bg-white shadow-sm">
        {/* If no result yet -> selection / upload UI */}
        {!results ? (
          <SelectArea
            /* props */
            isAnalyzeDisabled={isAnalyzeDisabled}
            analyzing={analyzing}
            fetchingDocs={fetchingDocs}
            uploadedDocs={uploadedDocs}
            selectedDocId={selectedDocId}
            handleDocSelection={handleDocSelection}
            docSelectOpen={docSelectOpen}
            setDocSelectOpen={setDocSelectOpen}
            getFileIcon={getFileIcon}
            fileToUpload={fileToUpload}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            onDrop={onDrop}
            handleAnalyze={handleAnalyze}
            error={error}
          />
        ) : (
          /* else -> result display */
          <ResultView
            results={results}
            resultCounts={resultCounts}
            ComplianceStatus={ComplianceStatus}
            getFileIcon={getFileIcon}
            handleDownloadReport={handleDownloadReport}
            reset={reset}
          />
        )}
      </section>
    </div>
  );
};

/* ───────────────────────────────────────────────── sub‑components ─────────────────────────────────────────────── */

interface SelectProps {
  isAnalyzeDisabled: boolean;
  analyzing: boolean;
  fetchingDocs: boolean;
  uploadedDocs: DocumentRecord[];
  selectedDocId: string | null;
  handleDocSelection: (id: string | null) => void;
  docSelectOpen: boolean;
  setDocSelectOpen: (v: boolean) => void;
  getFileIcon: (f: string) => JSX.Element;
  fileToUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  handleAnalyze: () => void;
  error: string | null;
}

const SelectArea: React.FC<SelectProps> = ({
  isAnalyzeDisabled,
  analyzing,
  fetchingDocs,
  uploadedDocs,
  selectedDocId,
  handleDocSelection,
  docSelectOpen,
  setDocSelectOpen,
  getFileIcon,
  fileToUpload,
  fileInputRef,
  onFileChange,
  onDrop,
  handleAnalyze,
  error,
}) => {
  const selectedDoc = uploadedDocs.find(d => d._id === selectedDocId);
  const displayedFilename = selectedDoc
    ? selectedDoc.filename
    : fileToUpload
      ? fileToUpload.name
      : "No file selected";

  if (analyzing || fetchingDocs) {
    return (
      <div className="mt-6 text-center text-gray-700">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
        <p className="mt-2">
          {analyzing ? "Analyzing…" : "Loading documents…"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Existing docs selector */}
        <div className="flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-700 mb-2">Analyze a previously uploaded document:</p>
          <div className="relative w-full">
            <button
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)] focus:border-[color:var(--accent-dark)] disabled:opacity-50"
              onClick={() => setDocSelectOpen(!docSelectOpen)}
              disabled={analyzing || fetchingDocs}
            >
              {selectedDoc ? displayedFilename : "Choose Document"}
              <FaChevronDown
                className={`ml-2 transition-transform ${docSelectOpen ? "rotate-180" : "rotate-0"
                  }`}
              />
            </button>

            <AnimatePresence>
              {docSelectOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 overflow-auto"
                >
                  {selectedDocId && (
                    <li
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleDocSelection(null)}
                    >
                      Clear Selection
                    </li>
                  )}
                  {uploadedDocs.length > 0 ? (
                    uploadedDocs.map(doc => (
                      <li
                        key={doc._id}
                        className={`px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${selectedDocId === doc._id
                            ? "bg-gray-100 font-semibold"
                            : ""
                          }`}
                        onClick={() => handleDocSelection(doc._id)}
                      >
                        {getFileIcon(doc.filename)} {doc.filename}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-gray-500 italic">
                      No documents uploaded yet.
                    </li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {selectedDocId && (
            <div className="flex justify-center mt-4">
              <motion.button
                onClick={handleAnalyze}
                disabled={isAnalyzeDisabled}
                className={`flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2 text-white ${isAnalyzeDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[rgb(173,108,37)]"
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {analyzing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSearch />
                )}
                {analyzing ? "Analyzing..." : "Analyze Selected"}
              </motion.button>
            </div>
          )}
        </div>

        {/* Drag‑drop upload */}
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors hover:border-[color:var(--accent-dark)] disabled:opacity-50"
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          aria-disabled={isAnalyzeDisabled}
        >
          <input
            id="upload"
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={onFileChange}
            ref={fileInputRef}
            disabled={isAnalyzeDisabled}
          />

          {fileToUpload ? (
            <>
              {getFileIcon(fileToUpload.name)}
              <p className="mt-2 font-medium text-gray-700">
                {fileToUpload.name}
              </p>
              <p className="text-sm text-gray-500">
                {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <FaCloudUploadAlt className="text-5xl text-gray-400" />
              <p className="mt-2 text-gray-700">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-gray-400">
                Supported: PDF, DOCX, DOC, TXT
              </p>
            </>
          )}
        </div>
      </div>

      {fileToUpload && !selectedDocId && (
        <div className="flex justify-center mt-4">
          <motion.button
            onClick={handleAnalyze}
            disabled={isAnalyzeDisabled}
            className={`flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2 text-white ${isAnalyzeDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[rgb(173,108,37)]"
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {analyzing ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSearch />
            )}
            {analyzing ? "Analyzing..." : "Analyze Uploaded File"}
          </motion.button>
        </div>
      )}

      {error && !fetchingDocs && !analyzing && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface ResultProps {
  results: DisplayAnalysisResult;
  resultCounts: { [k in "compliant" | "non-compliant" | "warning" | "unknown"]: number };
  ComplianceStatus: React.FC<{ status: string }>;
  getFileIcon: (f: string) => JSX.Element;
  handleDownloadReport: () => void;
  reset: () => void;
}

const ResultView: React.FC<ResultProps> = ({
  results,
  resultCounts,
  ComplianceStatus,
  getFileIcon,
  handleDownloadReport,
  reset,
}) => (
  <>
    <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {results.analyzedFilename ? (
          getFileIcon(results.analyzedFilename)
        ) : (
          <FaFileAlt className="text-2xl text-gray-500" />
        )}
        <div>
          <h3 className="font-medium text-gray-800">
            {results.analyzedFilename}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Report ID: {results.report_id}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Overall Status</p>
          <ComplianceStatus status={results.overallStatus} />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Score</p>
          <p className="text-lg font-bold text-gray-800">
            {results.complianceScore}/100
          </p>
        </div>
        <motion.button
          onClick={handleDownloadReport}
          disabled={!results.report_id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-sm text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaDownload /> Download PDF
        </motion.button>
        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 rounded-md bg-[rgb(193,120,41)] px-4 py-2 text-sm text-white hover:bg-[rgb(173,108,37)]"
        >
          Analyze Another
        </motion.button>
      </div>
    </div>

    {/* summary cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      {(["compliant", "non-compliant", "warning"] as const).map(lvl => (
        <div
          key={lvl}
          className="rounded-lg border bg-gray-50 p-4 text-center"
          style={{ boxShadow: SHADOW }}
        >
          <p className="text-sm text-gray-500 mb-1">
            {lvl[0].toUpperCase() + lvl.slice(1)} Items
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {resultCounts[lvl]}
          </p>
        </div>
      ))}
    </div>

    {/* detailed list */}
    <div className="space-y-4 p-6">
      {results.issues.map((item, idx) => (
        <div
          key={`${results.report_id}-${item.rule_id}-${idx}`}
          className="rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-gray-800">
                {item.description}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2">
                  Rule ID: {item.rule_id}
                </span>
              </p>
            </div>
            <ComplianceStatus status={item.status} />
          </div>
          {item.status.toLowerCase() !== "ok" && (
            <div className="flex flex-col md:flex-row items-start gap-2 rounded-md bg-[color:var(--accent-light)]/50 p-3">
              <FaInfoCircle className="text-[color:var(--accent-dark)] mt-1" />
              <div className="text-[color:var(--accent-dark)] text-sm space-y-2">
                <p>{item.description}</p>
                {item.extracted_text_snippet && (
                  <p className="italic text-gray-700 bg-white p-2 rounded-md border">
                    "{item.extracted_text_snippet}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {results.issues.length === 0 && (
        <div className="text-center text-gray-600 italic">
          No compliance issues found in the document.
        </div>
      )}
    </div>
  </>
);

export default ComplianceChecker;
