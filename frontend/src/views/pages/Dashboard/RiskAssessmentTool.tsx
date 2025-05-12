/*  src/views/pages/Dashboard/RiskAssessmentTool.tsx
    ──────────────────────────────────────────────────────────────
    Single-file implementation of the Risk-Assessment front-end.
    New in this version — 2025-05-12:
      • “Analyze a previously uploaded document” picker (left column)
      • Keeps drag-and-drop / direct-upload flow unchanged (right column)
      • History list of finished risk reports unchanged
      • Generates a PDF summary and stores back to server

    Required API helpers (all already exist in ../api for Compliance; if you
    don’t have them in your risk API wrapper, add thin wrappers that forward
    to the same endpoints):
      uploadDocument(file)          →  { doc_id }
      listDocuments()               →  DocumentRecord[]
      analyzeRiskDoc({ doc_id })    →  RiskAnalysisResponse
*/

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
} from "react";
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
  FaFilePdf,
  FaFileWord,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  /* analysis & reports */
  analyzeRiskFile,
  analyzeRiskDoc,       // ✔ now exists
  uploadRiskPdf,
  listRiskHistory,
  deleteRiskReport,
  getRiskReport,
  downloadRiskReport,
  /* raw-doc helpers */
  uploadDocument,
  listDocuments,
  getDocumentContent,
  /* types */
  RiskAnalysisResponse,
  RiskItemBackend,
  RiskHistoryItem,
  DocumentRecord,
} from "../../../api";

/* ─────────────── local helpers & types ─────────────── */
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

function Spinner({ label }: { label: string }) {
  return (
    <div className="mt-8 text-center text-gray-700">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#c17829]" />
      <p className="mt-2">{label}</p>
    </div>
  );
}

/* ─────────────── Uploaded-file icon helper ─────────────── */
const FILE_ICON_SIZE = "text-5xl";
const DROPDOWN_ICON_SIZE = "text-xl";

const getFileIcon = (filename: string, sizeClass: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FaFilePdf className={`${sizeClass} text-red-600`} />;
  if (ext === "doc" || ext === "docx")
    return <FaFileWord className={`${sizeClass} text-blue-600`} />;
  return <FaFileAlt className={`${sizeClass} text-gray-500`} />;
};

