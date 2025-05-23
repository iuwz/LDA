// src/views/pages/Dashboard/TranslationTool.tsx
/* eslint-disable react-hooks/exhaustive-deps */

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
  FaExchangeAlt,
  FaSearch,
  FaTrash,
  FaDownload,
  FaSpinner,
  FaFilePdf,
  FaFileWord,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- theme constants ---------- */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };

/* ---------- local types ---------- */
interface DisplayResult {
  report_id: string;
  type: "text" | "doc";
  translatedText?: string;
  translatedFilename?: string | null;
  resultDocId?: string | null;
  target_lang: string;
  created_at?: string;
}

/* ---------- component ---------- */
const TranslationTool: React.FC = () => {
  /* ---------- state ---------- */
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromEnglish, setFromEnglish] = useState(true);
  const [copied, setCopied] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [docProcessing, setDocProcessing] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [result, setResult] = useState<DisplayResult | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const items = await listTranslationHistory();
      setHistory(items);
    } catch (e) {
      console.error("Translation history failed", e);
    }
  }

  /* ---------- helpers ---------- */
  const srcLangLabel = fromEnglish ? "English" : "Arabic";
  const tgtLangLabel = fromEnglish ? "Arabic" : "English";

  const getFileIcon = (filename: string | null | undefined, size: string) => {
    if (!filename) return <FaFileAlt className={`${size} text-gray-500`} />;
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FaFilePdf className={`${size} text-red-600`} />;
    if (ext === "doc" || ext === "docx")
      return <FaFileWord className={`${size} text-blue-600`} />;
    return <FaFileAlt className={`${size} text-gray-500`} />;
  };

  /** Download a plain-text translation as .txt */
  const downloadTextReport = async (reportId: string) => {
    try {
      const resp = await getTranslationReport(reportId);
      const txt = resp?.translation_report?.translated_text;
      if (!txt) throw new Error("No translated text found.");
      const fname =
        resp.translation_report.translated_filename ||
        `translation-${reportId.slice(-6)}.txt`;
      const url = URL.createObjectURL(
        new Blob([txt], { type: "text/plain;charset=utf-8" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = fname.replace(/\s+/g, "_");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(
        (err as Error).message || "Failed to download plain-text translation."
      );
    }
  };

  /* ---------- translate (text or file) ---------- */
  const handleTranslate = async () => {
    setIsTranslating(true);
    setResult(null);
    setDocUrl(null);
    setTranslatedText("");

    if (file) {
      setDocProcessing(true);
      try {
        setSourceText("");
        const { blob, filename, report_id, result_doc_id } =
          (await translateFile(file, tgtLangLabel.toLowerCase())) as {
            blob: Blob;
            filename: string;
            report_id: string;
            result_doc_id?: string;
          };

        const url = URL.createObjectURL(blob);
        setDocUrl(url);
        setResult({
          report_id,
          type: "doc",
          translatedFilename: filename,
          resultDocId: result_doc_id ?? report_id,
          target_lang: tgtLangLabel.toLowerCase(),
        });
        await loadHistory();
      } catch (e) {
        console.error(e);
        alert(
          `File translation failed: ${(e as any).message || "Unknown error"}`
        );
      }
      setDocProcessing(false);
      setIsTranslating(false);
      return;
    }

    if (!sourceText.trim()) {
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
        type: "text",
        translatedText: translated_text,
        target_lang: tgtLangLabel.toLowerCase(),
      });
      loadHistory();
    } catch (e) {
      console.error(e);
      alert(
        `Text translation failed: ${(e as any).message || "Unknown error"}`
      );
    }
    setIsTranslating(false);
  };

  /* ---------- report loader ---------- */
  async function openReport(id: string) {
    try {
      const response = await getTranslationReport(id);
      if (!response?.translation_report)
        throw new Error("Failed to load report data.");

      const rep = response.translation_report;
      setFromEnglish(rep.target_lang.toLowerCase() !== "arabic");
      setFile(null);
      setDocUrl(null);
      setSourceText(rep.source_text ?? "");
      setTranslatedText(rep.translated_text ?? "");
      setResult({
        report_id: rep._id ?? id,
        type: rep.type,
        translatedText: rep.translated_text,
        translatedFilename: rep.translated_filename,
        resultDocId: rep.result_doc_id,
        target_lang: rep.target_lang,
        created_at: rep.timestamp,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open translation report");
    }
  }

  /* ---------- delete flow ---------- */
  function removeReport(id: string) {
    setPendingDeleteId(id);
  }
  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteTranslationReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      if (pendingDeleteId === result?.report_id) {
        setResult(null);
        setSourceText("");
        setTranslatedText("");
        setFile(null);
        setDocUrl(null);
      }
    } catch (e: any) {
      alert(e.message || "Delete failed");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  }

  /* ---------- misc helpers ---------- */
  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null);
    setTranslatedText("");
    setSourceText("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null);
    setTranslatedText("");
    setSourceText("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const translateDisabled =
    (file ? false : !sourceText.trim()) || isTranslating || docProcessing;
  const isMainDownloadLinkDisabled =
    !docUrl && (!result?.resultDocId || !result?.translatedFilename);

  /* ---------- render ---------- */
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div
          className="h-2"
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

      {/* direction toggle */}
      <div className="flex space-x-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => {
            setFromEnglish(true);
            setSourceText("");
            setTranslatedText("");
            setFile(null);
            setDocUrl(null);
            setResult(null);
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
            setSourceText("");
            setTranslatedText("");
            setFile(null);
            setDocUrl(null);
            setResult(null);
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

      {/* upload zone */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isTranslating || docProcessing
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
            disabled={isTranslating || docProcessing}
          />
          {file ? (
            <>
              {getFileIcon(file.name, "text-5xl")}
              <p className="mt-2 font-medium text-gray-700 break-all text-sm">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setDocUrl(null);
                  setTranslatedText("");
                  setSourceText("");
                  setResult(null);
                }}
                disabled={isTranslating || docProcessing}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Clear File
              </button>
            </>
          ) : (
            <>
              <FaFileUpload className="text-5xl text-gray-400" />
              <p className="mt-2 text-gray-700">Upload Document</p>
              <p className="text-xs text-gray-400">PDF, DOCX</p>
            </>
          )}
        </div>
      </div>

      {/* editor / file actions */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {file ? (
          <div className="p-6 text-center space-y-4">
            {isTranslating || docProcessing ? (
              <Spinner text="Translating document…" />
            ) : !docUrl && !result?.resultDocId ? (
              <motion.button
                onClick={handleTranslate}
                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-md shadow-sm transition-colors ${
                  translateDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[rgb(193,120,41)] hover:bg-[rgb(173,108,37)] text-white"
                }`}
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
            ) : (
              <motion.button
                onClick={() => {
                  if (isMainDownloadLinkDisabled) return;

                  if (docUrl) {
                    const a = document.createElement("a");
                    a.href = docUrl;
                    a.download =
                      result?.translatedFilename || "translated_document";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } else if (
                    result?.resultDocId &&
                    result?.translatedFilename
                  ) {
                    downloadDocumentById(
                      result.resultDocId,
                      result.translatedFilename
                    );
                  }
                }}
                disabled={isMainDownloadLinkDisabled}
                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-md shadow-sm transition-colors ${
                  isMainDownloadLinkDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[rgb(193,120,41)] hover:bg-[rgb(173,108,37)] text-white"
                }`}
                whileHover={{ scale: isMainDownloadLinkDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isMainDownloadLinkDisabled ? 1 : 0.95 }}
              >
                <FaDownload /> Download Translated Document
              </motion.button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* source */}
            <div className="p-6">
              <h2 className="font-semibold mb-2" style={{ color: BRAND.dark }}>
                Source Text ({srcLangLabel})
              </h2>
              <textarea
                className="w-full h-56 border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)] resize-none"
                placeholder={`Type or paste ${srcLangLabel} here…`}
                value={sourceText}
                onChange={(e) => {
                  setSourceText(e.target.value);
                  setTranslatedText("");
                  setResult(null);
                }}
                disabled={isTranslating || docProcessing}
              />
            </div>

            {/* translated */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold" style={{ color: BRAND.dark }}>
                  Translated ({tgtLangLabel})
                </h2>
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline disabled:opacity-50"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}{" "}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="h-56 border rounded-md p-4 bg-gray-50 overflow-y-auto whitespace-pre-wrap text-gray-800">
                {isTranslating && !docProcessing ? (
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

        {/* actions bar */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <motion.button
            onClick={() => {
              setFromEnglish(!fromEnglish);
              setSourceText("");
              setTranslatedText("");
              setFile(null);
              setDocUrl(null);
              setResult(null);
            }}
            className="flex items-center gap-2 rounded-md px-4 py-2 bg-[color:var(--accent-light)] text-[color:var(--accent-dark)] hover:bg-[color:var(--accent-dark)] hover:text-white shadow-sm hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isTranslating || docProcessing ? 1 : 1.05 }}
            whileTap={{ scale: isTranslating || docProcessing ? 1 : 0.95 }}
            disabled={isTranslating || docProcessing}
          >
            <FaExchangeAlt /> Swap Directions
          </motion.button>
          {!file && (
            <motion.button
              onClick={handleTranslate}
              disabled={translateDisabled}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-white transition-colors ${
                translateDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[rgb(193,120,41)] hover:bg-[rgb(173,108,37)]"
              }`}
              whileHover={{ scale: translateDisabled ? 1 : 1.05 }}
              whileTap={{ scale: translateDisabled ? 1 : 0.95 }}
            >
              {isTranslating && !docProcessing ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaLanguage />
              )}{" "}
              <span>
                {isTranslating && !docProcessing ? "Translating…" : "Translate"}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      {/* history */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="mb-4 font-medium" style={{ color: BRAND.dark }}>
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

                const hasFile = !!h.result_doc_id && !!h.translated_filename;

                return (
                  <li
                    key={h.id}
                    className="flex flex-col rounded-lg border border-[#c17829]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-3 sm:mb-0 min-w-0 flex-1">
                      <p className="flex items-start text-sm font-semibold text-gray-800">
                        <span className="mr-2 mt-0.5 text-[#c17829] flex-shrink-0">
                          {getFileIcon(h.translated_filename, "text-xl")}
                        </span>
                        <span
                          className="break-all cursor-pointer hover:underline"
                          onClick={() => {
                            if (hasFile) {
                              downloadDocumentById(
                                h.result_doc_id!,
                                h.translated_filename!
                              );
                            } else {
                              openReport(h.id);
                            }
                          }}
                        >
                          {h.translated_filename || "Text Translation Report"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{`${sourceLang} → ${targetLang}`}</p>
                    </div>

                    <div className="flex gap-3 self-end sm:self-center">
                      {hasFile ? (
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
                      ) : (
                        <motion.button
                          onClick={() => downloadTextReport(h.id)}
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
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h4
                  className="text-lg font-semibold"
                  style={{ color: BRAND.dark }}
                >
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

/* ---------- simple spinner ---------- */
const Spinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="animate-spin h-8 w-8 border-b-2 border-[color:var(--accent-dark)] rounded-full" />
    {text && <p className="mt-2 text-gray-700">{text}</p>}
  </div>
);

export default TranslationTool;
