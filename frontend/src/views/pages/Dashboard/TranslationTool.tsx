import React, { useState } from "react";
import { translateText, translateFile } from "../../../api";
import {
  FaLanguage,
  FaCopy,
  FaCheck,
  FaFileUpload,
  FaFileAlt,
  FaInfoCircle,
  FaExchangeAlt,
  FaSearch,
} from "react-icons/fa";
import { motion } from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   BRAND TOKENS
   ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };

/* ──────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────── */
const TranslationTool: React.FC = () => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromEnglish, setFromEnglish] = useState(true);
  const [copied, setCopied] = useState(false);

  // document mode
  const [file, setFile] = useState<File | null>(null);
  const [docProcessing, setDocProcessing] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const sourceLang = fromEnglish ? "English" : "Arabic";
  const targetLang = fromEnglish ? "Arabic" : "English";

  const handleTranslate = async () => {
    setIsTranslating(true);
    if (file) {
      setDocProcessing(true);
      try {
        const { blob, filename } = await translateFile(
          file,
          targetLang.toLowerCase()
        );
        const url = URL.createObjectURL(blob);
        setDocUrl(url);
      } catch (e) {
        console.error(e);
      }
      setDocProcessing(false);
    } else {
      try {
        const res = await translateText(sourceText, targetLang.toLowerCase());
        setTranslatedText(res.translated_text);
      } catch (e) {
        console.error(e);
      }
    }
    setIsTranslating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null);
    setTranslatedText("");
    if (f) {
      setSourceText(
        fromEnglish
          ? "The party will comply with all applicable laws and regulations."
          : "سيتقيد الطرف بجميع القوانين واللوائح المطبقة."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              {sourceLang} ↔ {targetLang}
            </p>
          </div>
        </div>
      </header>

      {/* Direction menu */}
      <div className="flex space-x-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFromEnglish(true)}
          className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${
            fromEnglish
              ? "bg-[color:var(--accent-dark)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          English → Arabic
        </button>
        <button
          onClick={() => setFromEnglish(false)}
          className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${
            !fromEnglish
              ? "bg-[color:var(--accent-dark)] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Arabic → English
        </button>
      </div>

      {/* File Upload */}
      <div className="rounded-xl border bg-white shadow-sm p-6">
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-[color:var(--accent-dark)] transition-colors"
          onClick={() => document.getElementById("tran-upload")?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0] ?? null;
            if (f) {
              handleFileChange({ target: { files: [f] } } as any);
            }
          }}
        >
          <input
            id="tran-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
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

      {/* Editor / Document Mode */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {file ? (
          <div className="p-6 text-center space-y-4">
            {!docUrl ? (
              docProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin h-10 w-10 border-b-2 border-[color:var(--accent-dark)] rounded-full" />
                  <p className="text-gray-700">Translating document…</p>
                </div>
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
                <FaLanguage /> Download Translated Document
              </a>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Source */}
            <div className="p-6">
              <h2 className="font-semibold mb-2" style={{ color: BRAND.dark }}>
                Source Text ({sourceLang})
              </h2>
              <textarea
                className="w-full h-56 border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)]"
                placeholder={`Type or paste ${sourceLang} here…`}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
            </div>

            {/* Translated */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold" style={{ color: BRAND.dark }}>
                  Translated Text ({targetLang})
                </h2>
                {translatedText && (
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
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--accent-dark)]" />
                  </div>
                ) : (
                  translatedText || (
                    <p className="text-gray-400 italic">
                      Translated text will appear here…
                    </p>
                  )
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
              disabled={!sourceText.trim() || isTranslating}
              className={`flex items-center gap-2 rounded-md px-6 py-2 text-white transition-colors ${
                !sourceText.trim() || isTranslating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[color:var(--accent-dark)] hover:bg-[color:var(--accent-light)]"
              }`}
              whileHover={{
                scale: sourceText.trim() && !isTranslating ? 1.05 : 1,
              }}
              whileTap={{
                scale: sourceText.trim() && !isTranslating ? 0.95 : 1,
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

export default TranslationTool;