/* ═════════════════════════  MAIN COMPONENT  ═════════════════════════ */
function RiskAssessmentTool() {
  /* ------------- raw document state ------------- */
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);

  /* ------------- file upload ------------- */
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------- history of finished reports ------------- */
  const [history, setHistory] = useState<RiskHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  /* ------------- analysis state ------------- */
  const [results, setResults] = useState<{
    id: string;
    riskItems: RiskItem[];
    analyzedFilename?: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* misc */
  const [activeSection, setActiveSection] = useState("all");

  /* ------------- initial load ------------- */
  useEffect(() => {
    fetchDocuments();
    loadHistory();
  }, []);

  async function fetchDocuments() {
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
      const h = await listRiskHistory();
      h.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(h);
    } catch {
      /* history isn’t critical for initial load */
    }
  }

  /* ------------- mapping helper ------------- */
  const mapRisks = (raw: RiskItemBackend[]): RiskItem[] =>
    (raw ?? []).map((r, idx) => ({
      id: idx + 1,
      title: r.risk_description,
      quote:
        (r as any).extracted_text_snippet ||
        (r as any).clause ||
        r.section ||
        "(no snippet)",
      section: r.section,
      risk: ((r.severity || "Low").toLowerCase() as Severity) ?? "low",
      recommendation: r.recommendation ?? "No recommendation provided.",
    }));

  /* ------------- PDF builder ------------- */
  const buildPdfBlob = (items: RiskItem[], srcName?: string): Blob => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFontSize(18);
    doc.text(
      srcName ? `Risk Assessment Report for ${srcName}` : "Risk Assessment Report",
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

  /* ------------- main analyze handler ------------- */
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    let filename = "";

    try {
      let resp: RiskAnalysisResponse;

      /* A) new upload */
      if (fileToUpload) {
        const { doc_id } = await uploadDocument(fileToUpload);
        filename = fileToUpload.name;
        resp = await analyzeRiskDoc(doc_id);
        fetchDocuments(); // refresh list
      }
      /* B) existing doc */
      else if (selectedDocId) {
        const doc = uploadedDocs.find((d) => d._id === selectedDocId);
        filename = doc?.filename || "";
        resp = await analyzeRiskDoc(selectedDocId);
      } else {
        setError("Please select or upload a document.");
        return;
      }

      const mapped = mapRisks(resp.risks);
      setResults({
        id: resp.id,
        riskItems: mapped,
        analyzedFilename: filename,
      });
      setActiveSection("all");

      /* build + upload PDF */
      const pdfBlob = buildPdfBlob(mapped, filename);
      const niceName =
        (filename.replace(/\.[^.]+$/, "") || "report") + "_risk_report.pdf";
      await uploadRiskPdf(resp.id, pdfBlob, niceName);

      loadHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(`Risk analysis failed: ${e.message || "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ------------- open a finished report from history ------------- */
  const openReport = async (id: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const rep = await getRiskReport(id);
      setResults({
        id: rep.id,
        riskItems: mapRisks(rep.risks as any),
        analyzedFilename:
          history.find((h) => h.id === id)?.filename ??
          history.find((h) => h.id === id)?.report_filename ??
          "Report",
      });
      setActiveSection("all");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
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
    } catch {
      /* ignore */
    } finally {
      setIsDeletingHistory(false);
      setPendingDeleteId(null);
    }
  };

  /* ------------- reset UI ------------- */
  const reset = () => {
    setSelectedDocId(null);
    setFileToUpload(null);
    setResults(null);
    setError(null);
    setActiveSection("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ------------- derived values ------------- */
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

  const isAnalyzeDisabled =
    (!selectedDocId && !fileToUpload) || isAnalyzing || fetchingDocs;
  const isFileInputDisabled = isAnalyzing || fetchingDocs;

  /* ═══════════════════  RENDER  ═══════════════════ */
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
            Risk Assessment
          </h1>
        </div>
      </header>

      {/* main panel */}
      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <SelectArea
            /* picker props */
            uploadedDocs={uploadedDocs}
            selectedDocId={selectedDocId}
            handleDocSelection={(id) => {
              setSelectedDocId(id);
              setFileToUpload(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              setResults(null);
              setError(null);
            }}
            docSelectOpen={docSelectOpen}
            setDocSelectOpen={setDocSelectOpen}
            /* upload props */
            fileToUpload={fileToUpload}
            fileInputRef={fileInputRef}
            onFileChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFileToUpload(e.target.files?.[0] || null)
            }
            handleFileDrop={(f) => setFileToUpload(f)}
            /* common */
            isAnalyzeDisabled={isAnalyzeDisabled}
            isFileInputDisabled={isFileInputDisabled}
            analyzing={isAnalyzing}
            fetchingDocs={fetchingDocs}
            handleAnalyze={handleAnalyze}
            error={error}
          />
        ) : (
          <ResultPane
            results={results}
            counts={counts}
            filtered={filtered}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            reset={reset}
          />
        )}
      </section>

      {/* history list */}
      <HistoryPane
        history={history}
        showAll={showAllHistory}
        setShowAll={setShowAllHistory}
        openReport={openReport}
        downloadRiskReport={(fileId: string, fn: string) =>
          downloadRiskReport(fileId!, fn) /* fileId guaranteed in caller */
        }
        setPendingDeleteId={setPendingDeleteId}
        isBusy={isAnalyzing || isDeletingHistory}
      />

      {/* delete confirmation */}
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
                    {isDeletingHistory ? "Deleting…" : "Delete"}
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

/* ───────────────  SUB-COMPONENTS  ─────────────── */

/* SelectArea — two-column picker (existing-doc picker + upload) */
function SelectArea(props: {
  /* picker */
  uploadedDocs: DocumentRecord[];
  selectedDocId: string | null;
  handleDocSelection: (id: string | null) => void;
  docSelectOpen: boolean;
  setDocSelectOpen: (v: boolean) => void;
  /* upload */
  fileToUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (f: File | null) => void;
  /* meta */
  isAnalyzeDisabled: boolean;
  isFileInputDisabled: boolean;
  analyzing: boolean;
  fetchingDocs: boolean;
  handleAnalyze: () => void;
  error: string | null;
}) {
  const {
    uploadedDocs,
    selectedDocId,
    handleDocSelection,
    docSelectOpen,
    setDocSelectOpen,
    fileToUpload,
    fileInputRef,
    onFileChange,
    handleFileDrop,
    isAnalyzeDisabled,
    isFileInputDisabled,
    analyzing,
    fetchingDocs,
    handleAnalyze,
    error,
  } = props;

  if (analyzing || fetchingDocs) {
    return <Spinner label={analyzing ? "Analyzing…" : "Loading documents…"} />;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Existing document picker */}
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
                        className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${selectedDocId === doc._id ? "bg-gray-100" : ""
                          }`}
                        onClick={() => {
                          handleDocSelection(doc._id);
                          setDocSelectOpen(false);
                        }}
                      >
                        {getFileIcon(doc.filename, DROPDOWN_ICON_SIZE)}
                        {doc.filename}
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

        {/* Upload drop zone */}
        <UploadDropZone
          fileToUpload={fileToUpload}
          fileInputRef={fileInputRef}
          isDisabled={isFileInputDisabled}
          onFileChange={onFileChange}
          handleFileDrop={handleFileDrop}
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
      className="flex items-center gap-2 rounded-md bg-[#c17829] px-6 py-2 text-white hover:bg-[#a66224] disabled:opacity-50"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {busy ? <FaSpinner className="animate-spin" /> : <FaSearch />}
      {busy ? "Analyzing…" : label}
    </motion.button>
  );
}

