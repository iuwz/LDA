// ──────────────────────────────────────────────────────────────
// src/views/pages/Dashboard/TranslationTool.tsx
// ──────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  translateText,
  translateFile,
  listTranslationHistory,
  deleteTranslationReport,
  getTranslationReport,
  downloadDocumentById,
  listDocuments,
  fetchDocumentBlob,
  TranslationHistoryItem,
  DocumentRecord,
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
  FaChevronDown,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

/* ────── colour helpers ────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };

/* ────── utility ────── */
const getFileIcon = (filename: string | null | undefined, size: string) => {
  if (!filename) return <FaFileAlt className={`${size} text-gray-500`} />;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FaFilePdf className={`${size} text-red-600`} />;
  if (ext === "doc" || ext === "docx")
    return <FaFileWord className={`${size} text-blue-600`} />;
  return <FaFileAlt className={`${size} text-gray-500`} />;
};

/* ────── tiny UI atoms ────── */
const Spinner = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center gap-2 py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
    {label && <p className="text-gray-700">{label}</p>}
  </div>
);

const TranslateButton = ({
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
    className="flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2 text-white hover:bg-[rgb(173,108,37)] disabled:bg-gray-400 disabled:cursor-not-allowed"
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
  >
    {busy ? <FaSpinner className="animate-spin" /> : <FaLanguage />}
    {busy ? "Translating…" : label}
  </motion.button>
);

/* ═════════════════════════ COMPONENT ═════════════════════════ */
const TranslationTool: React.FC = () => {
  /* ───────── text state ───────── */
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromEnglish, setFromEnglish] = useState(true);
  const [copied, setCopied] = useState(false);

  /* ───────── document state ───────── */
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docProcessing, setDocProcessing] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  /* ───────── history & modal ───────── */
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ───────── open report result ───────── */
  const [result, setResult] = useState<{
    report_id: string;
    type: "text" | "doc";
    translatedText?: string;
    translatedFilename?: string | null;
    resultDocId?: string | null;
    target_lang: string;
  } | null>(null);

  /* ───────── lifecycle ───────── */
  useEffect(() => {
    loadHistory();
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = async () => setHistory(await listTranslationHistory());
  const fetchDocuments = async () => {
    setFetchingDocs(true);
    try {
      setUploadedDocs(await listDocuments());
    } finally {
      setFetchingDocs(false);
    }
  };

  /* ───────── derived data ───────── */
  const srcLangLabel = fromEnglish ? "English" : "Arabic";
  const tgtLangLabel = fromEnglish ? "Arabic" : "English";
  const translateDisabled =
    (!fileToUpload && !selectedDocId && !sourceText.trim()) ||
    isTranslating ||
    docProcessing;

  const resetFileInputs = () => {
    setFileToUpload(null);
    setSelectedDocId(null);
    setDocUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ───────── helper the compiler needed ───────── */
  const handleDocSelection = (id: string | null) => {
    setSelectedDocId(id);
    setFileToUpload(null);
    setSourceText("");
    setTranslatedText("");
    setResult(null);
    setDocUrl(null);
    setDocSelectOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ───────── translate handler ───────── */
  const handleTranslate = async () => {
    if (translateDisabled) return;

    setIsTranslating(true);
    setResult(null);
    setDocUrl(null);
    setTranslatedText("");

    /* ───── CASE 1: existing uploaded doc ───── */
    if (selectedDocId) {
      setDocProcessing(true);
      try {
        const blob = await fetchDocumentBlob(selectedDocId);
        const meta = uploadedDocs.find((d) => d._id === selectedDocId);
        const tmpFile = new File([blob], meta?.filename || "document.bin");

        const {
          blob: outBlob,
          filename,
          report_id,
          result_doc_id,
        } = (await translateFile(tmpFile, tgtLangLabel.toLowerCase())) as {
          blob: Blob;
          filename: string;
          report_id: string;
          result_doc_id?: string;
        };

        setDocUrl(URL.createObjectURL(outBlob));
        setResult({
          report_id,
          type: "doc",
          translatedFilename: filename,
          resultDocId: result_doc_id ?? report_id,
          target_lang: tgtLangLabel.toLowerCase(),
        });
        await loadHistory();
      } catch (e: any) {
        alert(e.message || "File translation failed");
      } finally {
        setDocProcessing(false);
        setIsTranslating(false);
      }
      return;
    }

    /* ───── CASE 2: freshly-uploaded doc ───── */
    if (fileToUpload) {
      setDocProcessing(true);
      try {
        const { blob, filename, report_id, result_doc_id } =
          (await translateFile(fileToUpload, tgtLangLabel.toLowerCase())) as {
            blob: Blob;
            filename: string;
            report_id: string;
            result_doc_id?: string;
          };

        setDocUrl(URL.createObjectURL(blob));
        setResult({
          report_id,
          type: "doc",
          translatedFilename: filename,
          resultDocId: result_doc_id ?? report_id,
          target_lang: tgtLangLabel.toLowerCase(),
        });
        await loadHistory();
        fetchDocuments(); // show new upload in dropdown later
      } catch (e: any) {
        alert(e.message || "File translation failed");
      } finally {
        setDocProcessing(false);
        setIsTranslating(false);
      }
      return;
    }

    /* ───── CASE 3: raw text ───── */
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
    } catch (e: any) {
      alert(e.message || "Text translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  /* ───────── open stored report ───────── */
  const openReport = async (id: string) => {
    try {
      const rep = (await getTranslationReport(id)).translation_report;
      setFromEnglish(rep.target_lang.toLowerCase() !== "arabic");

      resetFileInputs();
      setSourceText(rep.source_text ?? "");
      setTranslatedText(rep.translated_text ?? "");
      setResult({
        report_id: rep._id ?? id,
        type: rep.type,
        translatedText: rep.translated_text,
        translatedFilename: rep.translated_filename,
        resultDocId: rep.result_doc_id,
        target_lang: rep.target_lang,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert(e.message || "Failed to open translation report");
    }
  };

  /* ───────── delete flow ───────── */
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteTranslationReport(pendingDeleteId);
      setHistory((h) => h.filter((r) => r.id !== pendingDeleteId));
      if (result?.report_id === pendingDeleteId) {
        setResult(null);
        setSourceText("");
        setTranslatedText("");
      }
    } catch (e: any) {
      alert(e.message || "Delete failed");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  /* ───────── drag-and-drop helpers ───────── */
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFileToUpload(f);
    handleDocSelection(null);
  };
  const onFileDrop = (f: File | null) => {
    if (!f) return;
    setFileToUpload(f);
    handleDocSelection(null);
  };

  /* ───────── constants for icons ───────── */
  const FILE_ICON_SIZE = "text-5xl";
  const DROPDOWN_ICON_SIZE = "text-xl";

  /* ═════════════════════ JSX ═════════════════════ */
  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* ───────── header ───────── */}
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

      {/* ───────── direction toggle ───────── */}
      <div className="flex space-x-2 rounded-xl bg-white shadow-sm overflow-hidden">
        {[
          { label: "English → Arabic", val: true },
          { label: "Arabic → English", val: false },
        ].map(({ label, val }) => (
          <button
            key={label}
            onClick={() => {
              setFromEnglish(val);
              setSourceText("");
              resetFileInputs();
              setTranslatedText("");
              setResult(null);
            }}
            className={`flex-1 px-4 py-2 text-center text-sm font-medium transition ${
              fromEnglish === val
                ? "bg-[color:var(--accent-dark)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ───────── select / upload section ───────── */}
      <section className="rounded-xl border bg-white shadow-sm">
        {/* Only show when no file is currently chosen */}
        {!fileToUpload && !selectedDocId ? (
          fetchingDocs ? (
            <Spinner label="Loading documents…" />
          ) : (
            <div className="space-y-8 p-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              {/* ───── existing docs picker ───── */}
              <div className="flex flex-col items-center gap-4 rounded-lg border bg-gray-50 p-6">
                <p className="text-gray-700">
                  Translate a previously uploaded document:
                </p>

                <div className="relative w-full">
                  <button
                    className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
                    onClick={() => setDocSelectOpen(!docSelectOpen)}
                  >
                    {selectedDocId
                      ? uploadedDocs.find((d) => d._id === selectedDocId)
                          ?.filename
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
                              className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                                selectedDocId === doc._id ? "bg-gray-100" : ""
                              }`}
                              onClick={() => handleDocSelection(doc._id)}
                            >
                              {getFileIcon(doc.filename, DROPDOWN_ICON_SIZE)}
                              <span className="flex-1 break-all">
                                {doc.filename}
                              </span>
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
                  <TranslateButton
                    onClick={handleTranslate}
                    disabled={translateDisabled}
                    busy={isTranslating || docProcessing}
                    label="Translate Selected"
                  />
                )}
              </div>

              {/* ───── upload drop-zone ───── */}
              <div
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                  isTranslating || docProcessing
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:border-[color:var(--accent-dark)]"
                }`}
                onClick={() =>
                  !(isTranslating || docProcessing) &&
                  fileInputRef.current?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isTranslating || docProcessing) return;
                  onFileDrop(e.dataTransfer.files?.[0] || null);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  disabled={isTranslating || docProcessing}
                  onChange={onFileChange}
                />

                {fileToUpload ? (
                  /* —— cast once to keep TS happy —— */
                  (() => {
                    const f = fileToUpload as File;
                    return (
                      <>
                        {getFileIcon(f.name, FILE_ICON_SIZE)}
                        <p className="mt-2">{f.name}</p>
                        <p className="text-xs text-gray-500">
                          {(f.size / 1_048_576).toFixed(2)} MB
                        </p>
                        <TranslateButton
                          onClick={handleTranslate}
                          disabled={translateDisabled}
                          busy={isTranslating || docProcessing}
                          label="Translate Uploaded"
                        />
                      </>
                    );
                  })()
                ) : (
                  <>
                    <FaFileUpload className="text-5xl text-gray-400" />
                    <p className="mt-2">Drag & drop or click to upload</p>
                    <p className="text-xs text-gray-400">
                      Accepted: PDF, DOCX, TXT
                    </p>
                  </>
                )}
              </div>
            </div>
          )
        ) : null}

        {/* ───────── raw text editor ───────── */}
        {!fileToUpload && !selectedDocId && (
          <>
            <div className="grid divide-y divide-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0">
              {/* source */}
              <div className="p-6">
                <h2
                  className="mb-2 font-semibold"
                  style={{ color: BRAND.dark }}
                >
                  Source Text ({srcLangLabel})
                </h2>
                <textarea
                  className="h-56 w-full resize-none rounded-md border p-4 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)]"
                  placeholder={`Type or paste ${srcLangLabel} here…`}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  disabled={isTranslating}
                />
              </div>

              {/* translated */}
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold" style={{ color: BRAND.dark }}>
                    Translated ({tgtLangLabel})
                  </h2>
                  {translatedText && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(translatedText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
                    >
                      {copied ? <FaCheck /> : <FaCopy />}{" "}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <div className="h-56 overflow-y-auto whitespace-pre-wrap rounded-md border bg-gray-50 p-4 text-gray-800">
                  {isTranslating ? (
                    <Spinner />
                  ) : translatedText ? (
                    translatedText
                  ) : (
                    <p className="italic text-gray-400">
                      Translated text will appear here…
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end">
              <TranslateButton
                onClick={handleTranslate}
                disabled={translateDisabled}
                busy={isTranslating}
                label="Translate"
              />
            </div>
          </>
        )}

        {/* ───────── download link after doc translation ───────── */}
        {(fileToUpload || selectedDocId) && docUrl && result && (
          <div className="p-6 text-center space-y-4">
            <a
              href={docUrl || "#"}
              onClick={(e) => {
                if (
                  !docUrl &&
                  result.resultDocId &&
                  result.translatedFilename
                ) {
                  e.preventDefault();
                  downloadDocumentById(
                    result.resultDocId,
                    result.translatedFilename!
                  );
                }
              }}
              download={result.translatedFilename || "translated_document"}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-light)] px-6 py-2 text-[color:var(--accent-dark)] hover:bg-[color:var(--accent-dark)] hover:text-white"
            >
              <FaDownload /> Download Translated Document
            </a>
          </div>
        )}
      </section>

      {/* ───────── history list ───────── */}
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
                const isDoc =
                  h.type === "doc" && h.result_doc_id && h.translated_filename;

                return (
                  <li
                    key={h.id}
                    className="flex flex-col rounded-lg border border-[#c17829]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="mb-3 sm:mb-0 min-w-0 flex-1">
                      <p className="flex items-start text-sm font-semibold text-gray-800">
                        <span className="mr-2 mt-0.5 flex-shrink-0 text-[#c17829]">
                          {getFileIcon(h.translated_filename, "text-xl")}
                        </span>
                        <span
                          className="break-all cursor-pointer hover:underline"
                          onClick={() => {
                            if (isDoc) {
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
                      {isDoc ? (
                        <motion.button
                          onClick={() =>
                            downloadDocumentById(
                              h.result_doc_id!,
                              h.translated_filename!
                            )
                          }
                          className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-[#c17829] hover:bg-[#a66224]/10"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaDownload /> Download
                        </motion.button>
                      ) : (
                        <button
                          onClick={() => openReport(h.id)}
                          className="flex items-center gap-1 text-sm text-[#c17829] hover:text-[#a66224] hover:underline"
                        >
                          <FaSearch /> View
                        </button>
                      )}

                      <button
                        onClick={() => setPendingDeleteId(h.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
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

      {/* ───────── delete confirmation modal ───────── */}
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
                    {isDeleting && (
                      <FaSpinner className="mr-2 inline-block animate-spin" />
                    )}
                    {isDeleting ? "Deleting…" : "Delete"}
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

export default TranslationTool;
