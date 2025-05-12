/*  src/views/pages/Dashboard/TranslationTool.tsx  */

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  translateText,
  translateFile,
  listTranslationHistory,
  deleteTranslationReport,
  getTranslationReport,
  downloadDocumentById,
  TranslationHistoryItem,
} from "../../../api";

import {
  FaLanguage,
  FaCopy,
  FaCheck,
  FaFileUpload,
  FaFileAlt,
  FaInfoCircle,
  FaExchangeAlt,
  FaSearch,
  FaTrash,
  FaDownload,
  FaSpinner,
  FaChevronDown,
  FaFilePdf, // Added for consistency, though only docx is currently handled
  FaFileWord, // Added for consistency
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)"; // Not directly used in the history list but present in ComplianceChecker

/* what the viewer needs regardless of report type */
interface DisplayResult {
  report_id: string;
  type: "text" | "doc";
  translatedText?: string;
  translatedFilename?: string | null;
  resultDocId?: string | null;
  target_lang: string;
  created_at?: string;
}
/* ────────────────────────────────────────────────────────────── */
const TranslationTool: React.FC = () => {
  /* fresh translate (state) ----------------------------------- */
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromEnglish, setFromEnglish] = useState(true);
  const [copied, setCopied] = useState(false);

  /* file translation mode */
  const [file, setFile] = useState<File | null>(null);
  const [docProcessing, setDocProcessing] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  /* history ---------------------------------------------------------------- */
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false); // Added for consistency

  /* currently opened result (fresh or history) ----------------------------- */
  const [result, setResult] = useState<DisplayResult | null>(null);

  /* delete modal state */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null); // Added for consistency
  const [isDeleting, setIsDeleting] = useState(false); // Added for consistency

  /* init load */
  useEffect(() => {
    loadHistory();
  }, []);
  async function loadHistory() {
    try {
      setHistory(await listTranslationHistory());
    } catch (e) {
      console.error("Translation history failed", e);
      // Optionally set an error state for the history section
    }
  }

  const srcLangLabel = fromEnglish ? "English" : "Arabic";
  const tgtLangLabel = fromEnglish ? "Arabic" : "English";

  const FILE_ICON_SIZE = "text-5xl"; // Keep size consistent with ComplianceChecker where relevant
  const DROPDOWN_ICON_SIZE = "text-xl"; // Keep size consistent with ComplianceChecker

  /* helper icon for files - adapted from ComplianceChecker */
  const getFileIcon = (
    filename: string | null | undefined,
    sizeClassName: string
  ) => {
    if (!filename)
      return <FaFileAlt className={`${sizeClassName} text-gray-500`} />;
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FaFilePdf className={`${sizeClassName} text-red-600`} />;
    }
    if (ext === "doc" || ext === "docx") {
      return <FaFileWord className={`${sizeClassName} text-blue-600`} />;
    }
    return <FaFileAlt className={`${sizeClassName} text-gray-500`} />;
  };

  /* ───────────────────── TRANSLATE actions ───────────────────── */
  const handleTranslate = async () => {
    setIsTranslating(true);
    // Clear previous results and file URL when starting a new translation
    setResult(null);
    setDocUrl(null);
    setTranslatedText("");

    if (file) {
      /* File → server returns blob */
      setDocProcessing(true);
      try {
        // Clear source text when doing file translation
        setSourceText("");
        // Fix: Assert the expected return type to include report_id
        const { blob, filename, report_id } = (await translateFile(
          file,
          tgtLangLabel.toLowerCase()
        )) as { blob: Blob; filename: string; report_id: string };

        const url = URL.createObjectURL(blob);
        setDocUrl(url);
        /* viewer - set result for history visibility */
        setResult({
          report_id,
          type: "doc",
          translatedFilename: filename,
          target_lang: tgtLangLabel.toLowerCase(),
          // resultDocId might not be needed immediately if we have the blob/url, but keep structure consistent
        });
        await loadHistory();
      } catch (e) {
        console.error(e);
        alert(
          `File translation failed: ${(e as any).message || "Unknown error"}`
        );
      }
      setDocProcessing(false);
    } else {
      /* Text translation */
      if (!sourceText.trim()) {
        setIsTranslating(false);
        return; // Don't translate empty text
      }
      try {
        const { translated_text, report_id } = await translateText(
          sourceText,
          tgtLangLabel.toLowerCase()
        );
        setTranslatedText(translated_text);
        setResult({
          report_id,
          type: "text",
          translatedText: translated_text,
          target_lang: tgtLangLabel.toLowerCase(),
        });
        loadHistory(); // Reload history after a successful text translation
      } catch (e) {
        console.error(e);
        alert(
          `Text translation failed: ${(e as any).message || "Unknown error"}`
        );
      }
      setIsTranslating(false);
    }
  };

  /* ───────────────────── history helpers ───────────────────── */
  async function openReport(id: string) {
    try {
      const rep = await getTranslationReport(id);
      const r: DisplayResult = {
        report_id: rep._id ?? id,
        type: rep.type,
        translatedText: rep.translated_text,
        translatedFilename: rep.translated_filename,
        resultDocId: rep.result_doc_id,
        target_lang: rep.target_lang,
        created_at: rep.timestamp,
      };
      /* auto‑switch UI direction based on report */
      setFromEnglish(r.target_lang.toLowerCase() === "arabic");
      /* reset local input / file */
      setFile(null);
      setDocUrl(null); // Clear local doc URL when opening history
      setTranslatedText(r.translatedText ?? "");
      setSourceText(rep.source_text ?? ""); // Populate source text if available
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open translation report");
    }
  }

  /* queue delete modal - adapted from ComplianceChecker */
  function removeReport(id: string) {
    setPendingDeleteId(id);
  }

  /* confirm deletion - adapted from ComplianceChecker */
  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteTranslationReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      // If the currently viewed report is deleted, clear the view
      if (result?.report_id === pendingDeleteId) {
        setResult(null);
        // Optionally reset the main translation area if the viewed report was the only thing there
        setSourceText("");
        setTranslatedText("");
        setFile(null);
        setDocUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (e: any) {
      alert(e.message || "Delete failed");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  /* copy text helper */
  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  };

  /* file select / drag‑drop */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null); // Clear previous doc URL
    setTranslatedText(""); // Clear previous text translation result
    setSourceText(""); // Clear source text when switching to file mode
    setResult(null); // Clear previous result view
    if (fileInputRef.current) fileInputRef.current.value = ""; // Allow selecting the same file again
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null); // Clear previous doc URL
    setTranslatedText(""); // Clear previous text translation result
    setSourceText(""); // Clear source text when switching to file mode
    setResult(null); // Clear previous result view
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input visually
  };

  /* disable translate? */
  const translateDisabled =
    (file ? false : !sourceText.trim()) || isTranslating || docProcessing;

  /* ──────────────────────────────── UI ─────────────────────────────── */
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* ───── Header - KEPT SAME */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div
          className="h-2 bg-gradient-to-r"
          style={{
            background: `linear-gradient(to right, ${ACCENT.dark}, ${ACCENT.light})`,
          }}
        />
        <div className="flex items-center gap-4 p-6">
          <span
            className="rounded-full p-3"
            style={{ background: ACCENT.light, color: ACCENT.dark }}
          >
            <FaLanguage size={22} />
          </span>
          <div>
            <h1
              className="font-serif text-2xl font-bold"
              style={{ color: BRAND.dark }}
            >
              Translation
            </h1>
            <p className="text-gray-600">
              {srcLangLabel} ↔ {tgtLangLabel}
            </p>
          </div>
        </div>
      </header>

      {/* ───── Direction menu - KEPT SAME */}
      <div className="flex space-x-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => {
            setFromEnglish(true);
            // Clear results/inputs when changing direction
            setSourceText("");
            setTranslatedText("");
            setFile(null);
            setDocUrl(null);
            setResult(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${
            fromEnglish
              ? "bg-[color:var(--accent-dark)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          English → Arabic
        </button>
        <button
          onClick={() => {
            setFromEnglish(false);
            // Clear results/inputs when changing direction
            setSourceText("");
            setTranslatedText("");
            setFile(null);
            setDocUrl(null);
            setResult(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${
            !fromEnglish
              ? "bg-[color:var(--accent-dark)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Arabic → English
        </button>
      </div>

      {/* ───── Upload zone - KEPT MOSTLY SAME, ADDED FILE CLEAR */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isTranslating || docProcessing // Disable dropzone while processing
              ? "cursor-not-allowed opacity-60 border-gray-300"
              : "cursor-pointer hover:border-[color:var(--accent-dark)] border-gray-300"
          }`}
          onClick={() =>
            !(isTranslating || docProcessing) && fileInputRef.current?.click()
          }
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={onFileChange}
            disabled={isTranslating || docProcessing} // Disable input while processing
          />
          {file ? (
            <>
              {getFileIcon(file.name, FILE_ICON_SIZE)}
              <p className="mt-2 font-medium text-gray-700 break-all text-sm">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering file input click
                  setFile(null);
                  setDocUrl(null);
                  setTranslatedText("");
                  setSourceText("");
                  setResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
                }}
                disabled={isTranslating || docProcessing} // Disable clear while processing
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Clear File
              </button>
            </>
          ) : (
            <>
              <FaFileUpload className="text-5xl text-gray-400" />
              <p className="mt-2 text-gray-700">Upload Document</p>
              <p className="text-xs text-gray-400">PDF, DOCX, TXT</p>
            </>
          )}
        </div>
      </div>

      {/* ───── Editor / Result viewer - KEPT MOSTLY SAME, ADJUSTED FILE MODE BUTTON */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ========= FILE MODE ========= */}
        {file ? (
          <div className="p-6 text-center space-y-4">
            {!docUrl ? (
              docProcessing ? (
                <Spinner text="Translating document…" />
              ) : (
                <motion.button
                  onClick={handleTranslate}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[color:var(--accent-dark)] text-white rounded-md shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: translateDisabled ? 1 : 1.05 }}
                  whileTap={{ scale: translateDisabled ? 1 : 0.95 }}
                  disabled={translateDisabled}
                >
                  {isTranslating || docProcessing ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaSearch />
                  )}
                  {isTranslating || docProcessing
                    ? "Translating…"
                    : "Translate Document"}
                </motion.button>
              )
            ) : (
              <a
                href={docUrl}
                download={
                  result?.translatedFilename || "translated_document.docx"
                } // Use translated filename if available
                className="inline-flex items-center gap-2 px-6 py-2 bg-[color:var(--accent-light)] text-[color:var(--accent-dark)] rounded-md shadow-sm hover:bg-[color:var(--accent-dark)] hover:text-white transition-colors"
              >
                <FaDownload /> Download Translated DOCX
              </a>
            )}
          </div>
        ) : (
          /* ========= TEXT MODE ========= */
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Source */}
            <div className="p-6">
              <h2 className="font-semibold mb-2" style={{ color: BRAND.dark }}>
                Source Text ({srcLangLabel})
              </h2>
              <textarea
                className="w-full h-56 border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)] resize-none" // Added resize-none
                placeholder={`Type or paste ${srcLangLabel} here…`}
                value={sourceText}
                onChange={(e) => {
                  setSourceText(e.target.value);
                  setTranslatedText(""); // Clear translated text when source changes
                  setResult(null); // Clear result view when source changes
                }}
                disabled={isTranslating || docProcessing} // Disable while processing
              />
            </div>

            {/* Translated */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold" style={{ color: BRAND.dark }}>
                  Translated ({tgtLangLabel})
                </h2>
                {translatedText && ( // Show copy button only when there is translated text
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline disabled:opacity-50"
                    disabled={!translatedText} // Disable copy if no translated text
                  >
                    {copied ? <FaCheck /> : <FaCopy />}{" "}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="h-56 border rounded-md p-4 bg-gray-50 overflow-y-auto whitespace-pre-wrap text-gray-800">
                {" "}
                {/* Added whitespace-pre-wrap */}
                {isTranslating && !docProcessing ? ( // Show text spinner only for text translation
                  <Spinner />
                ) : translatedText ? (
                  translatedText
                ) : (
                  <p className="text-gray-400 italic">
                    Translated text will appear here…
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions bar - KEPT SAME */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <motion.button
            onClick={() => {
              setFromEnglish(!fromEnglish);
              // Clear results/inputs when swapping
              setSourceText("");
              setTranslatedText("");
              setFile(null);
              setDocUrl(null);
              setResult(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="flex items-center gap-2 rounded-md px-4 py-2 bg-white shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isTranslating || docProcessing ? 1 : 1.05 }}
            whileTap={{ scale: isTranslating || docProcessing ? 1 : 0.95 }}
            disabled={isTranslating || docProcessing}
          >
            <FaExchangeAlt /> Swap Directions
          </motion.button>
          {!file && ( // Show translate button only in text mode
            <motion.button
              onClick={handleTranslate}
              disabled={translateDisabled}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-white transition-colors ${
                translateDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[color:var(--accent-dark)] hover:bg-[color:var(--accent-light)]"
              }`}
              whileHover={{
                scale: translateDisabled ? 1 : 1.05,
              }}
              whileTap={{
                scale: translateDisabled ? 1 : 0.95,
              }}
            >
              {isTranslating && !docProcessing ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaLanguage />
              )}{" "}
              {/* Show text spinner */}
              <span>
                {isTranslating && !docProcessing ? "Translating…" : "Translate"}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Notice - KEPT SAME */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <FaInfoCircle className="text-yellow-500 mt-1 flex-shrink-0" />{" "}
        {/* Added flex-shrink-0 */}
        <div>
          <h4 className="font-medium text-yellow-800">Important Notice</h4>
          <p className="text-sm text-yellow-700">
            Machine translation is for reference only. Review with a
            professional before use.
          </p>
        </div>
      </div>
      {/* ───── History - ADAPTED STYLING FROM COMPLIANCECHECKER */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="mb-4 font-medium text-[color:var(--brand-dark)]">
          Previous Translations
        </h2>
        {history.length === 0 ? (
          <p className="text-sm italic text-gray-500">No history yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {(showAllHistory ? history : history.slice(0, 5)).map((h) => {
                const sourceLang =
                  h.target_lang.toLowerCase() === "arabic"
                    ? "English"
                    : "Arabic";
                const targetLang =
                  h.target_lang.toLowerCase() === "arabic"
                    ? "Arabic"
                    : "English";

                return (
                  <li
                    key={h.id}
                    className="flex flex-col rounded-lg border border-[#c17829]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-3 sm:mb-0 min-w-0 flex-1">
                      <p className="flex items-start text-sm font-semibold text-gray-800">
                        <span className="mr-2 mt-0.5 text-[#c17829] flex-shrink-0">
                          {getFileIcon(
                            h.translated_filename,
                            DROPDOWN_ICON_SIZE
                          )}
                        </span>
                        <span className="break-all">
                          {h.translated_filename || `Text Translation`}{" "}
                          {/* Display filename or text indication */}
                        </span>
                      </p>
                      {/* Replaced date with language direction */}
                      <p className="mt-1 text-xs text-gray-500">
                        {`${sourceLang} → ${targetLang}`}
                      </p>
                    </div>
                    <div className="flex gap-3 self-end sm:self-center">
                      {/* View button */}
                      <button
                        onClick={() => openReport(h.id)}
                        className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline disabled:opacity-50"
                      >
                        <FaSearch /> View
                      </button>
                      {/* Download button (only for file translations with doc ID) */}
                      {h.type === "doc" &&
                        h.result_doc_id &&
                        h.translated_filename && (
                          <motion.button
                            onClick={() =>
                              downloadDocumentById(
                                h.result_doc_id!,
                                h.translated_filename!
                              )
                            }
                            className="flex items-center gap-1 text-sm text-[#c17829] hover:bg-[#a66224]/10 rounded-md px-3 py-1"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaDownload /> Download
                          </motion.button>
                        )}
                      {/* Delete button */}
                      <button
                        onClick={() => removeReport(h.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </li>
                );
              })}
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

      {/* Delete Confirmation Modal - ADAPTED FROM COMPLIANCECHECKER */}
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
                  Delete Translation Report
                </h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this translation report? This
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
};

/* ────────────────────────── helpers - SPINNER KEPT SAME ────────────────────────── */
const Spinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="animate-spin h-8 w-8 border-b-2 border-[color:var(--accent-dark)] rounded-full" />
    {text && <p className="mt-2 text-gray-700">{text}</p>}{" "}
    {/* Added mt-2 for spacing */}
  </div>
);

export default TranslationTool;
