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

const RephrasingTool: React.FC = () => {
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);

  const [originalText, setOriginalText] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [rephrasedDocDetails, setRephrasedDocDetails] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeStyle, setActiveStyle] = useState<StyleId>("formal");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const fetchUploadedDocuments = async () => {
    setFetchingDocs(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
    } catch (err: any) {
      console.error("Failed to fetch documents:", err);
      setError("Failed to load uploaded documents.");
    } finally {
      setFetchingDocs(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await uploadDocument(file);
      await fetchUploadedDocuments();
      setSelectedDocId(res.doc_id);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload document.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocSelection = (docId: string | null) => {
    setSelectedDocId(docId);
    setOriginalText(
      docId
        ? `Document selected: ${
            uploadedDocs.find((d) => d._id === docId)?.filename
          }`
        : ""
    );
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setError(null);
    setDocSelectOpen(false);
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value);
    setSelectedDocId(null);
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);
    setError(null);
  };

  const handleRephrase = async () => {
    setIsLoading(true);
    setError(null);
    setRephrasedText("");
    setRephrasedDocDetails(null);
    setChanges([]);

    try {
      if (selectedDocId) {
        // Document mode
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
        // Text mode
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
      console.error("Rephrase error:", err);
      setError(err.message || "Rephrase failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (rephrasedText) {
      navigator.clipboard.writeText(rephrasedText);
      setCopied(true);
    }
  };

  const handleDownloadDocument = (docId: string, filename: string) => {
    setIsLoading(true);
    setError(null);
    downloadDocumentById(docId, filename)
      .catch((err) => {
        console.error("Download error:", err);
        setError(`Download failed: ${err.message}`);
      })
      .finally(() => setIsLoading(false));
  };

  const originalTextPlaceholder = selectedDocId
    ? "Document content not shown here in document mode."
    : "Type your text here…";

  const rephrasedContent = selectedDocId ? (
    isLoading ? (
      <div className="flex h-full items-center justify-center">
        <FaSpinner className="animate-spin" size={28} />
      </div>
    ) : rephrasedDocDetails ? (
      <div className="flex flex-col items-center gap-4">
        <p>Document rephrased successfully!</p>
        <button
          onClick={() =>
            handleDownloadDocument(
              rephrasedDocDetails.id,
              rephrasedDocDetails.filename
            )
          }
          className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-white transition-colors hover:bg-[color:var(--accent-light)] disabled:opacity-50"
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
      <FaSpinner className="animate-spin" size={28} />
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
        <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
            <FaEdit size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[color:var(--brand-dark)]">
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
                ? "bg-[color:var(--accent-dark)] text-white"
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
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)] focus:border-[color:var(--accent-dark)] disabled:opacity-50"
            >
              {selectedDocId
                ? uploadedDocs.find((d) => d._id === selectedDocId)?.filename
                : "Select a Document"}
              {fetchingDocs ? (
                <FaSpinner className="animate-spin ml-2" />
              ) : (
                <FaChevronDown
                  className={`ml-2 transition-transform ${
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
                      <FaFileAlt className="inline-block mr-2 text-gray-500" />
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

          {/* Upload */}
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
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50"
            >
              <FaUpload /> Upload New Document
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Content Area */}
      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Original */}
          <div className="p-6">
            <h2 className="font-medium text-[color:var(--brand-dark)] mb-2">
              {selectedDocId ? "Selected Document" : "Original Text"}
            </h2>
            <textarea
              className="w-full h-64 resize-none rounded-lg border border-gray-300 p-4 focus:border-[color:var(--accent-dark)] focus:ring-2 focus:ring-[color:var(--accent-dark)] outline-none bg-gray-50"
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

          {/* Rephrased / Download */}
          <div className="p-6">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="font-medium text-[color:var(--brand-dark)]">
                {selectedDocId ? "Rephrased Document" : "Rephrased Text"}
              </h2>
              {!selectedDocId && rephrasedText && (
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
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

        {/* Suggested Changes */}
        {changes.length > 0 && (
          <section className="p-6">
            <h2 className="font-medium text-[color:var(--brand-dark)] mb-2">
              Suggested Changes
            </h2>
            <ul className="space-y-2">
              {changes.map((c, i) => (
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
            className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white transition-colors disabled:opacity-50 hover:bg-[color:var(--accent-light)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaExchangeAlt />
            )}
            {isLoading
              ? "Processing..."
              : selectedDocId
              ? "Rephrase Document"
              : "Rephrase Text"}
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default RephrasingTool;
