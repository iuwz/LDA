// RephrasingTool.tsx
import React, { useState, useRef } from "react";
import {
  FaEdit,
  FaExchangeAlt,
  FaCopy,
  FaCheck,
  FaCloudUploadAlt,
  FaFileAlt,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";

/* ------------ helper: extract text from file ------------ */
const extractText = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return "";

  if (ext === "txt") {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onerror = () => rej(reader.error);
      reader.onload = () => res(reader.result as string);
      reader.readAsText(file);
    });
  }

  if (ext === "pdf") {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const txt = await page.getTextContent();
      fullText += txt.items.map((t: any) => t.str).join(" ") + "\n";
    }
    return fullText;
  }

  if (ext === "docx" || ext === "doc") {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }

  return "";
};

/* ------------ main component ------------ */
const RephrasingTool: React.FC = () => {
  const [originalText, setOriginalText] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "formal" | "clear" | "persuasive" | "concise"
  >("formal");
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ----- mock rephrase (unchanged) ----- */
  const rephraseMap: Record<typeof activeTab, string> = {
    formal: `We hereby acknowledge receipt of your communication dated…`,
    clear: `We received your email from March 15…`,
    persuasive: `Thank you for bringing this matter to our attention…`,
    concise: `Got your March 15 email. Our legal team will reply by Friday.`,
  };

  const handleRephrase = () => {
    if (!originalText.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setRephrasedText(rephraseMap[activeTab]);
      setIsLoading(false);
    }, 1200);
  };

  /* ----- upload drag/drop ----- */
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    try {
      const txt = await extractText(f);
      if (!txt.trim()) throw new Error("Unsupported or empty file");
      setOriginalText(txt);
      setUploadError("");
    } catch (err) {
      console.error(err);
      setUploadError(
        "Could not read that file type. Please use PDF, DOCX, or TXT."
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rephrasedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rephrasedText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rephrased.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = ["formal", "clear", "persuasive", "concise"] as const;

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="rounded-lg bg-white shadow p-6 flex items-center gap-3">
        <div className="p-3 rounded-full bg-[color:var(--accent-light)] text-[color:var(--accent-dark)]">
          <FaEdit size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--brand-dark)]">
            Rephrasing Tool
          </h1>
          <p className="text-gray-600">
            Enhance clarity and tone in your legal documents
          </p>
        </div>
      </div>

      {/* uploader */}
      <div
        className="border-2 border-dashed border-[color:var(--accent-dark)]/40 rounded-lg p-8 text-center cursor-pointer hover:bg-[color:var(--accent-light)]/30 transition"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <FaCloudUploadAlt className="mx-auto text-4xl text-[color:var(--accent-dark)] mb-3" />
        <p className="font-medium text-[color:var(--accent-dark)]">
          Upload PDF / DOCX / TXT
        </p>
        {uploadError && (
          <p className="text-sm text-red-600 mt-2">{uploadError}</p>
        )}
      </div>

      {/* editor panes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* original */}
        <div>
          <h2 className="font-semibold text-[color:var(--brand-dark)] mb-2">
            Original Text
          </h2>
          <textarea
            className="w-full h-56 border rounded-md p-4 focus:ring-2 focus:ring-[color:var(--accent-dark)] focus:outline-none"
            placeholder="Type or upload legal text…"
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
          />
        </div>

        {/* rephrased */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[color:var(--brand-dark)]">
              Rephrased Text
            </h2>
            {rephrasedText && (
              <div className="flex gap-3 text-sm">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[color:var(--accent-dark)] hover:underline"
                >
                  {copied ? <FaCheck /> : <FaCopy />}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 text-[color:var(--accent-dark)] hover:underline"
                >
                  <FaDownload /> Download
                </button>
              </div>
            )}
          </div>
          <div className="h-56 border rounded-md p-4 bg-gray-50 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--accent-dark)]" />
              </div>
            ) : (
              rephrasedText || (
                <p className="text-gray-400 italic">
                  Rephrased text will appear here…
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {/* tabs + action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-md text-sm ${
                activeTab === t
                  ? "bg-[color:var(--accent-dark)] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <motion.button
          onClick={handleRephrase}
          disabled={!originalText.trim() || isLoading}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-white ${
            !originalText.trim() || isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[color:var(--accent-dark)] hover:bg-[color:var(--accent-light)]"
          }`}
          whileHover={{ scale: originalText.trim() && !isLoading ? 1.05 : 1 }}
          whileTap={{ scale: originalText.trim() && !isLoading ? 0.95 : 1 }}
        >
          <FaExchangeAlt /> Rephrase
        </motion.button>
      </div>
    </div>
  );
};

export default RephrasingTool;