function UploadDropZone(props: {
  fileToUpload: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isDisabled: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (f: File | null) => void;
}) {
  const {
    fileToUpload,
    fileInputRef,
    isDisabled,
    onFileChange,
    handleFileDrop,
  } = props;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${isDisabled
        ? "cursor-not-allowed opacity-60"
        : "cursor-pointer hover:border-[#c17829]"
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

/* ───────────────  Result Pane  ─────────────── */
function ResultPane(props: {
  results: { id: string; riskItems: RiskItem[]; analyzedFilename?: string };
  counts: Record<Severity, number>;
  filtered: RiskItem[];
  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
  reset: () => void;
}) {
  const {
    results,
    counts,
    filtered,
    activeSection,
    setActiveSection,
    reset,
  } = props;

  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [filtered]);
  const displayed = showAll ? filtered : filtered.slice(0, 3);

  return (
    <>
      {/* header bar */}
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {results.analyzedFilename ? (
            getFileIcon(results.analyzedFilename, FILE_ICON_SIZE)
          ) : (
            <FaFileAlt className="text-5xl text-gray-500" />
          )}
          <h3 className="font-medium text-gray-800">
            {results.analyzedFilename || "Report"}
          </h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
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
              {lvl[0].toUpperCase() + lvl.slice(1)} Risk
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
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${activeSection.toLowerCase() === sec.toLowerCase()
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
              className={`ml-1 inline-block transition-transform ${showAll ? "rotate-180" : ""
                }`}
            />
          </button>
        )}
      </div>
    </>
  );
}

/* HistoryPane – unchanged visual design, just split out for clarity */
function HistoryPane(props: {
  history: RiskHistoryItem[];
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  openReport: (id: string) => void;
  downloadRiskReport: (docId: string, filename: string) => void;
  setPendingDeleteId: (id: string) => void;
  isBusy: boolean;
}) {
  const {
    history,
    showAll,
    setShowAll,
    openReport,
    downloadRiskReport,
    setPendingDeleteId,
    isBusy,
  } = props;

  return (
    <section className="rounded-xl border bg-white shadow-sm p-6">
      <h2 className="mb-4 font-medium text-[var(--brand-dark)]">
        Previous Risk Assessments
      </h2>
      {history.length === 0 ? (
        <p className="text-sm italic text-gray-500">No history yet.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {(showAll ? history : history.slice(0, 5)).map((h) => (
              <li
                key={h.id}
                className="flex flex-col rounded-lg border border-[#c17829]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="mb-3 sm:mb-0 min-w-0 flex-1">
                  <p className="flex items-start text-sm font-semibold text-gray-800">
                    <FaFileAlt className="mr-2 mt-0.5 text-[#c17829] flex-shrink-0" />
                    <span className="break-all">
                      {h.filename ?? h.report_filename ?? "Risk Report"}
                    </span>
                  </p>
                  <p className="ml-6 mt-1 text-xs text-gray-500 sm:ml-0 sm:pl-0">
                    {h.num_risks} risk{h.num_risks !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-3 self-end sm:self-center">
                  <button
                    onClick={() => openReport(h.id)}
                    className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                    disabled={isBusy}
                  >
                    <FaSearch /> View
                  </button>
                  {h.report_doc_id && (
                    <motion.button
                      onClick={() =>
                        downloadRiskReport(
                          h.report_doc_id as string,
                          h.report_filename ?? "risk_report.pdf"
                        )
                      }
                      className="flex items-center gap-1 text-sm text-[#c17829] hover:bg-[#a66224]/10 rounded-md px-3 py-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaDownload /> Download
                    </motion.button>
                  )}
                  <button
                    onClick={() => setPendingDeleteId(h.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    disabled={isBusy}
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
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-[#c17829] hover:underline"
              >
                {showAll ? "Show less" : "Show more"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default RiskAssessmentTool;
