// src/views/pages/Dashboard/RephrasingTool.tsx

import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import {
  FaEdit,
  FaUpload,
  FaFileAlt,
  FaTrash,
  FaExchangeAlt,
  FaCopy,
  FaCheck,
  FaDownload,
  FaSpinner,
  FaChevronDown,
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
  { id: "formal" as const, label: "Formal" },
  { id: "clear" as const, label: "Clear" },
  { id: "persuasive" as const, label: "Persuasive" },
  { id: "concise" as const, label: "Concise" },
];
type StyleId = (typeof STYLE_OPTIONS)[number]["id"];

// Saudi Arabia is UTC+3
const SA_OFFSET_MINUTES = 3 * 60;
function formatDateSA(iso: string, locale = navigator.language) {
  const d = new Date(iso);
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const saMs = utcMs + SA_OFFSET_MINUTES * 60 * 1000;
  return new Date(saMs).toLocaleString(locale);
}

const RephrasingTool: React.FC = () => {
  /* state hooks */
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);
  const [history, setHistory] = useState<RephraseHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
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

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Derived slices */
  const displayedHistory = showAllHistory ? history : history.slice(0, 5);
  const displayedChanges = showAllChanges ? changes : changes.slice(0, 5);

  /* on‑mount data fetch */
  useEffect(() => {
    fetchUploadedDocuments();
    loadHistory();
  }, []);

  /* copied flash */
  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  /* fetch docs */
  async function fetchUploadedDocuments() {
    setFetchingDocs(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load uploaded documents.");
    } finally {
      setFetchingDocs(false);
    }
  }

  /* fetch history */
  async function loadHistory() {
    try {
      const h = await listRephraseHistory();
      // Sort so the newest rephrases come first
      h.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(h);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Select a document, optionally with a filename override
   * (used right after uploading, before listDocuments refresh completes).
   */
  const handleDocSelection = (
    docId: string | null,
    filenameOverride?: string
  ) => {
    setSelectedDocId(docId);
    setOriginalText(
      docId
        ? `Document selected: ${
            filenameOverride ??
            uploadedDocs.find((d) => d._id === docId)?.filename ??
            ""
          }`
        : ""
    );
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setShowAllChanges(false);
    setError(null);
    setDocSelectOpen(false);
  };

  /* upload AND immediately select */
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await uploadDocument(file);
      // optimistically add
      setUploadedDocs((prev) => [
        ...prev,
        { _id: res.doc_id, filename: file.name, owner_id: "", file_id: "" },
      ]);
      handleDocSelection(res.doc_id, file.name);
    } catch (err: any) {
      console.error(err);
      setError("Failed to upload document.");
    } finally {
      setIsLoading(false);
      loadHistory();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* text input */
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value);
    setSelectedDocId(null);
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setShowAllChanges(false);
    setError(null);
  };

  /* rephrase */
  const handleRephrase = async () => {
    setIsLoading(true);
    setError(null);
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setShowAllChanges(false);

    try {
      if (selectedDocId) {
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
        setError("Please enter text or select a document.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Rephrase failed");
    } finally {
      setIsLoading(false);
      loadHistory();
    }
  };

  /* copy */
  const handleCopy = () => {
    navigator.clipboard.writeText(rephrasedText);
    setCopied(true);
  };

  /* download text */
  const handleDownloadText = (text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rephrased.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* delete history */
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeletingHistory(true);
    try {
      await deleteRephraseReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setIsDeletingHistory(false);
      setPendingDeleteId(null);
    }
  };

  const originalTextPlaceholder = selectedDocId
    ? "Document content not shown here in document mode."
    : "Type your text here…";

  const rephrasedContent = selectedDocId ? (
    isLoading ? (
      <div className="flex h-full items-center justify-center">
        <FaSpinner className="text-[#c17829] animate-spin" size={28} />
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
          className="inline-flex items-center gap-2 rounded-md bg-[#c17829] px-4 py-2 text-white hover:bg-[#a66224] transition-colors"
        >
          <FaDownload /> Download "{rephrasedDocDetails.filename}"
        </button>
      </div>
    ) : (
      <p className="italic text-gray-400">
        Rephrased document will appear here…
      </p>
    )
  ) : isLoading ? (
    <div className="flex h-full items-center justify-center">
      <FaSpinner className="text-[#c17829] animate-spin" size={28} />
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
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#c17829] to-[var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[var(--accent-light)] p-3">
            <FaEdit className="text-[#c17829]" size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--brand-dark)]">
              Rephrasing Tool
            </h1>
            <p className="text-gray-600">
              {selectedDocId ? "Document Mode" : "Text Mode"} — choose a style
            </p>
          </div>
        </div>
      </header>

      {/* Style selector */}
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

      {/* Document Selection & Upload */}
      <div className="px-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setDocSelectOpen(!docSelectOpen)}
              disabled={fetchingDocs || isLoading}
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#c17829] focus:border-[#c17829] disabled:opacity-50"
            >
              {selectedDocId
                ? uploadedDocs.find((d) => d._id === selectedDocId)?.filename
                : "Select a Document"}
              {fetchingDocs ? (
                <FaSpinner className="text-[#c17829] animate-spin ml-2" />
              ) : (
                <FaChevronDown
                  className={`text-[#c17829] ml-2 ${
                    docSelectOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>
            <AnimatePresence>
              {docSelectOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-2 w-full sm:w-48 bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 overflow-auto"
                >
                  {selectedDocId && (
                    <li
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleDocSelection(null)}
                    >
                      Clear Selection
                    </li>
                  )}
                  {uploadedDocs.map((doc) => (
                    <li
                      key={doc._id}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleDocSelection(doc._id)}
                    >
                      <FaFileAlt className="inline-block mr-2 text-[#c17829]" />
                      {doc.filename}
                    </li>
                  ))}
                  {uploadedDocs.length === 0 && (
                    <li className="px-4 py-2 text-sm text-gray-500 italic">
                      No documents uploaded.
                    </li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <span className="text-gray-500">OR</span>

          {/* Upload button */}
          <div>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || fetchingDocs}
              className="inline-flex items-center gap-2 rounded-md bg-[#c17829] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a66224] transition-colors disabled:opacity-50"
            >
              <FaUpload className="text-white" /> Upload New Document
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Content Area */}
      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Original Text / Document */}
          <div className="p-6">
            <h2 className="font-medium text-[var(--brand-dark)] mb-2">
              {selectedDocId ? "Selected Document" : "Original Text"}
            </h2>
            <textarea
              className="w-full h-64 resize-none rounded-lg border border-gray-300 p-4 focus:border-[#c17829] focus:ring-2 focus:ring-[#c17829] outline-none bg-gray-50"
              placeholder={originalTextPlaceholder}
              value={originalText}
              onChange={handleTextChange}
              disabled={!!selectedDocId || isLoading}
              readOnly={!!selectedDocId}
            />
            {selectedDocId && !isLoading && (
              <p className="mt-2 text-sm text-gray-600">
                Ready to rephrase document ID: {selectedDocId}
              </p>
            )}
          </div>

          {/* Rephrased Text / Download */}
          <div className="p-6">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="font-medium text-[var(--brand-dark)]">
                {selectedDocId ? "Rephrased Document" : "Rephrased Text"}
              </h2>
              {!selectedDocId && rephrasedText && (
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224]"
                >
                  {copied ? (
                    <FaCheck className="text-[#c17829]" />
                  ) : (
                    <FaCopy className="text-[#c17829]" />
                  )}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <div className="h-64 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
              {rephrasedContent}
            </div>
          </div>
        </div>

        {/* Suggested Changes */}
        {changes.length > 0 && (
          <section className="p-6">
            <h2 className="font-medium text-[var(--brand-dark)] mb-2">
              Suggested Changes
            </h2>
            <ul className="space-y-2">
              {displayedChanges.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border p-3 hover:shadow-md transition-shadow"
                >
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Replace:</strong>{" "}
                    <span className="bg-yellow-100 px-1 rounded">
                      {c.original}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>With:</strong>{" "}
                    <span className="bg-green-100 px-1 rounded">
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

        {/* Action Button */}
        <div className="bg-gray-50 p-4 flex justify-end">
          <motion.button
            onClick={handleRephrase}
            disabled={
              (!originalText.trim() && !selectedDocId) ||
              isLoading ||
              fetchingDocs
            }
            className="flex items-center gap-2 rounded-md bg-[#c17829] px-6 py-2 text-white hover:bg-[#a66224] disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <FaSpinner className="text-white animate-spin" />
            ) : (
              <FaExchangeAlt className="text-white" />
            )}
            {isLoading
              ? "Processing..."
              : selectedDocId
              ? "Rephrase Document"
              : "Rephrase Text"}
          </motion.button>
        </div>
      </section>

      {/* Previous Rephrasings */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="font-medium text-gray-800 mb-4">Previous Rephrasings</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No history yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {displayedHistory.map((h) => (
                <li
                  key={h.id}
                  className="rounded-lg border border-[#c17829]/30 bg-white shadow-sm p-4 flex justify-between items-center hover:shadow-lg transition-shadow"
                >
                  <div>
                    <p className="font-semibold flex items-center text-sm text-gray-800">
                      <FaFileAlt className="mr-2 text-[#c17829]" />
                      {h.type === "doc"
                        ? h.filename || "Document"
                        : "Text snippet"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Style: {h.style}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {h.type === "doc" && h.result_doc_id && h.filename ? (
                      <button
                        onClick={() =>
                          downloadDocumentById(h.result_doc_id!, h.filename!)
                        }
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224]"
                      >
                        <FaDownload /> Download
                      </button>
                    ) : h.type === "text" && h.result_text ? (
                      <button
                        onClick={() => handleDownloadText(h.result_text!)}
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224]"
                      >
                        <FaDownload /> Download
                      </button>
                    ) : null}
                    <button
                      onClick={() => setPendingDeleteId(h.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {history.length > 5 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="mt-4 text-sm text-[#c17829] hover:underline"
              >
                {showAllHistory
                  ? "Show Less"
                  : `Show ${history.length - 5} More`}
              </button>
            )}
          </>
        )}
      </section>

      {/* Delete Confirmation Modal */}
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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeletingHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
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
