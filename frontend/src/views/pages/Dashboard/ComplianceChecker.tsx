// src/views/pages/Dashboard/ComplianceChecker.tsx

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
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
  ComplianceIssue, // Assuming this type does not have 'rule_name' or 'recommendation'
  listComplianceHistory,
  deleteComplianceReport,
  getComplianceReport,
  ComplianceHistoryItem,
} from "../../../api";

/* ───────────── local types ───────────── */
interface DisplayAnalysisResult extends ComplianceReportResponse {
  complianceScore: number;
  analyzedFilename?: string;
}

/* ───────────── status badge ───────────── */
const ComplianceStatus: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toLowerCase();
  const displayStatus =
    s === "ok"
      ? "compliant"
      : s === "issue found"
      ? "non-compliant"
      : s === "warning"
      ? "warning"
      : "unknown";

  const palette = {
    compliant: "bg-green-100 text-green-800 border-green-200",
    "non-compliant": "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unknown: "bg-gray-100 text-gray-800 border-gray-200",
  } as const;

  const icons = {
    compliant: <FaClipboardCheck className="mr-1" />,
    "non-compliant": <FaExclamationCircle className="mr-1" />,
    warning: <FaInfoCircle className="mr-1" />,
    unknown: <FaInfoCircle className="mr-1" />,
  };

  const labels = {
    compliant: "Compliant",
    "non-compliant": "Non-Compliant",
    warning: "Warning",
    unknown: "Unknown",
  };

  return (
    <span
      className={`flex items-center rounded border px-2 py-1 text-xs font-medium ${palette[displayStatus]}`}
    >
      {icons[displayStatus]}
      {labels[displayStatus]}
    </span>
  );
};

