/*  src/views/pages/Dashboard/TranslationTool.tsx  */

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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

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
  const [docUrl, setDocUrl] = useState<string | null>(null);

  /* history ---------------------------------------------------------------- */
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  useEffect(() => {
    loadHistory();
  }, []);
  async function loadHistory() {
    try {
      setHistory(await listTranslationHistory());
    } catch (e) {
      console.error("Translation history failed", e);
    }
  }

  /* currently opened result (fresh or history) ----------------------------- */
  const [result, setResult] = useState<DisplayResult | null>(null);

  const srcLangLabel = fromEnglish ? "English" : "Arabic";
  const tgtLangLabel = fromEnglish ? "Arabic" : "English";

  /* ───────────────────── TRANSLATE actions ───────────────────── */
  const handleTranslate = async () => {
    setIsTranslating(true);
    if (file) {
      /* File → server returns blob */
      setDocProcessing(true);
      try {
        const { blob, filename } = await translateFile(
          file,
          tgtLangLabel.toLowerCase(),
        );
        const url = URL.createObjectURL(blob);
        setDocUrl(url);
        /* viewer */
        setResult(null);
        await loadHistory();
      } catch (e) {
        console.error(e);
      }
      setDocProcessing(false);
    } else {
      try {
        const { translated_text, report_id } = await translateText(
          sourceText,
          tgtLangLabel.toLowerCase(),
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
      }
    }
    setIsTranslating(false);
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
      /* auto‑switch UI direction */
      setFromEnglish(r.target_lang.toLowerCase() === "arabic");
      /* reset local input / file */
      setFile(null);
      setDocUrl(null);
      setTranslatedText(r.translatedText ?? "");
      setSourceText("");
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open translation report");
    }
  }

  async function removeReport(id: string) {
    if (!window.confirm("Delete this translation?")) return;
    try {
      await deleteTranslationReport(id);
      setHistory(h => h.filter(i => i.id !== id));
      if (result?.report_id === id) setResult(null);
    } catch (e: any) {
      alert(e.message || "Delete failed");
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
    setDocUrl(null);
    setResult(null);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null);
    setResult(null);
  };

  /* disable translate? */
  const translateDisabled =
    (file ? false : !sourceText.trim()) || isTranslating || docProcessing;

  /* helper icon for files */
  const getFileIcon = (name: string) => (
    <FaFileAlt className="text-2xl text-[color:var(--accent-dark)]" />
  );

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
              Translation Tool
            </h1>
            <p className="text-gray-600">
              {srcLangLabel} ↔ {tgtLangLabel}
            </p>
          </div>
        </div>
      </header>

      {/* ───── History */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <h2 className="font-medium text-[color:var(--brand-dark)] mb-4">
          Previous Translations
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
                    {h.translated_filename || `Text → ${h.target_lang}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(h.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => openReport(h.id)}
                    className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
                  >
                    <FaSearch /> View
                  </button>
                  {h.result_doc_id && h.translated_filename && (
                    <button
                      onClick={() =>
                        downloadDocumentById(
                          h.result_doc_id!,
                          h.translated_filename!,
                        )
                      }
                      className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
                    >
                      <FaDownload /> DOCX
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

      {/* ───── Direction menu */}
      <div className="flex space-x-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFromEnglish(true)}
          className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${fromEnglish
            ? "bg-[color:var(--accent-dark)] text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          English → Arabic
        </button>
        <button
          onClick={() => setFromEnglish(false)}
          className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${!fromEnglish
            ? "bg-[color:var(--accent-dark)] text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Arabic → English
        </button>
      </div>

      {/* ───── Upload zone */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-[color:var(--accent-dark)] transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={onFileChange}
          />
          {file ? (
            <>
              <FaFileAlt className="text-5xl text-[color:var(--accent-dark)]" />
              <p className="mt-2 font-medium text-gray-700">{file.name}</p>
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

      {/* ───── Editor / Result viewer */}
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
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[color:var(--accent-dark)] text-white rounded-md shadow-sm hover:bg-[color:var(--accent-light)] transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaSearch /> Translate Document
                </motion.button>
              )
            ) : (
              <a
                href={docUrl}
                download
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
                className="w-full h-56 border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)]"
                placeholder={`Type or paste ${srcLangLabel} here…`}
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
              />
            </div>

            {/* Translated */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold" style={{ color: BRAND.dark }}>
                  Translated ({tgtLangLabel})
                </h2>
                {result?.translatedText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}{" "}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="h-56 border rounded-md p-4 bg-gray-50 overflow-y-auto">
                {isTranslating ? (
                  <Spinner />
                ) : result?.translatedText ? (
                  result.translatedText
                ) : (
                  <p className="text-gray-400 italic">
                    Translated text will appear here…
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <motion.button
            onClick={() => setFromEnglish(!fromEnglish)}
            className="flex items-center gap-2 rounded-md px-4 py-2 bg-white shadow-sm hover:shadow-md transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaExchangeAlt /> Swap Directions
          </motion.button>
          {!file && (
            <motion.button
              onClick={handleTranslate}
              disabled={translateDisabled}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-white transition-colors ${translateDisabled
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
              <FaLanguage /> <span>Translate</span>
            </motion.button>
          )}
        </div>
      </div>

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
    </div>
  );
};

/* ────────────────────────── helpers ────────────────────────── */
const Spinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="animate-spin h-8 w-8 border-b-2 border-[color:var(--accent-dark)] rounded-full" />
    {text && <p className="text-gray-700">{text}</p>}
  </div>
);

export default TranslationTool;
