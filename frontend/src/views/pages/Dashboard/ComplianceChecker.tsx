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
  ComplianceIssue,
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

  /* delete modal state */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* init load */
  useEffect(() => {
    fetchUploadedDocuments();
    loadHistory();
  }, []);

  /* keep filename label in sync */
  useEffect(() => {
    if (results) {
      if (selectedDocId) {
        const doc = uploadedDocs.find((d) => d._id === selectedDocId);
        setResults({ ...results, analyzedFilename: doc?.filename });
      } else if (fileToUpload) {
        setResults({ ...results, analyzedFilename: fileToUpload.name });
      }
    }
  }, [selectedDocId, fileToUpload, uploadedDocs]);

  /* ───────────────────────── helpers ───────────────────────── */

  async function fetchUploadedDocuments() {
    setFetchingDocs(true);
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
    try {
      const h = await listComplianceHistory();
      setHistory(h);
    } catch {
      // ignore
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
    if (tally.bad) overall = 100 - tally.bad * 20;
    else if (tally.warn) overall = 100 - tally.warn * 10;
    else if (tally.unk) overall = 100 - tally.unk * 5;

    return overall;
  }

  /* open stored report */
  async function openReport(id: string) {
    try {
      const rep = await getComplianceReport(id);
      const score =
        typeof (rep as any).compliance_score === "number"
          ? (rep as any).compliance_score
          : deriveStatusAndScore(rep.issues);

      setResults({
        ...rep,
        report_id: id,
        complianceScore: score,
        analyzedFilename: rep.report_filename || id,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open report");
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
    try {
      await deleteComplianceReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      if (results?.report_id === pendingDeleteId) setResults(null);
    } catch (e: any) {
      alert(e.message || "Delete failed");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  const FILE_ICON_SIZE = "text-5xl";
  const DROPDOWN_ICON_SIZE = "text-xl";

  const getFileIcon = (filename: string, sizeClassName: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FaFilePdf className={`${sizeClassName} text-red-600`} />;
    }
    if (ext === "doc" || ext === "docx") {
      return <FaFileWord className={`${sizeClassName} text-blue-600`} />;
    }
    return <FaFileAlt className={`${sizeClassName} text-gray-500`} />;
  };

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
        filename =
          uploadedDocs.find((d) => d._id === selectedDocId)?.filename || "";
      } else {
        setError("Please select or upload a document.");
        return;
      }

      const report = await checkCompliance({ doc_id: docId });
      const score =
        typeof (report as any).compliance_score === "number"
          ? (report as any).compliance_score
          : deriveStatusAndScore(report.issues);

      setResults({
        ...report,
        complianceScore: score,
        analyzedFilename: filename,
      });
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
    (!selectedDocId && !fileToUpload) || analyzing || fetchingDocs;
  const isFileInputDisabled = analyzing || fetchingDocs;

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
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
            error={error}
            FILE_ICON_SIZE={FILE_ICON_SIZE}
            DROPDOWN_ICON_SIZE={DROPDOWN_ICON_SIZE}
          />
        ) : (
          <ResultView
            results={results}
            ComplianceStatus={ComplianceStatus}
            getFileIcon={(filename) => getFileIcon(filename, FILE_ICON_SIZE)}
            handleDownloadReport={handleDownloadReport}
            reset={reset}
          />
        )}
      </section>

      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="mb-4 font-medium text-[color:var(--brand-dark)]">
          Previous Compliance Reports
        </h2>
        {history.length === 0 ? (
          <p className="text-sm italic text-gray-500">No history yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {(showAllHistory ? history : history.slice(0, 5)).map((h) => (
                <li
                  key={h.id}
                  className="flex flex-col rounded-lg border border-[#c17829]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="mb-3 sm:mb-0 min-w-0 flex-1">
                    <p className="flex items-start text-sm font-semibold text-gray-800">
                      <span className="mr-2 mt-0.5 text-[#c17829] flex-shrink-0">
                        {getFileIcon(
                          h.report_filename || "",
                          DROPDOWN_ICON_SIZE
                        )}
                      </span>
                      <span className="break-all">
                        {h.report_filename || "Compliance report"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {h.num_issues} issue{h.num_issues !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-3 self-end sm:self-center">
                    <button
                      onClick={() => openReport(h.id)}
                      className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                    >
                      <FaSearch /> View
                    </button>
                    {h.report_doc_id && (
                      <motion.button
                        onClick={() => downloadComplianceReportPdf(h.id)}
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:bg-[#a66224]/10 rounded-md px-3 py-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaDownload /> Download
                      </motion.button>
                    )}
                    <button
                      onClick={() => removeReport(h.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
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
                  {showAllHistory ? "Show less" : "Show more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <AnimatePresence>
        {pendingDeleteId && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setPendingDeleteId(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h4 className="text-lg font-semibold text-[color:var(--brand-dark)]">
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
  getFileIcon: (filename: string, sizeClassName: string) => JSX.Element;
  fileToUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (f: File | null) => void;
  handleAnalyze: () => void;
  error: string | null;
  FILE_ICON_SIZE: string;
  DROPDOWN_ICON_SIZE: string;
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
  error,
  FILE_ICON_SIZE,
  DROPDOWN_ICON_SIZE,
}: SelectProps) {
  if (analyzing || fetchingDocs) {
    return <Spinner label={analyzing ? "Analyzing…" : "Loading documents…"} />;
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
          getFileIcon={getFileIcon}
          handleAnalyze={handleAnalyze}
          isAnalyzeDisabled={isAnalyzeDisabled}
          analyzing={analyzing}
          DROPDOWN_ICON_SIZE={DROPDOWN_ICON_SIZE}
        />

        <UploadDropZone
          fileToUpload={fileToUpload}
          fileInputRef={fileInputRef}
          isDisabled={isFileInputDisabled}
          onFileChange={onFileChange}
          handleFileDrop={handleFileDrop}
          getFileIcon={getFileIcon}
          FILE_ICON_SIZE={FILE_ICON_SIZE}
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

      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="mt-8 text-center text-gray-700 py-12">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
      <p className="mt-2">{label}</p>
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
      className="flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2 text-white hover:bg-[rgb(173,108,37)]"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {busy ? <FaSpinner className="animate-spin" /> : <FaSearch />}
      {busy ? "Analyzing…" : label}
    </motion.button>
  );
}

interface ExistingDocPickerProps {
  uploadedDocs: DocumentRecord[];
  selectedDocId: string | null;
  handleDocSelection: (id: string | null) => void;
  docSelectOpen: boolean;
  setDocSelectOpen: (v: boolean) => void;
  getFileIcon: (filename: string, sizeClassName: string) => JSX.Element;
  handleAnalyze: () => void;
  isAnalyzeDisabled: boolean;
  analyzing: boolean;
  DROPDOWN_ICON_SIZE: string;
}

function ExistingDocPicker({
  uploadedDocs,
  selectedDocId,
  handleDocSelection,
  docSelectOpen,
  setDocSelectOpen,
  getFileIcon,
  handleAnalyze,
  isAnalyzeDisabled,
  analyzing,
  DROPDOWN_ICON_SIZE,
}: ExistingDocPickerProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-gray-50 p-6">
      <p className="text-gray-700">Analyze a previously uploaded document:</p>
      <div className="relative w-full">
        <button
          className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
          onClick={() => setDocSelectOpen(!docSelectOpen)}
          disabled={analyzing}
        >
          {selectedDocId
            ? uploadedDocs.find((d) => d._id === selectedDocId)?.filename
            : "Choose Document"}
          <FaChevronDown
            className={`ml-2 transition-transform ${
              docSelectOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {docSelectOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
            >
              {selectedDocId && (
                <li
                  className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleDocSelection(null)}
                >
                  Clear Selection
                </li>
              )}
              {uploadedDocs.length ? (
                uploadedDocs.map((doc) => (
                  <li
                    key={doc._id}
                    className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                      selectedDocId === doc._id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => {
                      handleDocSelection(doc._id);
                      setDocSelectOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {getFileIcon(doc.filename, DROPDOWN_ICON_SIZE)}
                      <span className="flex-1 break-all">{doc.filename}</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-sm italic text-gray-500">
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
          disabled={isAnalyzeDisabled}
          busy={analyzing}
          label="Analyze Selected"
        />
      )}
    </div>
  );
}

interface UploadDropZoneProps {
  fileToUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isDisabled: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (f: File | null) => void;
  getFileIcon: (filename: string, sizeClassName: string) => JSX.Element;
  FILE_ICON_SIZE: string;
}

function UploadDropZone({
  fileToUpload,
  fileInputRef,
  isDisabled,
  onFileChange,
  handleFileDrop,
  getFileIcon,
  FILE_ICON_SIZE,
}: UploadDropZoneProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-[color:var(--accent-dark)]"
      }`}
      onClick={() => !isDisabled && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
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
          {getFileIcon(fileToUpload.name, FILE_ICON_SIZE)}
          <p className="mt-2">{fileToUpload.name}</p>
          <p className="text-xs text-gray-500">
            {(fileToUpload.size / 1048576).toFixed(2)} MB
          </p>
        </>
      ) : (
        <>
          <FaCloudUploadAlt className="text-5xl text-gray-400" />
          <p className="mt-2">Drag & drop or click to upload</p>
          <p className="text-xs text-gray-400">Accepted: PDF, DOCX</p>
        </>
      )}
    </div>
  );
}

interface ResultProps {
  results: DisplayAnalysisResult;
  ComplianceStatus: React.FC<{ status: string }>;
  getFileIcon: (filename: string, sizeClassName: string) => JSX.Element;
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
  const FILE_ICON_SIZE = "text-5xl";

  return (
    <>
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {results.analyzedFilename ? (
            getFileIcon(results.analyzedFilename, FILE_ICON_SIZE)
          ) : (
            <FaFileAlt className="text-5xl text-gray-500" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 break-words">
              {results.analyzedFilename}
            </h3>
            <p className="text-xs text-gray-500">
              Report ID: {results.report_id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-6 justify-center">
          <motion.button
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-1 rounded-md bg-[rgb(193,120,41)] px-4 py-1.5 text-sm text-white hover:bg-[rgb(173,108,37)] w-[159px] h-[36px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaDownload /> PDF
          </motion.button>
          <motion.button
            onClick={reset}
            className="flex items-center justify-center gap-1 rounded-md bg-[rgb(193,120,41)] px-4 py-1.5 text-sm text-white hover:bg-[rgb(173,108,37)] w-[159px] h-[36px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Analyze Another
          </motion.button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {results.issues.map((it, i) => (
          <div
            key={`${results.report_id}-${it.rule_id}-${i}`}
            className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-lg"
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <h4 className="font-semibold text-gray-900 break-words flex-1 min-w-0">
                {it.description}
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 flex-shrink-0">
                  Rule ID: {it.rule_id}
                </span>
              </h4>
              <ComplianceStatus status={it.status} />
            </div>

            {it.extracted_text_snippet && (
              <p className="text-xs text-gray-500 mb-1">
                Original text snippet:
              </p>
            )}

            {it.extracted_text_snippet && (
              <blockquote className="mb-3 border-l-4 border-gray-300 pl-3 text-sm italic text-gray-700">
                “{it.extracted_text_snippet}”
              </blockquote>
            )}
          </div>
        ))}
        {results.issues.length === 0 && (
          <p className="text-center italic text-gray-600">
            No compliance issues found.
          </p>
        )}
      </div>
    </>
  );
}

export default ComplianceChecker;
