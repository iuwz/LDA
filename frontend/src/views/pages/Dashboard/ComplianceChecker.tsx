/*  src/views/pages/Dashboard/ComplianceChecker.tsx  */

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
} from "react";
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

/* ───────────── local types ───────────── */
interface DisplayAnalysisResult extends ComplianceReportResponse {
  overallStatus: "compliant" | "non-compliant" | "warning" | "unknown";
  complianceScore: number;
  analyzedFilename?: string;
}

/* ───────────── constants ───────────── */
const BRAND = { dark: "#1a202c" };
const ACCENT = { dark: "#c17829", light: "#ffe9d1" };
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

/* ───────────── status badge ───────────── */
const ComplianceStatus: React.FC<{ status: string }> = ({ status }) => {
  const displayStatus: DisplayAnalysisResult["overallStatus"] =
    status.toLowerCase() === "ok"
      ? "compliant"
      : status.toLowerCase() === "issue found"
        ? "non-compliant"
        : status.toLowerCase() === "warning"
          ? "warning"
          : "unknown";

  const palette: Record<DisplayAnalysisResult["overallStatus"], string> = {
    compliant: "bg-green-100 text-green-800 border-green-200",
    "non-compliant": "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unknown: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const icons = {
    compliant: <FaClipboardCheck className="mr-1" />,
    "non-compliant": <FaExclamationCircle className="mr-1" />,
    warning: <FaInfoCircle className="mr-1" />,
    unknown: <FaInfoCircle className="mr-1" />,
  };
  const labels = {
    compliant: "Compliant",
    "non-compliant": "Non‑Compliant",
    warning: "Warning",
    unknown: "Unknown",
  };

  return (
    <span
      className={`flex items-center px-2 py-1 text-xs font-medium rounded border ${palette[displayStatus]}`}
    >
      {icons[displayStatus as keyof typeof icons]}
      {labels[displayStatus as keyof typeof labels]}
    </span>
  );
};

