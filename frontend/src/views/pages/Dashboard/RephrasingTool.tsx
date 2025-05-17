// src/views/pages/Dashboard/RephrasingTool.tsx
import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import {
  FaEdit,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaExchangeAlt,
  FaCopy,
  FaCheck,
  FaDownload,
  FaSpinner,
  FaChevronDown,
  FaFilePdf,
  FaFileWord,
  FaSearch,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  uploadDocument,
  listDocuments,
  rephrase,
  downloadDocumentById,
  DocumentRecord,
  RephraseTextResponse,
  RephraseDocumentResponse,
  listRephraseHistory,
  deleteRephraseReport,
  RephraseHistoryItem,
} from "../../../api";

export interface Change {
  original: string;
  revised: string;
}

const STYLE_OPTIONS = [
  { id: "formal", label: "Formal" },
  { id: "clear", label: "Clear" },
  { id: "persuasive", label: "Persuasive" },
  { id: "concise", label: "Concise" },
] as const;
type StyleId = (typeof STYLE_OPTIONS)[number]["id"];

const FILE_ICON_SIZE = "text-5xl";
const DROPDOWN_ICON_SIZE = "text-xl";

const getFileIcon = (filename: string | undefined, sizeClassName: string) => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "pdf")
    return <FaFilePdf className={`${sizeClassName} text-red-600`} />;
  if (ext === "doc" || ext === "docx")
    return <FaFileWord className={`${sizeClassName} text-blue-600`} />;
  return <FaFileAlt className={`${sizeClassName} text-gray-500`} />;
};

