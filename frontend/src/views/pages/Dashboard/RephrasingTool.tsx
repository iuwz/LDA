// RephrasingTool.tsx

import React, { useState, ChangeEvent } from "react";
import {
  FaEdit,
  FaExchangeAlt,
  FaCopy,
  FaCheck,
  FaUpload,
  FaFileAlt,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   1  BRAND TOKENS  (must match your CSS :root values)
   ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = {
  dark:  "var(--accent-dark)",
  light: "var(--accent-light)",
} as const;
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

/* ──────────────────────────────────────────────────────────────
   2  STYLE OPTIONS
   ────────────────────────────────────────────────────────────── */
const STYLE_OPTIONS = [
  { id: "formal",      label: "Formal" },
  { id: "clear",       label: "Clear" },
  { id: "persuasive",  label: "Persuasive" },
  { id: "concise",     label: "Concise" },
] as const;
type StyleId = (typeof STYLE_OPTIONS)[number]["id"];

/* ──────────────────────────────────────────────────────────────
   3  COMPONENT
   ────────────────────────────────────────────────────────────── */
const RephrasingTool: React.FC = () => {
  // Text mode state
  const [originalText,  setOriginalText]  = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [isLoading,     setIsLoading]     = useState(false);
  const [activeStyle,   setActiveStyle]   = useState<StyleId>("formal");
  const [copied,        setCopied]        = useState(false);

  // Document mode state
  const [file,          setFile]          = useState<File | null>(null);
  const [docProcessing, setDocProcessing] = useState(false);
  const [docUrl,        setDocUrl]        = useState<string | null>(null);

  /* ───── fake API for text ───── */
  const rephraseText = (txt: string, style: StyleId) => {
    setIsLoading(true);
    setTimeout(() => {
      const samples: Record<StyleId,string> = {
        formal:
          "We hereby acknowledge receipt of your communication dated the 15th of March. It is our understanding that you seek clarification regarding the aforementioned clause. Please be advised that our legal team will provide a comprehensive response within the next business week.",
        clear:
          "We received your email from March 15. You asked about clause 3.2. Our legal team will send a detailed answer within five business days.",
        persuasive:
          "Thank you for raising this important point on March 15. Your question about clause 3.2 highlights a key consideration. Our expert legal team is already reviewing it and will advise you within the week.",
        concise:
          "Got your 15 March email. Legal team will clarify clause 3.2 by Friday.",
      };
      setRephrasedText(samples[style]);
      setIsLoading(false);
    }, 1400);
  };

  /* ───── fake API for document ───── */
  const rephraseDocument = (style: StyleId) => {
    setDocProcessing(true);
    setTimeout(() => {
      const result = `DOCUMENT REPHRASED (${style.toUpperCase()}):\n\n` +
        (originalText || "Sample extracted text...");
      const blob = new Blob([result], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      setDocUrl(url);
      setDocProcessing(false);
    }, 1800);
  };

  /* ───── handlers ───── */
  const handleRephrase = () => {
    if (file) {
      rephraseDocument(activeStyle);
    } else if (originalText.trim()) {
      rephraseText(originalText, activeStyle);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rephrasedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setDocUrl(null);
    setDocProcessing(false);
    setRephrasedText("");
    if (f) {
      // For demo, read as text; in real-world, extract via PDF/mammoth
      const reader = new FileReader();
      reader.onload = (ev) => setOriginalText(ev.target?.result as string);
      reader.readAsText(f);
    }
  };

  /* ───── animation helpers ───── */
  const tapScale = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  return (
    <div className="space-y-8">
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
              {file ? "Document Mode" : "Text Mode"} — Select a style below
            </p>
          </div>
        </div>
      </header>

      {/* Style selector */}
      <div className="flex gap-2 flex-wrap">
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

      {/* Upload */}
      <div>
        <label
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[color:var(--accent-dark)] p-6 text-sm text-[color:var(--accent-dark)] hover:bg-[color:var(--accent-light)]/50 transition-colors"
        >
          <FaUpload /> {file ? file.name : "Upload Document for Rephrasing"}
          <input
            type="file"
            accept=".txt,.md,.csv,.json"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      </div>

      {/* Content area */}
      <section className="grid gap-6 md:grid-cols-2">
        {!file ? (
          <>
            {/* Original Text */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-[color:var(--brand-dark)]">
                Original Text
              </label>
              <textarea
                className="h-64 resize-none rounded-lg border border-gray-300 p-4 focus:border-[color:var(--accent-dark)] focus:ring-2 focus:ring-[color:var(--accent-dark)] focus:outline-none"
                placeholder="Type your text here…"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
              />
            </div>

            {/* Rephrased Text */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[color:var(--brand-dark)]">
                  Rephrased Text
                </label>
                {rephrasedText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="h-64 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]"></div>
                  </div>
                ) : rephrasedText ? (
                  <p className="whitespace-pre-line text-gray-800">
                    {rephrasedText}
                  </p>
                ) : (
                  <p className="italic text-gray-400">
                    Your rephrased text will appear here…
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Document Mode */
          <div className="col-span-2 flex flex-col items-center gap-4 p-6">
            {!docUrl ? (
              docProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
                  <p className="text-gray-700">Rephrasing document…</p>
                </div>
              ) : (
                <motion.button
                  onClick={handleRephrase}
                  className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaExchangeAlt /> Rephrase Document
                </motion.button>
              )
            ) : (
              <a
                href={docUrl}
                download={`rephrased_${activeStyle}.txt`}
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-light)] px-6 py-2 text-[color:var(--accent-dark)] shadow-sm hover:bg-[color:var(--accent-dark)] hover:text-white transition-colors"
              >
                <FaDownload /> Download Rephrased Document
              </a>
            )}
          </div>
        )}
      </section>

      {/* Footer: Rephrase button in document mode */}
      {!file && (
        <section className="flex justify-end">
          <motion.button
            onClick={handleRephrase}
            disabled={!originalText.trim() || isLoading}
            className={`flex items-center gap-2 rounded-lg bg-[color:var(--accent-dark)] px-6 py-2 text-white transition-colors ${
              !originalText.trim() || isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[color:var(--accent-light)]"
            }`}
            {...tapScale}
          >
            <FaExchangeAlt /> Rephrase
          </motion.button>
        </section>
      )}
    </div>
  );
};

export default RephrasingTool;