/* ═════════════════════════ COMPONENT ═════════════════════════ */
const ComplianceChecker: React.FC = () => {
  /* uploaded docs */
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);

  /* upload */
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* analysis */
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DisplayAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* history */
  const [history, setHistory] = useState<ComplianceHistoryItem[]>([]);

  /* init load */
  useEffect(() => {
    fetchUploadedDocuments();
    loadHistory();
  }, []);

  /* keep filename label in sync */
  useEffect(() => {
    if (results) {
      if (selectedDocId) {
        const doc = uploadedDocs.find(d => d._id === selectedDocId);
        setResults({ ...results, analyzedFilename: doc?.filename });
      } else if (fileToUpload) {
        setResults({ ...results, analyzedFilename: fileToUpload.name });
      }
    }
  }, [selectedDocId, fileToUpload, uploadedDocs]);

  /* ───────────────── helpers ───────────────── */

  async function fetchUploadedDocuments() {
    setFetchingDocs(true);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
      if (selectedDocId && !docs.find(d => d._id === selectedDocId)) {
        setSelectedDocId(null);
      }
    } catch (e) {
      setError("Failed to load uploaded documents.");
    } finally {
      setFetchingDocs(false);
    }
  }

  async function loadHistory() {
    try {
      setHistory(await listComplianceHistory());
    } catch {
      /* ignore */
    }
  }

  function deriveStatusAndScore(issues: ComplianceIssue[]) {
    const tally = { bad: 0, warn: 0, unk: 0, ok: 0 };
    issues.forEach(({ status }) => {
      const s = status.toLowerCase();
      if (s === "issue found") tally.bad++;
      else if (s === "warning") tally.warn++;
      else if (s === "ok") tally.ok++;
      else tally.unk++;
    });

    let overall: DisplayAnalysisResult["overallStatus"] = "compliant";
    if (tally.bad) overall = "non-compliant";
    else if (tally.warn) overall = "warning";
    else if (tally.unk) overall = "unknown";

    const score = Math.max(
      0,
      100 - (tally.bad * 20 + tally.warn * 10 + tally.unk * 5)
    );
    return { overallStatus: overall, complianceScore: score };
  }

  /* open stored report */
  async function openReport(id: string) {
    try {
      const rep = await getComplianceReport(id);
      const backendScore =
        typeof (rep as any).compliance_score === "number"
          ? (rep as any).compliance_score
          : null;
      const { overallStatus, complianceScore } = deriveStatusAndScore(
        rep.issues
      );
      setResults({
        ...rep,
        overallStatus,
        complianceScore: backendScore ?? complianceScore,
        analyzedFilename: rep.report_filename || rep.report_id,
      } as DisplayAnalysisResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open report");
    }
  }

  async function removeReport(id: string) {
    if (!window.confirm("Delete this compliance report?")) return;
    try {
      await deleteComplianceReport(id);
      setHistory(h => h.filter(r => r.id !== id));
      if (results?.report_id === id) setResults(null);
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext === "pdf"
      ? <FaFilePdf className="text-red-600" />
      : ext === "doc" || ext === "docx"
        ? <FaFileWord className="text-blue-600" />
        : <FaFileAlt className="text-gray-500" />;
  };

  /* fresh analysis */
  const handleAnalyze = async () => {
    let docId: string | null = null;
    let filename: string | undefined;

    setAnalyzing(true);
    setError(null);

    try {
      if (fileToUpload) {
        const { doc_id } = await uploadDocument(fileToUpload);
        docId = doc_id;
        filename = fileToUpload.name;
        fetchUploadedDocuments();
      } else if (selectedDocId) {
        docId = selectedDocId;
        filename = uploadedDocs.find(d => d._id === selectedDocId)?.filename;
      } else {
        setError("Please select or upload a document.");
        return;
      }

      const report = await checkCompliance({ doc_id: docId });
      const backendScore =
        typeof (report as any).compliance_score === "number"
          ? (report as any).compliance_score
          : null;
      const { overallStatus, complianceScore } = deriveStatusAndScore(
        report.issues
      );

      setResults({
        ...report,
        overallStatus,
        complianceScore: backendScore ?? complianceScore,
        analyzedFilename: filename,
      } as DisplayAnalysisResult);
      loadHistory();
    } catch (e: any) {
      setError(`Compliance check failed: ${e.message || "Unknown error"}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadReport = () =>
    results && downloadComplianceReportPdf(results.report_id);

  const handleDocSelection = (id: string | null) => {
    setSelectedDocId(id);
    setFileToUpload(null);
    fileInputRef.current && (fileInputRef.current.value = "");
    setResults(null);
    setError(null);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFileToUpload(e.target.files?.[0] || null);
    setSelectedDocId(null);
    setResults(null);
  };

  const reset = () => {
    setSelectedDocId(null);
    setFileToUpload(null);
    fileInputRef.current && (fileInputRef.current.value = "");
    setResults(null);
    setError(null);
  };

  const isAnalyzeDisabled =
    (!selectedDocId && !fileToUpload) || analyzing || fetchingDocs;
  const isFileInputDisabled = analyzing || fetchingDocs;

  /* count buckets */
  const resultCounts = results
    ? results.issues.reduce(
      (acc, { status }) => {
        const k =
          status.toLowerCase() === "ok"
            ? "compliant"
            : status.toLowerCase() === "issue found"
              ? "non-compliant"
              : status.toLowerCase() === "warning"
                ? "warning"
                : "unknown";
        (acc as any)[k]++;
        return acc;
      },
      { compliant: 0, "non-compliant": 0, warning: 0, unknown: 0 }
    )
    : { compliant: 0, "non-compliant": 0, warning: 0, unknown: 0 };

  /* ───────────────── render ───────────────── */
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* header */}
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

      {/* main panel */}
      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <SelectArea
            isAnalyzeDisabled={isAnalyzeDisabled}
            isFileInputDisabled={isFileInputDisabled}
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
            handleAnalyze={handleAnalyze}
            error={error}
          />
        ) : (
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
      {/* history */}
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
                    {new Date(h.created_at).toLocaleString("en-GB")} •{" "}
                    {h.num_issues} issues
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
    </div>
  );
};

/* ───── SelectArea subcomponent ───── */
interface SelectProps {
  isAnalyzeDisabled: boolean;
  isFileInputDisabled: boolean;
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
  handleAnalyze: () => void;
  error: string | null;
}

const SelectArea: React.FC<SelectProps> = ({
  isAnalyzeDisabled,
  isFileInputDisabled,
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
  handleAnalyze,
  error,
}) => {
  /* loading spinner */
  if (analyzing || fetchingDocs) {
    return (
      <div className="mt-8 text-center text-gray-700">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
        <p className="mt-2">
          {analyzing ? "Analyzing…" : "Loading documents…"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* existing docs */}
        <div className="bg-gray-50 rounded-lg border p-6 flex flex-col items-center gap-4">
          <p className="text-gray-700">
            Analyze a previously uploaded document:
          </p>
          <div className="relative w-full">
            <button
              className="flex justify-between items-center w-full px-4 py-2 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setDocSelectOpen(!docSelectOpen)}
              disabled={fetchingDocs}
            >
              {selectedDocId
                ? uploadedDocs.find(d => d._id === selectedDocId)?.filename
                : "Choose Document"}
              <FaChevronDown
                className={`ml-2 transition-transform ${docSelectOpen ? "rotate-180" : ""
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
                  {uploadedDocs.length ? (
                    uploadedDocs.map(doc => (
                      <li
                        key={doc._id}
                        className={`px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 cursor-pointer ${selectedDocId === doc._id ? "bg-gray-100" : ""
                          }`}
                        onClick={() => handleDocSelection(doc._id)}
                      >
                        {getFileIcon(doc.filename)}
                        {doc.filename}
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
            <motion.button
              onClick={handleAnalyze}
              disabled={isAnalyzeDisabled}
              className="mt-4 flex items-center gap-2 px-6 py-2 rounded-md text-white bg-[rgb(193,120,41)] disabled:opacity-50 hover:bg-[rgb(173,108,37)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {analyzing ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              {analyzing ? "Analyzing…" : "Analyze Selected"}
            </motion.button>
          )}
        </div>

        {/* upload new */}
        <div
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-[color:var(--accent-dark)]"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            onFileChange(e as any);
          }}
          aria-disabled={isFileInputDisabled}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={onFileChange}
            disabled={isFileInputDisabled}
          />
          {fileToUpload ? (
            <>
              {getFileIcon(fileToUpload.name)}
              <p className="mt-2">{fileToUpload.name}</p>
              <p className="text-xs text-gray-500">
                {(fileToUpload.size / 1048576).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <FaCloudUploadAlt className="text-5xl text-gray-400" />
              <p className="mt-2">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-400">
                Accepted: PDF, DOCX, DOC, TXT
              </p>
            </>
          )}
        </div>
      </div>

      {fileToUpload && !selectedDocId && (
        <div className="text-center">
          <motion.button
            onClick={handleAnalyze}
            disabled={isAnalyzeDisabled}
            className="flex items-center gap-2 px-6 py-2 rounded-md text-white bg-[rgb(193,120,41)] disabled:opacity-50 hover:bg-[rgb(173,108,37)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {analyzing ? <FaSpinner className="animate-spin" /> : <FaSearch />}
            {analyzing ? "Analyzing…" : "Analyze Uploaded"}
          </motion.button>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 mt-4">{error}</p>
      )}
    </div>
  );
};

/* ───── ResultView subcomponent ───── */
interface ResultProps {
  results: DisplayAnalysisResult;
  resultCounts: Record<
    "compliant" | "non-compliant" | "warning" | "unknown",
    number
  >;
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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b bg-gray-50 p-6">
      <div className="flex items-center gap-3">
        {results.analyzedFilename ? (
          getFileIcon(results.analyzedFilename)
        ) : (
          <FaFileAlt className="text-2xl text-gray-500" />
        )}
        <div>
          <h3 className="font-medium text-gray-800">{results.analyzedFilename}</h3>
          <p className="text-xs text-gray-500">Report ID: {results.report_id}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="text-center">
          <p className="text-xs text-gray-500">Overall Status</p>
          <ComplianceStatus status={results.overallStatus} />
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Score</p>
          <p className="text-lg font-bold text-gray-800">
            {results.complianceScore}/100
          </p>
        </div>
        <motion.button
          onClick={handleDownloadReport}
          disabled={!results.report_id}
          className="flex items-center gap-1 px-4 py-2 rounded-md text-sm text-white bg-[color:var(--accent-dark)] hover:bg-[color:var(--accent-light)] disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaDownload /> PDF
        </motion.button>
        <motion.button
          onClick={reset}
          className="flex items-center gap-1 px-4 py-2 rounded-md text-sm text-white bg-[rgb(193,120,41)] hover:bg-[rgb(173,108,37)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Analyze Another
        </motion.button>
      </div>
    </div>

    {/* cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      {(["compliant", "non-compliant", "warning"] as const).map(k => (
        <div
          key={k}
          className="rounded-lg border bg-gray-50 p-4 text-center"
          style={{ boxShadow: SHADOW }}
        >
          <p className="text-xs text-gray-500 mb-1">
            {k.charAt(0).toUpperCase() + k.slice(1)} Items
          </p>
          <p className="text-2xl font-bold text-gray-800">{resultCounts[k]}</p>
        </div>
      ))}
    </div>

    {/* list */}
    <div className="space-y-4 p-6">
      {results.issues.map((it, i) => (
        <div
          key={`${results.report_id}-${it.rule_id}-${i}`}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <p className="font-medium text-gray-800">
              {it.description}
              <span className="ml-2 bg-gray-100 text-xs text-gray-500 px-2 py-0.5 rounded">
                Rule ID: {it.rule_id}
              </span>
            </p>
            <ComplianceStatus status={it.status} />
          </div>
          {it.status.toLowerCase() !== "ok" && (
            <div className="flex gap-2 bg-[color:var(--accent-light)]/50 p-3 rounded-md">
              <FaInfoCircle className="text-[color:var(--accent-dark)] mt-1" />
              <div className="text-[color:var(--accent-dark)] text-sm space-y-2">
                <p>{it.description}</p>
                {it.extracted_text_snippet && (
                  <p className="bg-white border italic p-2 rounded">
                    “{it.extracted_text_snippet}”
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {results.issues.length === 0 && (
        <p className="text-center text-gray-600 italic">
          No compliance issues found.
        </p>
      )}
    </div>
  </>
);

export default ComplianceChecker;