/* ─────────────────────────────── COMPONENT ─────────────────────────────── */
const RephrasingTool: React.FC = () => {
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<RephraseHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  const [originalText, setOriginalText] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [rephrasedDocDetails, setRephrasedDocDetails] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [showAllChanges, setShowAllChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStyle, setActiveStyle] = useState<StyleId>("formal");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUploadedDocuments();
    loadHistory();
  }, []);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  async function fetchUploadedDocuments() {
    setFetchingDocs(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
      if (selectedDocId && !docs.find((d) => d._id === selectedDocId))
        setSelectedDocId(null);
    } catch {
      setError("Failed to load uploaded documents.");
    } finally {
      setFetchingDocs(false);
    }
  }

  async function loadHistory() {
    try {
      const h = await listRephraseHistory();
      h.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(h);
    } catch {
      /* ignore */
    }
  }

  function handleDocSelection(id: string | null) {
    setSelectedDocId(id);
    setFileToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOriginalText(
      id
        ? `Document selected: ${
            uploadedDocs.find((d) => d._id === id)?.filename
          }`
        : ""
    );
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setShowAllChanges(false);
    setError(null);
  }

  function handleFileDrop(f: File | null) {
    if (!f) return;
    setError(null);
    setFileToUpload(f);
    setSelectedDocId(null);
    setOriginalText("");
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setShowAllChanges(false);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFileDrop(e.target.files?.[0] || null);
  }

  const handleRephrase = async () => {
    setIsLoading(true);
    setError(null);
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setShowAllChanges(false);

    try {
      if (fileToUpload) {
        const { doc_id } = await uploadDocument(fileToUpload);
        fetchUploadedDocuments();
        const resp = (await rephrase({
          doc_id,
          style: activeStyle,
        })) as RephraseDocumentResponse & { changes: Change[] };
        setRephrasedDocDetails({
          id: resp.rephrased_doc_id,
          filename: resp.rephrased_doc_filename,
        });
        setChanges(resp.changes || []);
      } else if (selectedDocId) {
        const resp = (await rephrase({
          doc_id: selectedDocId,
          style: activeStyle,
        })) as RephraseDocumentResponse & { changes: Change[] };
        setRephrasedDocDetails({
          id: resp.rephrased_doc_id,
          filename: resp.rephrased_doc_filename,
        });
        setChanges(resp.changes || []);
      } else if (originalText.trim()) {
        const resp = (await rephrase({
          document_text: originalText,
          style: activeStyle,
        })) as RephraseTextResponse & { changes: Change[] };
        setRephrasedText(resp.rephrased_text);
        setChanges(resp.changes || []);
      } else {
        setError("Please enter text or choose a document.");
      }
    } catch (err: any) {
      setError(err.message || "Rephrase failed.");
    } finally {
      setIsLoading(false);
      loadHistory();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rephrasedText);
    setCopied(true);
  };

  const handleDownloadText = (text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rephrased.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeletingHistory(true);
    try {
      await deleteRephraseReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
    } finally {
      setIsDeletingHistory(false);
      setPendingDeleteId(null);
    }
  };

  const originalTextPlaceholder =
    selectedDocId || fileToUpload
      ? "Document content not shown in document mode."
      : "Type your text here…";

  const displayedHistory = (
    showAllHistory ? history : history.slice(0, 5)
  ).filter(
    (h) => !(h.type === "doc" && h.filename?.toLowerCase().endsWith(".txt"))
  );
  const displayedChanges = showAllChanges ? changes : changes.slice(0, 5);

  const isRephraseDisabled =
    (!originalText.trim() && !selectedDocId && !fileToUpload) ||
    isLoading ||
    fetchingDocs;

  const Spinner = ({ label }: { label: string }) => (
    <div className="py-12 text-center text-gray-700">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#c17829]" />
      <p className="mt-2">{label}</p>
    </div>
  );

  const AnalyzeButton = ({
    onClick,
    disabled,
    busy,
    label,
  }: {
    onClick: () => void;
    disabled: boolean;
    busy: boolean;
    label: string;
  }) => (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-md bg-[#c17829] px-6 py-2 text-white hover:bg-[#a66224]"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {busy ? <FaSpinner className="animate-spin" /> : <FaSearch />}
      {busy ? "Processing…" : label}
    </motion.button>
  );

  const ExistingDocPicker = () => (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-gray-50 p-6">
      <p className="text-gray-700">Rephrase a previously uploaded document:</p>
      <div className="relative w-full">
        <button
          className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
          onClick={() => setDocSelectOpen(!docSelectOpen)}
          disabled={isLoading}
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
                    className={`cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
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
          onClick={handleRephrase}
          disabled={isRephraseDisabled}
          busy={isLoading}
          label="Rephrase Selected"
        />
      )}
    </div>
  );

  const UploadDropZone = () => (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
        isLoading
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-[#c17829]"
      }`}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (isLoading) return;
        const f = e.dataTransfer.files?.[0];
        if (f) handleFileDrop(f);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        disabled={isLoading}
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
          <p className="text-xs text-gray-400">
            Accepted: PDF, DOCX (Text only)
          </p>
        </>
      )}
    </div>
  );

  const SelectArea = () => {
    if (isLoading || fetchingDocs) {
      return (
        <Spinner label={isLoading ? "Processing…" : "Loading documents…"} />
      );
    }
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ExistingDocPicker />
          <UploadDropZone />
        </div>
        {fileToUpload && !selectedDocId && (
          <div className="text-center">
            <AnalyzeButton
              onClick={handleRephrase}
              disabled={isRephraseDisabled}
              busy={isLoading}
              label="Rephrase Uploaded"
            />
          </div>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  const rephrasedContent =
    selectedDocId || fileToUpload ? (
      isLoading ? (
        <div className="flex h-full items-center justify-center">
          <FaSpinner className="animate-spin text-[#c17829]" size={28} />
        </div>
      ) : rephrasedDocDetails ? (
        <div className="flex flex-col items-center gap-4">
          <p>Document rephrased successfully!</p>
          <button
            onClick={() =>
              downloadDocumentById(
                rephrasedDocDetails.id,
                rephrasedDocDetails.filename
              )
            }
            className="inline-flex items-center gap-2 rounded-md bg-[#c17829] px-4 py-2 text-white transition-colors hover:bg-[#a66224]"
          >
            <FaDownload /> Download Rephrased
          </button>
        </div>
      ) : (
        <p className="italic text-gray-400">
          Rephrased document will appear here…
        </p>
      )
    ) : isLoading ? (
      <div className="flex h-full items-center justify-center">
        <FaSpinner className="animate-spin text-[#c17829]" size={28} />
      </div>
    ) : rephrasedText ? (
      <pre className="whitespace-pre-line text-gray-800">{rephrasedText}</pre>
    ) : (
      <p className="italic text-gray-400">
        Your rephrased text will appear here…
      </p>
    );

  return (
    <div className="space-y-8 p-6">
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#c17829] to-[var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[var(--accent-light)] p-3">
            <FaEdit className="text-[#c17829]" size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--brand-dark)]">
              Rephrasing
            </h1>
            <p className="text-gray-600">
              {selectedDocId || fileToUpload ? "Document Mode" : "Text Mode"} —
              choose a style
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 px-6">
        {STYLE_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveStyle(id)}
            className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
              activeStyle === id
                ? "bg-[#c17829] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-xl border bg-white shadow-sm">
        <SelectArea />
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="grid divide-gray-200 md:grid-cols-2 md:divide-x">
          <div className="p-6">
            <h2 className="mb-2 font-medium text-[var(--brand-dark)]">
              {selectedDocId || fileToUpload
                ? "Selected / Uploaded Document"
                : "Original Text"}
            </h2>
            <textarea
              className="h-64 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-4 outline-none focus:border-[#c17829] focus:ring-2 focus:ring-[#c17829]"
              placeholder={originalTextPlaceholder}
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              disabled={!!selectedDocId || !!fileToUpload || isLoading}
              readOnly={!!selectedDocId || !!fileToUpload}
            />
            {(selectedDocId || fileToUpload) && !isLoading && (
              <p className="mt-2 text-sm text-gray-600">
                Ready to rephrase selected document.
              </p>
            )}
          </div>
          <div className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-medium text-[var(--brand-dark)]">
                {selectedDocId || fileToUpload
                  ? "Rephrased Document"
                  : "Rephrased Text"}
              </h2>
              {!(selectedDocId || fileToUpload) && rephrasedText && (
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224]"
                >
                  {copied ? <FaCheck /> : <FaCopy />}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <div className="h-64 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
              {rephrasedContent}
            </div>
          </div>
        </div>

        {changes.length > 0 && (
          <section className="p-6">
            <h2 className="mb-2 font-medium text-[var(--brand-dark)]">
              Suggested Changes
            </h2>
            <ul className="space-y-2">
              {displayedChanges.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border p-3 transition-shadow hover:shadow-md"
                >
                  <p className="mb-1 text-sm text-gray-600">
                    <strong>Replace:</strong>{" "}
                    <span className="rounded bg-yellow-100 px-1">
                      {c.original}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>With:</strong>{" "}
                    <span className="rounded bg-green-100 px-1">
                      {c.revised}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            {changes.length > 5 && (
              <button
                onClick={() => setShowAllChanges(!showAllChanges)}
                className="mt-2 text-sm text-[#c17829] hover:underline"
              >
                {showAllChanges
                  ? "Show Less"
                  : `Show ${changes.length - 5} More`}
              </button>
            )}
          </section>
        )}

        {!(selectedDocId || fileToUpload) && (
          <div className="flex justify-end bg-gray-50 p-4">
            <AnalyzeButton
              onClick={handleRephrase}
              disabled={isRephraseDisabled}
              busy={isLoading}
              label="Rephrase Text"
            />
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-medium text-[var(--brand-dark)]">
          Previous Rephrasings
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
                  <div className="min-w-0 flex-1 sm:mb-0 mb-3">
                    <p className="flex items-start text-sm font-semibold text-gray-800">
                      <span className="mr-2 mt-0.5 flex-shrink-0 text-[#c17829]">
                        {h.type === "doc"
                          ? getFileIcon(h.filename, DROPDOWN_ICON_SIZE)
                          : getFileIcon(undefined, DROPDOWN_ICON_SIZE)}
                      </span>
                      <span className="break-all">
                        {h.type === "doc"
                          ? h.filename || "Document"
                          : "Text snippet"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Style: {h.style}
                    </p>
                  </div>
                  <div className="flex gap-3 self-end sm:self-center">
                    {h.type === "doc" && h.result_doc_id && h.filename && (
                      <motion.button
                        onClick={() =>
                          downloadDocumentById(h.result_doc_id!, h.filename!)
                        }
                        className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-[#c17829] hover:bg-[#a66224]/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaDownload /> Download
                      </motion.button>
                    )}
                    {h.type === "text" && h.result_text && (
                      <motion.button
                        onClick={() => handleDownloadText(h.result_text!)}
                        className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-[#c17829] hover:bg-[#a66224]/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaDownload /> Download
                      </motion.button>
                    )}
                    <button
                      onClick={() => setPendingDeleteId(h.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
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
                  Delete Rephrased Result
                </h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this rephrased result? This
                  action cannot be undone.
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
                    {isDeletingHistory && (
                      <FaSpinner className="mr-2 inline-block animate-spin" />
                    )}
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

export default RephrasingTool;
