/* src/views/pages/Dashboard/TranslationTool.tsx */

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
  FaSpinner, // Added spinner icon for consistency
  FaExclamationCircle, // Added for error messages
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────── */
// Keeping BRAND and ACCENT specific to TranslationTool for its distinct colors
const BRAND = { dark: "var(--brand-dark-translation, #007bff)" } as const; // Added fallback
const ACCENT = {
  dark: "var(--accent-dark-translation, #0056b3)",
  light: "var(--accent-light-translation, #e9ecef)",
}; // Added fallback
// Removed SHADOW as ComplianceChecker uses standard tailwind shadows like shadow-sm

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
  /* fresh translate (state) ----------------------------------- */
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromEnglish, setFromEnglish] = useState(true);
  const [copied, setCopied] = useState(false);

  /* file translation mode */
  const [file, setFile] = useState<File | null>(null);
  const [docProcessing, setDocProcessing] = useState(false);
  // docUrl is used for the *immediate* download link after a fresh file translation
  const [freshDocUrl, setFreshDocUrl] = useState<string | null>(null);

  /* history ---------------------------------------------------------------- */
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true); // Added loading state for history

  useEffect(() => {
    loadHistory();
    // Cleanup object URL on component unmount
    return () => {
      if (freshDocUrl) {
        URL.revokeObjectURL(freshDocUrl);
      }
    };
  }, []);

  // Effect to revoke object URL when freshDocUrl changes
  useEffect(() => {
    return () => {
      if (freshDocUrl) {
        URL.revokeObjectURL(freshDocUrl);
      }
    };
  }, [freshDocUrl]);

  async function loadHistory() {
    setFetchingHistory(true); // Start loading
    try {
      setHistory(await listTranslationHistory());
    } catch (e) {
      console.error("Translation history failed", e);
      // Optionally set an error state for history loading
    } finally {
      setFetchingHistory(false); // End loading
    }
  }

  /* currently opened result (fresh or history) ----------------------------- */
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [error, setError] = useState<string | null>(null); // Added error state for main translation action

  const srcLangLabel = fromEnglish ? "English" : "Arabic";
  const tgtLangLabel = fromEnglish ? "Arabic" : "English";

  /* ───────────────────── TRANSLATE actions ───────────────────── */
  const handleTranslate = async () => {
    setIsTranslating(true);
    setError(null); // Clear previous errors
    setTranslatedText(""); // Clear previous text translation result
    setFreshDocUrl(null); // Clear previous file translation URL
    setResult(null); // Clear previous result display

    if (file) {
      /* File → server returns blob */
      setDocProcessing(true);
      try {
        const { blob, filename } = await translateFile(
          file,
          tgtLangLabel.toLowerCase()
        );
        const url = URL.createObjectURL(blob);
        setFreshDocUrl(url); // Set freshDocUrl for immediate download
        // No need to set 'result' state here for fresh file translations, as we handle it via freshDocUrl
        await loadHistory(); // Reload history to show the new file translation entry
      } catch (e: any) {
        console.error(e);
        setError(`File translation failed: ${e.message || "Unknown error"}`);
        setFreshDocUrl(null); // Ensure freshDocUrl is null on error
      }
      setDocProcessing(false);
    } else {
      // Text translation mode
      if (!sourceText.trim()) {
        setError("Please enter text to translate.");
        setIsTranslating(false);
        return;
      }
      try {
        const { translated_text, report_id } = await translateText(
          sourceText,
          tgtLangLabel.toLowerCase()
        );
        setTranslatedText(translated_text);
        setResult({
          report_id,
          type: "text", // Type is "text" for text translations
          translatedText: translated_text,
          target_lang: tgtLangLabel.toLowerCase(),
        });
        loadHistory(); // Reload history to show the new text translation entry
      } catch (e: any) {
        console.error(e);
        setError(`Text translation failed: ${e.message || "Unknown error"}`);
        setTranslatedText(""); // Ensure translatedText is empty on error
      }
    }
    setIsTranslating(false);
  };

  /* ───────────────────── history helpers ───────────────────── */
  async function openReport(id: string) {
    setError(null); // Clear previous errors
    setSourceText(""); // Clear source text input
    setTranslatedText(""); // Clear translated text display
    setFile(null); // Clear selected file
    setFreshDocUrl(null); // Clear fresh document URL

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
      /* auto‑switch UI direction */
      // Determine source language based on target_lang from report
      setFromEnglish(r.target_lang.toLowerCase() === "arabic"); // If target is Arabic, source was English, so set fromEnglish to true

      setResult(r); // Set the result for display

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e.message || "Failed to open translation report");
      setResult(null); // Clear result on error
    }
  }

  async function removeReport(id: string) {
    if (!window.confirm("Delete this translation?")) return;
    try {
      await deleteTranslationReport(id);
      setHistory((h) => h.filter((i) => i.id !== id));
      if (result?.report_id === id) setResult(null); // Clear displayed result if it's the one being deleted
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  }

  /* copy text helper */
  const handleCopy = () => {
    if (!translatedText) return; // Check translatedText state directly
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  };

  /* file select / drag‑drop */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFileDrop(f); // Use shared file handling logic
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFileDrop(f); // Use shared file handling logic
  };

  const handleFileDrop = (f: File | null) => {
    if (!f) return;
    setError(null); // Clear any previous errors
    setFile(f); // Set the file state
    setSourceText(""); // Clear the source text input
    setFreshDocUrl(null); // Clear any previous fresh file translation URL
    setTranslatedText(""); // Clear any previous text translation result
    setResult(null); // Clear any previously displayed result (history or fresh)
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input value
  };

  /* disable translate? */
  const translateDisabled =
    (file ? false : !sourceText.trim()) || isTranslating || docProcessing;

  /* helper icon for files */
  const getFileIcon = (name: string, sizeClassName: string = "text-2xl") => {
    // Added sizeClassName parameter
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FaFileAlt className={`${sizeClassName} text-red-600`} />; // Using FaFileAlt for consistency, could use FaFilePdf if desired
    }
    if (ext === "doc" || ext === "docx") {
      return <FaFileAlt className={`${sizeClassName} text-blue-600`} />; // Using FaFileAlt for consistency, could use FaFileWord if desired
    }
    return (
      <FaFileAlt
        className={`${sizeClassName} text-[color:var(--accent-dark-translation)]`}
      />
    );
  };
  const FILE_ICON_SIZE = "text-5xl"; // Define icon size classes consistent with ComplianceChecker
  const DROPDOWN_ICON_SIZE = "text-xl";

  /* Reset function */
  const reset = () => {
    setSourceText("");
    setTranslatedText("");
    setIsTranslating(false);
    setFile(null);
    setDocProcessing(false);
    setFreshDocUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ──────────────────────────────── UI ─────────────────────────────── */
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* ───── Header */}
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

      {/* ───── Upload zone */}
      {/* Keeping it as a separate section for clarity, show only if no result or processing */}
      {!result && !isTranslating && !docProcessing && !freshDocUrl && (
        <section className="rounded-xl border bg-white shadow-sm p-6">
          <h2 className="font-medium text-[color:var(--brand-dark-translation)] mb-4">
            Translate Document
          </h2>
          <UploadDropZone
            fileToUpload={file}
            fileInputRef={fileInputRef}
            isDisabled={isTranslating || docProcessing}
            onFileChange={onFileChange}
            handleFileDrop={handleFileDrop}
            getFileIcon={getFileIcon}
            FILE_ICON_SIZE={FILE_ICON_SIZE}
          />
        </section>
      )}

      {/* ───── Editor / Result viewer */}
      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Loading State */}
        {(isTranslating || docProcessing) && !result && !freshDocUrl ? (
          <div className="p-6 text-center">
            <Spinner
              text={
                docProcessing ? "Translating document…" : "Translating text…"
              }
            />
          </div>
        ) : result?.type === "doc" ? ( // Displaying a historical document translation result
          <ResultViewDoc
            result={result}
            getFileIcon={getFileIcon}
            downloadDocumentById={downloadDocumentById}
            reset={reset}
            FILE_ICON_SIZE={FILE_ICON_SIZE}
          />
        ) : freshDocUrl ? ( // Displaying a fresh file translation result
          <ResultViewDocFresh
            freshDocUrl={freshDocUrl}
            fileName={file?.name || "Translated Document"} // Use original file name if available
            reset={reset}
          />
        ) : (
          /* ========= TEXT MODE ========= */
          <TextTranslator
            sourceText={sourceText}
            setSourceText={setSourceText}
            translatedText={translatedText}
            result={result} // Pass result to potentially display history text
            handleCopy={handleCopy}
            copied={copied}
            srcLangLabel={srcLangLabel}
            tgtLangLabel={tgtLangLabel}
            isTranslating={isTranslating}
          />
        )}

        {/* Actions bar */}
        {/* Show actions bar only when not processing and not displaying a final result (historical doc or fresh doc url) */}
        {!(
          isTranslating ||
          docProcessing ||
          result?.type === "doc" ||
          freshDocUrl
        ) && (
          <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <motion.button
              onClick={() => setFromEnglish(!fromEnglish)}
              className="flex items-center gap-2 rounded-md px-4 py-2 bg-white shadow-sm hover:shadow-md transition text-gray-700 hover:text-[color:var(--brand-dark-translation)]" // Styled like ComplianceChecker buttons
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaExchangeAlt /> Swap Directions
            </motion.button>
            {!file && ( // Show text translate button if no file is selected
              <motion.button
                onClick={handleTranslate}
                disabled={translateDisabled}
                className={`flex items-center gap-2 rounded-md px-6 py-2 text-white transition-colors ${
                  translateDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[color:var(--accent-dark-translation)] hover:bg-[color:var(--accent-light-translation)]"
                }`}
                whileHover={{
                  scale: translateDisabled ? 1 : 1.05,
                }}
                whileTap={{
                  scale: translateDisabled ? 1 : 0.95,
                }}
              >
                {isTranslating ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaLanguage />
                )}{" "}
                {/* Added spinner */}
                <span>{isTranslating ? "Translating…" : "Translate"}</span>{" "}
                {/* Updated button text */}
              </motion.button>
            )}
            {file && ( // Show file translate button if file is selected
              <motion.button
                onClick={handleTranslate}
                disabled={translateDisabled}
                className={`flex items-center gap-2 rounded-md px-6 py-2 text-white transition-colors ${
                  translateDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[color:var(--accent-dark-translation)] hover:bg-[color:var(--accent-light-translation)]"
                }`}
                whileHover={{
                  scale: translateDisabled ? 1 : 1.05,
                }}
                whileTap={{
                  scale: translateDisabled ? 1 : 0.95,
                }}
              >
                {docProcessing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaSearch />
                )}
                <span>
                  {docProcessing ? "Processing…" : "Translate Document"}
                </span>
              </motion.button>
            )}
          </div>
        )}

        {/* Reset button when showing a result (historical doc or fresh doc url) */}
        {(result?.type === "doc" || freshDocUrl) &&
          !(isTranslating || docProcessing) && (
            <div className="bg-gray-50 p-4 flex justify-end">
              <motion.button
                onClick={reset}
                className="flex items-center gap-2 rounded-md px-4 py-2 bg-white shadow-sm hover:shadow-md transition text-gray-700 hover:text-[color:var(--brand-dark-translation)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New Translation
              </motion.button>
            </div>
          )}
      </section>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <FaExclamationCircle className="text-red-500 mt-1" />
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <FaInfoCircle className="text-yellow-500 mt-1" />
        <div>
          <h4 className="font-medium text-yellow-800">Important Notice</h4>
          <p className="text-sm text-yellow-700">
            Machine translation is for reference only. Review with a
            professional before use.
          </p>
        </div>
      </div>

      {/* ───── History */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="font-medium text-[color:var(--brand-dark-translation)] mb-4">
          Previous Translations
        </h2>
        {fetchingHistory ? (
          <div className="text-center text-gray-700 py-4">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark-translation)]" />{" "}
            {/* Styled spinner color */}
            <p className="mt-2 text-sm">Loading history…</p>
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No history yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex flex-col rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between border-[color:var(--accent-dark-translation)]/30" // Added border color
              >
                <div className="mb-3 sm:mb-0 min-w-0 flex-1">
                  <p className="flex items-start text-sm font-semibold text-gray-800">
                    {" "}
                    {/* Styled like ComplianceChecker history items */}
                    <span className="mr-2 mt-0.5 text-[color:var(--brand-dark-translation)] flex-shrink-0">
                      {" "}
                      {/* Styled icon span */}
                      {h.type === "doc" ? (
                        getFileIcon(
                          h.translated_filename || "",
                          DROPDOWN_ICON_SIZE
                        )
                      ) : (
                        <FaLanguage className={DROPDOWN_ICON_SIZE} />
                      )}
                    </span>
                    <span className="break-all">
                      {" "}
                      {/* Added break-all */}
                      {h.type === "doc"
                        ? h.translated_filename || "Document Translation"
                        : `Text → ${h.target_lang}`}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleString()
                      : "Date N/A"}
                  </p>
                </div>
                <div className="flex gap-3 self-end sm:self-center">
                  {h.type === "text" && ( // View button only for text reports
                    <button
                      onClick={() => openReport(h.id)}
                      className="flex items-center gap-1 text-sm text-[color:var(--accent-dark-translation)] hover:underline disabled:opacity-50"
                    >
                      <FaSearch /> View
                    </button>
                  )}
                  {h.type === "doc" &&
                    h.result_doc_id &&
                    h.translated_filename && ( // Download button only for document reports with doc_id and filename
                      <motion.button
                        onClick={() =>
                          downloadDocumentById(
                            h.result_doc_id!,
                            h.translated_filename!
                          )
                        }
                        className="flex items-center gap-1 text-sm text-[color:var(--accent-dark-translation)] hover:bg-[color:var(--accent-light-translation)]/50 rounded-md px-3 py-1" // Styled like ComplianceChecker download button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaDownload /> DOCX
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
        )}
      </section>
    </div>
  );
};