/* ═════════════════════════ COMPONENT ═════════════════════════ */
function ComplianceChecker() {
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
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState<string | null>(null);

  /* delete modal state */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* init load */
  useEffect(() => {
    fetchUploadedDocuments();
    loadHistory();
  }, []);

  /* keep filename label in sync */
  // Removed 'results' from dependency array as it was causing infinite loops if not memoized correctly.
  // This effect primarily depends on doc/file changes when results are already present.
  useEffect(() => {
    if (results) {
      let newFilename: string | undefined;
      if (selectedDocId) {
        newFilename = uploadedDocs.find(
          (d) => d._id === selectedDocId
        )?.filename;
      } else if (fileToUpload) {
        newFilename = fileToUpload.name;
      }
      if (newFilename && results.analyzedFilename !== newFilename) {
        setResults((prevResults) =>
          prevResults ? { ...prevResults, analyzedFilename: newFilename } : null
        );
      }
    }
  }, [selectedDocId, fileToUpload, uploadedDocs]);

  /* ───────────────────────── helpers ───────────────────────── */

  async function fetchUploadedDocuments() {
    setFetchingDocs(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
      if (selectedDocId && !docs.find((d) => d._id === selectedDocId)) {
        setSelectedDocId(null);
      }
    } catch {
      setError("Failed to load uploaded documents.");
    } finally {
      setFetchingDocs(false);
    }
  }

  async function loadHistory() {
    setError(null);
    try {
      const h = await listComplianceHistory();
      h.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(h);
    } catch (e: any) {
      setError("Failed to load compliance history.");
      console.error("Failed to load compliance history:", e);
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

    let overall: DisplayAnalysisResult["complianceScore"] = 100;
    if (tally.bad) overall = Math.max(0, 100 - tally.bad * 20);
    else if (tally.warn) overall = Math.max(0, 100 - tally.warn * 10);
    else if (tally.unk) overall = Math.max(0, 100 - tally.unk * 5);

    return overall;
  }

  /* open stored report */
  async function openReport(id: string) {
    setIsLoadingReport(id);
    setError(null);
    try {
      const rep = await getComplianceReport(id);
      const score =
        typeof (rep as any).compliance_score === "number"
          ? (rep as any).compliance_score
          : deriveStatusAndScore(rep.issues);
      setResults({
        ...rep,
        complianceScore: score,
        analyzedFilename: rep.report_filename || rep.report_id,
      });
      setSelectedDocId(null);
      setFileToUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      const errorMsg = (e as Error).message || "Failed to open report";
      setError(errorMsg);
    } finally {
      setIsLoadingReport(null);
    }
  }

  /* queue delete modal */
  function removeReport(id: string) {
    setPendingDeleteId(id);
  }

  /* confirm deletion */
  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteComplianceReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      if (results?.report_id === pendingDeleteId) setResults(null);
    } catch (e: any) {
      const errorMsg = (e as Error).message || "Delete failed";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  const FILE_ICON_SIZE = "text-5xl";

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FaFilePdf className={`${FILE_ICON_SIZE} text-red-600`} />;
    }
    if (ext === "doc" || ext === "docx") {
      return <FaFileWord className={`${FILE_ICON_SIZE} text-blue-600`} />;
    }
    return <FaFileAlt className={`${FILE_ICON_SIZE} text-gray-500`} />;
  };

  /* fresh analysis */
  const handleAnalyze = async () => {
    let docIdToAnalyze: string | null = null;
    let filenameToAnalyze: string | undefined;

    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      if (fileToUpload) {
        const { doc_id } = await uploadDocument(fileToUpload);
        docIdToAnalyze = doc_id;
        filenameToAnalyze = fileToUpload.name;
        fetchUploadedDocuments();
      } else if (selectedDocId) {
        docIdToAnalyze = selectedDocId;
        filenameToAnalyze =
          uploadedDocs.find((d) => d._id === selectedDocId)?.filename || "";
      } else {
        setError("Please select or upload a document.");
        setAnalyzing(false);
        return;
      }

      const report = await checkCompliance({ doc_id: docIdToAnalyze });
      const score =
        typeof (report as any).compliance_score === "number"
          ? (report as any).compliance_score
          : deriveStatusAndScore(report.issues);

      setResults({
        ...report,
        complianceScore: score,
        analyzedFilename: filenameToAnalyze,
      });
      loadHistory();
    } catch (e: any) {
      setError(
        `Compliance check failed: ${(e as Error).message || "Unknown error"}`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadReport = () =>
    results && downloadComplianceReportPdf(results.report_id);

  const handleDocSelection = (id: string | null) => {
    setSelectedDocId(id);
    setFileToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setResults(null);
    setError(null);
  };

  const handleFileDrop = (file: File | null) => {
    if (!file) return;
    setError(null);
    setFileToUpload(file);
    setSelectedDocId(null);
    setResults(null);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileDrop(e.target.files?.[0] || null);
  };

  const reset = () => {
    setSelectedDocId(null);
    setFileToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setResults(null);
    setError(null);
  };

  const isAnalyzeDisabled =
    (!selectedDocId && !fileToUpload) ||
    analyzing ||
    fetchingDocs ||
    !!isLoadingReport;
  const isFileInputDisabled = analyzing || fetchingDocs || !!isLoadingReport;

  const displayedHistory = showAllHistory ? history : history.slice(0, 5);

  /* ───────────────────────── render ───────────────────────── */
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
              Compliance
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
            handleFileDrop={handleFileDrop}
            handleAnalyze={handleAnalyze}
            error={error} // Pass error to SelectArea
          />
        ) : (
          <ResultView
            results={results}
            ComplianceStatus={ComplianceStatus}
            getFileIcon={getFileIcon}
            handleDownloadReport={handleDownloadReport}
            reset={reset}
          />
        )}
      </section>

      {/* history */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="mb-4 font-medium text-[color:var(--brand-dark)]">
          Previous Compliance Reports
        </h2>
        {/* Display error from history loading/opening here, if not already shown above and results are null */}
        {error && !results && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}
        {history.length === 0 && !isLoadingReport && !fetchingDocs && !error ? (
          <p className="text-sm italic text-gray-500">No history yet.</p>
        ) : null}
        {(history.length > 0 || isLoadingReport || fetchingDocs) && ( // Added check to ensure ul is not rendered if history is empty and not loading
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
                      {h.report_filename || "Compliance Report"}
                    </p>
                    <p className="ml-6 mt-1 text-xs text-gray-500 sm:ml-0 sm:pl-6">
                      {h.num_issues} issue{h.num_issues !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-3 self-end sm:self-center">
                    <button
                      onClick={() => openReport(h.id)}
                      className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                      disabled={
                        analyzing ||
                        isDeleting ||
                        (!!isLoadingReport && isLoadingReport !== h.id)
                      }
                    >
                      {isLoadingReport === h.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaSearch />
                      )}
                      {isLoadingReport === h.id ? "Loading..." : "View"}
                    </button>
                    {h.report_doc_id && (
                      <button
                        onClick={() => downloadComplianceReportPdf(h.id)}
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                        disabled={analyzing || isDeleting || !!isLoadingReport}
                      >
                        <FaDownload /> Download
                      </button>
                    )}
                    <button
                      onClick={() => removeReport(h.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={analyzing || isDeleting || !!isLoadingReport}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {history.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="text-sm text-[#c17829] hover:underline"
                >
                  {showAllHistory
                    ? "Show Less"
                    : `Show ${history.length - 5} More`}
                  <FaChevronDown
                    className={`ml-1 inline-block transition-transform duration-200 ${
                      showAllHistory ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* delete confirmation modal */}
      <AnimatePresence>
        {pendingDeleteId && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setPendingDeleteId(null)}
              aria-hidden="true"
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
            >
              <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h4
                  id="delete-modal-title"
                  className="text-lg font-semibold text-[color:var(--brand-dark)]"
                >
                  Delete Compliance Report
                </h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this compliance report? This
                  action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    disabled={isDeleting}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <FaSpinner className="mr-2 inline-block animate-spin" />
                    ) : null}
                    {isDeleting ? "Deleting..." : "Delete"}
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

/* ───────── SelectArea subcomponent ───────── */
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
  handleFileDrop: (f: File | null) => void;
  handleAnalyze: () => void;
  error: string | null; // Added error prop
}

function SelectArea({
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
  handleFileDrop,
  handleAnalyze,
  error, // Use error prop
}: SelectProps) {
  const getSmallFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FaFilePdf className="mr-2 text-red-500" />;
    }
    if (ext === "doc" || ext === "docx") {
      return <FaFileWord className="mr-2 text-blue-500" />;
    }
    return <FaFileAlt className="mr-2 text-gray-400" />;
  };

  if (analyzing || fetchingDocs) {
    return (
      <Spinner
        label={
          analyzing
            ? "Analyzing document…"
            : fetchingDocs
            ? "Loading documents…"
            : "Processing…"
        }
      />
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ExistingDocPicker
          uploadedDocs={uploadedDocs}
          selectedDocId={selectedDocId}
          handleDocSelection={handleDocSelection}
          docSelectOpen={docSelectOpen}
          setDocSelectOpen={setDocSelectOpen}
          getFileIcon={getSmallFileIcon}
          handleAnalyze={handleAnalyze}
          isAnalyzeDisabled={isAnalyzeDisabled}
          analyzing={analyzing}
        />

        <UploadDropZone
          fileToUpload={fileToUpload}
          fileInputRef={fileInputRef}
          isDisabled={isFileInputDisabled}
          onFileChange={onFileChange}
          handleFileDrop={handleFileDrop}
          getFileIcon={getFileIcon}
        />
      </div>

      {fileToUpload && !selectedDocId && (
        <div className="text-center">
          <AnalyzeButton
            onClick={handleAnalyze}
            disabled={isAnalyzeDisabled}
            busy={analyzing}
            label="Analyze Uploaded"
          />
        </div>
      )}
      {/* Corrected error display condition */}
      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/* ───────── smaller atoms ───────── */

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-gray-700">
      <FaSpinner className="mb-3 h-10 w-10 animate-spin text-[color:var(--accent-dark)]" />
      <p className="mt-2 text-sm">{label}</p>
    </div>
  );
}

function AnalyzeButton({
  onClick,
  disabled,
  busy,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-[rgb(173,108,37)] disabled:cursor-not-allowed disabled:opacity-60"
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
    >
      {busy ? <FaSpinner className="animate-spin" /> : <FaSearch />}
      {busy ? "Analyzing…" : label}
    </motion.button>
  );
}

function ExistingDocPicker(props: {
  uploadedDocs: DocumentRecord[];
  selectedDocId: string | null;
  handleDocSelection: (id: string | null) => void;
  docSelectOpen: boolean;
  setDocSelectOpen: (v: boolean) => void;
  getFileIcon: (f: string) => JSX.Element;
  handleAnalyze: () => void;
  isAnalyzeDisabled: boolean;
  analyzing: boolean;
}) {
  const {
    uploadedDocs,
    selectedDocId,
    handleDocSelection,
    docSelectOpen,
    setDocSelectOpen,
    getFileIcon,
    handleAnalyze,
    isAnalyzeDisabled,
    analyzing,
  } = props;

  const selectedDoc = uploadedDocs.find((d) => d._id === selectedDocId);

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-gray-50 p-6">
      <p className="text-sm text-gray-700">
        Or analyze a previously uploaded document:
      </p>
      <div className="relative w-full">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)]/50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setDocSelectOpen(!docSelectOpen)}
          disabled={analyzing}
          aria-haspopup="listbox"
          aria-expanded={docSelectOpen}
        >
          <span className="truncate">
            {selectedDoc ? selectedDoc.filename : "Choose Document"}
          </span>
          <FaChevronDown
            className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${
              docSelectOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {docSelectOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5, transition: { duration: 0.15 } }}
              className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              role="listbox"
            >
              {selectedDocId && (
                <li
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100"
                  role="option"
                  tabIndex={-1}
                  onClick={() => {
                    handleDocSelection(null);
                    setDocSelectOpen(false);
                  }}
                >
                  Clear Selection
                </li>
              )}
              {uploadedDocs.length > 0 ? (
                uploadedDocs.map((doc) => (
                  <li
                    key={doc._id}
                    className={`relative flex cursor-pointer select-none items-center py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100 ${
                      selectedDocId === doc._id
                        ? "bg-gray-100 font-semibold"
                        : ""
                    }`}
                    role="option"
                    tabIndex={-1}
                    onClick={() => {
                      handleDocSelection(doc._id);
                      setDocSelectOpen(false);
                    }}
                  >
                    {getFileIcon(doc.filename)}
                    <span className="truncate">{doc.filename}</span>
                  </li>
                ))
              ) : (
                <li className="relative cursor-default select-none px-4 py-2 text-sm italic text-gray-500">
                  No documents uploaded yet.
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {selectedDocId && (
        <AnalyzeButton
          onClick={handleAnalyze}
          disabled={isAnalyzeDisabled || analyzing}
          busy={analyzing && !!selectedDocId}
          label="Analyze Selected"
        />
      )}
    </div>
  );
}

function UploadDropZone(props: {
  fileToUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isDisabled: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (f: File | null) => void;
  getFileIcon: (f: string) => JSX.Element;
}) {
  const {
    fileToUpload,
    fileInputRef,
    isDisabled,
    onFileChange,
    handleFileDrop,
    getFileIcon,
  } = props;
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors duration-150 ease-in-out
        ${
          isDisabled
            ? "cursor-not-allowed opacity-60 border-gray-300 bg-gray-50"
            : "border-gray-300 hover:border-[color:var(--accent-dark)]"
        }
        ${
          isDragging
            ? "border-[color:var(--accent-dark)] bg-[color:var(--accent-light)]/30"
            : ""
        }
      `}
      onClick={() => !isDisabled && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled) {
          e.dataTransfer.dropEffect = "copy";
          setIsDragging(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isDisabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) handleFileDrop(f);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        disabled={isDisabled}
        onChange={onFileChange}
      />

      {fileToUpload ? (
        <>
          {getFileIcon(fileToUpload.name)}
          <p className="mt-2 font-medium text-gray-700">{fileToUpload.name}</p>
          <p className="text-xs text-gray-500">
            {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </>
      ) : (
        <>
          <FaCloudUploadAlt className="text-5xl text-gray-400 transition-colors group-hover:text-[color:var(--accent-dark)]" />
          <p className="mt-2 text-sm text-gray-600">
            Drag & drop or{" "}
            <span className="font-semibold text-[color:var(--accent-dark)]">
              click to upload
            </span>
          </p>
          <p className="text-xs text-gray-400">Accepted: PDF, DOCX, DOC, TXT</p>
        </>
      )}
    </div>
  );
}

/* ───────── ResultView subcomponent ────────── */
interface ResultProps {
  results: DisplayAnalysisResult;
  ComplianceStatus: React.FC<{ status: string }>;
  getFileIcon: (f: string) => JSX.Element;
  handleDownloadReport: () => void;
  reset: () => void;
}

function ResultView({
  results,
  ComplianceStatus,
  getFileIcon,
  handleDownloadReport,
  reset,
}: ResultProps) {
  return (
    <>
      {/* header bar */}
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {results.analyzedFilename ? (
            getFileIcon(results.analyzedFilename)
          ) : (
            <FaFileAlt className="text-5xl text-gray-500" />
          )}
          <div>
            <h3 className="font-medium text-gray-800">
              {results.analyzedFilename || "Analysis Result"}
            </h3>
            <p className="text-xs text-gray-500">
              Report ID: {results.report_id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Compliance Score
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {results.complianceScore}/100
            </p>
          </div>
          <motion.button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[color:var(--accent-dark)]/90 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)]/50 focus:ring-offset-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaDownload /> Download PDF
          </motion.button>
          <motion.button
            onClick={reset}
            className="flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[rgb(173,108,37)] focus:outline-none focus:ring-2 focus:ring-[rgb(193,120,41)]/50 focus:ring-offset-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Analyze Another
          </motion.button>
        </div>
      </div>

      {/* detailed list */}
      <div className="space-y-4 p-6">
        {results.issues.map((it, i) => (
          <div
            key={`${results.report_id}-${it.rule_id}-${i}`}
            className="rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <p className="flex-1 font-medium text-gray-800">
                {it.description}{" "}
                {/* Changed from it.rule_name || it.description */}
                <span className="ml-2 whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
                  Rule ID: {it.rule_id}
                </span>
              </p>
              <div className="flex-shrink-0">
                <ComplianceStatus status={it.status} />
              </div>
            </div>
            {it.status.toLowerCase() !== "ok" && it.description && (
              <div className="flex gap-2 rounded-md border border-[color:var(--accent-dark)]/30 bg-[color:var(--accent-light)]/20 p-3 text-sm">
                <FaInfoCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--accent-dark)]" />
                <div className="space-y-1 text-sm text-[color:var(--accent-dark)]/90">
                  <p className="font-medium">Details:</p>
                  <p>{it.description}</p>
                  {it.extracted_text_snippet && (
                    <p className="mt-1 rounded border bg-white/70 p-2 text-xs italic text-gray-700">
                      “{it.extracted_text_snippet}”
                    </p>
                  )}
                  {/* Removed recommendation block as it's not on ComplianceIssue type
                   {it.recommendation && (
                    <p className="mt-1">
                        <span className="font-semibold">Recommendation:</span> {it.recommendation}
                    </p>
                  )}
                  */}
                </div>
              </div>
            )}
          </div>
        ))}
        {results.issues.length === 0 && (
          <div className="py-10 text-center">
            <FaClipboardCheck className="mx-auto mb-3 text-4xl text-green-500" />
            <p className="text-lg font-semibold text-gray-700">
              Excellent! No compliance issues found.
            </p>
            <p className="text-sm text-gray-500">
              This document meets all checked compliance standards.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default ComplianceChecker;