/* ────────────────────────── helpers / sub-components ────────────────────────── */

// Generic Spinner component (reused from ComplianceChecker)
const Spinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="animate-spin h-8 w-8 border-b-2 border-[color:var(--accent-dark-translation)] rounded-full" />{" "}
    {/* Styled spinner color */}
    {text && <p className="text-gray-700 text-sm">{text}</p>}{" "}
    {/* Added text-sm for consistency */}
  </div>
);

// Upload Drop Zone component (adapted from ComplianceChecker)
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
          ? "cursor-not-allowed opacity-60 border-gray-300" // Added border-gray-300 when disabled
          : "cursor-pointer hover:border-[color:var(--accent-dark-translation)] border-gray-300" // Styled hover border color, added default border
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
          <p className="mt-2 text-gray-700">{fileToUpload.name}</p>{" "}
          {/* Added text-gray-700 */}
          <p className="text-xs text-gray-500">
            {(fileToUpload.size / 1048576).toFixed(2)} MB
          </p>
        </>
      ) : (
        <>
          <FaFileUpload className={`${FILE_ICON_SIZE} text-gray-400`} />{" "}
          {/* Used FILE_ICON_SIZE */}
          <p className="mt-2 text-gray-700">
            Drag & drop or click to upload
          </p>{" "}
          {/* Added text-gray-700 */}
          <p className="text-xs text-gray-400">Accepted: PDF, DOCX, TXT</p>{" "}
          {/* Added TXT */}
        </>
      )}
    </div>
  );
}

// Text Translation Input/Output Area
interface TextTranslatorProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  translatedText: string;
  result: DisplayResult | null; // Still pass result to potentially show historical text result
  handleCopy: () => void;
  copied: boolean;
  srcLangLabel: string;
  tgtLangLabel: string;
  isTranslating: boolean;
}

function TextTranslator({
  sourceText,
  setSourceText,
  translatedText,
  result, // Use result to determine if showing historical text
  handleCopy,
  copied,
  srcLangLabel,
  tgtLangLabel,
  isTranslating,
}: TextTranslatorProps) {
  const displayedTranslatedText =
    result?.type === "text" ? result.translatedText ?? "" : translatedText;

  return (
    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
      {/* Source */}
      <div className="p-6">
        <h2 className="font-semibold mb-2" style={{ color: BRAND.dark }}>
          Source Text ({srcLangLabel})
        </h2>
        {/* Use sourceText state for input value */}
        <textarea
          className="w-full h-56 border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark-translation)] disabled:opacity-60 disabled:cursor-not-allowed bg-white text-gray-800" // Added styles
          placeholder={`Type or paste ${srcLangLabel} here…`}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          disabled={isTranslating || !!result} // Disable input if translating or showing any result
        />
      </div>

      {/* Translated */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold" style={{ color: BRAND.dark }}>
            Translated ({tgtLangLabel})
          </h2>
          {displayedTranslatedText && ( // Show copy button only if there is text to display
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-sm text-[color:var(--accent-dark-translation)] hover:underline"
            >
              {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        <div className="h-56 border rounded-md p-4 bg-gray-50 overflow-y-auto text-gray-800">
          {" "}
          {/* Added text-gray-800 */}
          {isTranslating ? (
            <Spinner text="Translating…" /> // Use Spinner component
          ) : displayedTranslatedText ? ( // Display the derived translated text
            displayedTranslatedText
          ) : (
            <p className="text-gray-400 italic">
              Translated text will appear here…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to display historical document translation results
interface ResultViewDocProps {
  result: DisplayResult;
  getFileIcon: (filename: string, sizeClassName: string) => JSX.Element;
  downloadDocumentById: (id: string, filename: string) => Promise<void>;
  reset: () => void;
  FILE_ICON_SIZE: string;
}

function ResultViewDoc({
  result,
  getFileIcon,
  downloadDocumentById,
  reset,
  FILE_ICON_SIZE,
}: ResultViewDocProps) {
  // This component should only be rendered when result is not null and result.type is 'doc'
  if (!result || result.type !== "doc") return null;

  const handleDownload = () => {
    if (result.resultDocId && result.translatedFilename) {
      downloadDocumentById(result.resultDocId, result.translatedFilename);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {getFileIcon(result.translatedFilename || "", FILE_ICON_SIZE)}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 break-words">
              {result.translatedFilename || "Translated Document"}
            </h3>
            <p className="text-xs text-gray-500">
              Report ID: {result.report_id}
            </p>
            <p className="text-xs text-gray-500">
              Translated to: {result.target_lang}
            </p>
            {result.created_at && (
              <p className="text-xs text-gray-500">
                Translated on: {new Date(result.created_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-6 justify-center">
          {result.resultDocId && result.translatedFilename && (
            <motion.button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1 rounded-md bg-[color:var(--accent-dark-translation)] px-4 py-1.5 text-sm text-white hover:bg-[color:var(--accent-light-translation)] w-[159px] h-[36px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaDownload /> Download DOCX
            </motion.button>
          )}
          <motion.button
            onClick={reset}
            className="flex items-center justify-center gap-1 rounded-md bg-[color:var(--accent-dark-translation)] px-4 py-1.5 text-sm text-white hover:bg-[color:var(--accent-light-translation)] w-[159px] h-[36px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            New Translation
          </motion.button>
        </div>
      </div>
      <div className="p-6 text-center italic text-gray-600">
        <p>
          Document translation complete. Download the translated file using the
          button above.
        </p>
      </div>
    </>
  );
}

// Component to display fresh file translation result (direct download URL)
interface ResultViewDocFreshProps {
  freshDocUrl: string;
  fileName: string;
  reset: () => void;
}

function ResultViewDocFresh({
  freshDocUrl,
  fileName,
  reset,
}: ResultViewDocFreshProps) {
  // This component should only be rendered when freshDocUrl is not null
  if (!freshDocUrl) return null;

  return (
    <>
      <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FaFileAlt className="text-5xl text-[color:var(--accent-dark-translation)]" />{" "}
          {/* Using a generic file icon */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 break-words">
              {fileName}
            </h3>
            <p className="text-xs text-gray-500">Translation successful.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-6 justify-center">
          <a
            href={freshDocUrl}
            download={`${fileName.replace(/\.[^/.]+$/, "")}_translated.docx`} // Suggest a translated filename
            className="inline-flex items-center justify-center gap-1 rounded-md bg-[color:var(--accent-dark-translation)] px-4 py-1.5 text-sm text-white hover:bg-[color:var(--accent-light-translation)] w-[159px] h-[36px]"
          >
            <FaDownload /> Download
          </a>
          <motion.button
            onClick={reset}
            className="flex items-center justify-center gap-1 rounded-md bg-[color:var(--accent-dark-translation)] px-4 py-1.5 text-sm text-white hover:bg-[color:var(--accent-light-translation)] w-[159px] h-[36px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            New Translation
          </motion.button>
        </div>
      </div>
      <div className="p-6 text-center italic text-gray-600">
        <p>Your document translation is ready for download.</p>
      </div>
    </>
  );
}

export default TranslationTool;
