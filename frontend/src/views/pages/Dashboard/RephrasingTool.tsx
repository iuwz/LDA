// RephrasingTool.tsx

import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import {
  FaEdit,
  FaUpload,
  FaFileAlt,
  FaTrash,
  FaExchangeAlt,
  FaCopy,
  FaCheck,
  FaDownload, // Import the download icon
  FaSpinner,
  FaChevronDown,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  uploadDocument,
  listDocuments,
  rephrase, // Use the updated rephrase function
  getDocumentContent, // Still used for previewing content if needed
  downloadDocumentById, // Import the new download function
  DocumentRecord,
  RephraseTextResponse, // Import response types
  RephraseDocumentResponse,
} from "../../../api"; // Assuming api.ts is in the parent directory

/* ──────────────────────────────────────────────────────────────
   BRAND TOKENS (must match your CSS :root values)
   ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = {
  dark: "var(--accent-dark)",
  light: "var(--accent-light)",
} as const;
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

/* ──────────────────────────────────────────────────────────────
   STYLE OPTIONS
   ────────────────────────────────────────────────────────────── */
const STYLE_OPTIONS = [
  { id: "formal", label: "Formal" },
  { id: "clear", label: "Clear" },
  { id: "persuasive", label: "Persuasive" },
  { id: "concise", label: "Concise" },
] as const;
type StyleId = (typeof STYLE_OPTIONS)[number]["id"];

/* ──────────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────────── */
const RephrasingTool: React.FC = () => {
  // State for uploaded documents
  const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [docSelectOpen, setDocSelectOpen] = useState(false);

  // State for current operation (text or document rephrasing)
  const [originalText, setOriginalText] = useState(""); // Used for text mode or showing doc info
  const [rephrasedText, setRephrasedText] = useState(""); // Only used for text rephrasing output
  const [isLoading, setIsLoading] = useState(false);
  const [activeStyle, setActiveStyle] = useState<StyleId>("formal");
  const [copied, setCopied] = useState(false); // Only for text rephrasing
  const [error, setError] = useState<string | null>(null);

  // State for document rephrasing result
  const [rephrasedDocDetails, setRephrasedDocDetails] = useState<{ id: string, filename: string } | null>(null);


  // File upload state (for new uploads)
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ──────────────────────────────────────────────────────────────
     Effects
     ────────────────────────────────────────────────────────────── */
  // Fetch uploaded documents on component mount
  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  // When a document is selected, update the original text area display
  useEffect(() => {
    if (selectedDocId) {
        const doc = uploadedDocs.find(d => d._id === selectedDocId);
        setOriginalText(doc ? `Document selected: ${doc.filename}` : "Select a Document");
        setRephrasedText(""); // Clear previous rephrased text
        setRephrasedDocDetails(null); // Clear previous document rephrasing result
    } else {
      setOriginalText(""); // Clear original text when no document is selected
      setRephrasedText(""); // Clear previous rephrased text
      setRephrasedDocDetails(null); // Clear previous document rephrasing result
    }
    setError(null);
     // Add uploadedDocs to dependency array to ensure filename is found
  }, [selectedDocId, uploadedDocs]);


  /* ──────────────────────────────────────────────────────────────
     API Calls
     ────────────────────────────────────────────────────────────── */
  const fetchUploadedDocuments = async () => {
    setFetchingDocs(true);
    setError(null);
    try {
      const docs = await listDocuments();
      setUploadedDocs(docs);
    } catch (err: any) {
      setError("Failed to load uploaded documents.");
      console.error("Failed to fetch documents:", err);
    } finally {
      setFetchingDocs(false);
    }
  };

  // We no longer automatically fetch content to display for document mode
  // const fetchDocumentContent = async (docId: string) => { ... }


  const handleRephrase = async () => {
    setIsLoading(true);
    setError(null);
    setRephrasedText(""); // Clear previous text rephrase output
    setRephrasedDocDetails(null); // Clear previous doc rephrase output


    try {
      if (selectedDocId) {
        // --- Document Rephrasing ---
        const result = await rephrase({ doc_id: selectedDocId, style: activeStyle });
         // We expect RephraseDocumentResponse here
         const docResult = result as RephraseDocumentResponse;
         setRephrasedDocDetails({
            id: docResult.rephrased_doc_id,
            filename: docResult.rephrased_doc_filename
         });
         // Optionally trigger download immediately or wait for user click
         // handleDownloadDocument(docResult.rephrased_doc_id, docResult.rephrased_doc_filename);
      } else if (originalText.trim()) {
        // --- Text Rephrasing ---
        const result = await rephrase({ document_text: originalText, style: activeStyle });
        // We expect RephraseTextResponse here
        const textResult = result as RephraseTextResponse;
        setRephrasedText(textResult.rephrased_text);
      } else {
         setError("Please enter or select text/document to rephrase.");
      }

    } catch (err: any) {
      setError(`Failed to rephrase: ${err.message || 'Unknown error'}`);
      console.error("Rephrase API error:", err);
       setRephrasedText(""); // Ensure text output is clear on doc error
       setRephrasedDocDetails(null); // Ensure doc output is clear on text error
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setNewFile(file);

    try {
      const result = await uploadDocument(file);
      console.log("Upload successful:", result);
      await fetchUploadedDocuments(); // Refresh the list of documents
      // After upload, select the new document so the user can rephrase it
      setSelectedDocId(result.doc_id); // This will trigger the useEffect to update originalText

      setNewFile(null); // Clear the file input state
    } catch (err: any) {
      setError("Failed to upload document.");
      console.error("Upload API error:", err);
      setNewFile(null); // Clear the file input state
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input
      }
    }
  };

  const handleDownloadDocument = (docId: string, filename: string) => {
      setIsLoading(true); // Show loading while downloading
      setError(null);
      downloadDocumentById(docId, filename)
         .catch(err => {
             setError(`Failed to download document: ${err.message || 'Unknown error'}`);
             console.error("Download error:", err);
         })
         .finally(() => {
             setIsLoading(false); // Hide loading after download attempt
         });
  };


  /* ──────────────────────────────────────────────────────────────
     Handlers
     ────────────────────────────────────────────────────────────── */

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value);
    setSelectedDocId(null); // Clear selected document when typing
    setRephrasedText(""); // Clear previous rephrased text output
    setRephrasedDocDetails(null); // Clear previous document rephrasing result
    setError(null);
  };

  const handleCopy = () => {
    if (rephrasedText) {
      navigator.clipboard.writeText(rephrasedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDocSelection = (docId: string | null) => {
    setSelectedDocId(docId);
    setDocSelectOpen(false);
    // Effects hook will handle updating originalText and clearing results
  };

  /* ──────────────────────────────────────────────────────────────
     Render Helpers
     ────────────────────────────────────────────────────────────────────── */

  /* ──────────────────────────────────────────────────────────────
     Component Layout
     ────────────────────────────────────────────────────────────── */

  // Determine placeholder text for original text area
  const originalTextPlaceholder = selectedDocId
    ? "Document content will not be displayed here for document rephrasing mode."
    : "Type your text here…";

  // Determine content for rephrased text area
  const rephrasedContent = selectedDocId ? (
      isLoading ? (
           <div className="flex h-full items-center justify-center">
               <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
           </div>
      ) : rephrasedDocDetails ? (
           <div className="flex h-full items-center justify-center flex-col gap-4 text-gray-800">
               <p>Document rephrased successfully!</p>
               <button
                   onClick={() => handleDownloadDocument(rephrasedDocDetails.id, rephrasedDocDetails.filename)}
                   className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={isLoading} // Disable if already loading/downloading
               >
                   <FaDownload /> Download "{rephrasedDocDetails.filename}"
               </button>
           </div>
      ) : (
         <p className="italic text-gray-400">
            Rephrased document will be available for download here…
         </p>
      )
  ) : ( // Text rephrasing mode
     isLoading ? (
         <div className="flex h-full items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
         </div>
     ) : rephrasedText ? (
         <p className="whitespace-pre-line text-gray-800">
           {rephrasedText}
         </p>
     ) : (
       <p className="italic text-gray-400">
         Your rephrased text will appear here…
       </p>
     )
  );


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

      {/* Document Selection and Upload */}
      <div className="px-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Document Select Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)] focus:border-[color:var(--accent-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setDocSelectOpen(!docSelectOpen)}
              disabled={fetchingDocs || isLoading}
            >
              {selectedDocId
                ? uploadedDocs.find((doc) => doc._id === selectedDocId)?.filename ||
                  "Select a Document"
                : "Select a Document"}
              {fetchingDocs ? (
                <FaSpinner className="animate-spin ml-2" />
              ) : (
                <FaChevronDown className={`ml-2 transition-transform ${docSelectOpen ? 'rotate-180' : 'rotate-0'}`} />
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
                  {uploadedDocs.length > 0 ? (
                    // Add an option to clear selection
                    <li
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleDocSelection(null)}
                      >
                        Clear Selection
                      </li>
                  ) : null}
                  {uploadedDocs.map((doc) => (
                    <li
                      key={doc._id}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleDocSelection(doc._id)}
                    >
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

          {/* Upload New Document Button */}
          <div>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || fetchingDocs}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaUpload /> Upload New Document
            </button>
          </div>
        </div>
        {newFile && !isLoading && (
            <p className="mt-2 text-sm text-gray-600">Selected for upload: {newFile.name}</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>


      {/* Content Area */}
      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Original Text / Document Content */}
          <div className="p-6">
            <h2 className="font-medium text-[color:var(--brand-dark)] mb-2">
              {selectedDocId ? "Selected Document" : "Original Text"} {/* Changed title */}
            </h2>
            <textarea
              className="w-full h-64 resize-none rounded-lg border border-gray-300 p-4 focus:border-[color:var(--accent-dark)] focus:ring-2 focus:ring-[color:var(--accent-dark)] outline-none bg-gray-50"
              placeholder={originalTextPlaceholder}
              value={originalText}
              onChange={handleTextChange}
              disabled={!!selectedDocId || isLoading} // Disable if a doc is selected or loading
              // Make textarea readOnly in document mode
              readOnly={!!selectedDocId}
            />
             {selectedDocId && !isLoading && (
                 <p className="mt-2 text-sm text-gray-600">Ready to rephrase document ID: {selectedDocId}</p>
             )}
          </div>

          {/* Rephrased Text / Document Result */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-[color:var(--brand-dark)]">
                {selectedDocId ? "Rephrased Document" : "Rephrased Text"} {/* Changed title */}
              </h2>
              {/* Show Copy button only in text mode */}
              {!selectedDocId && rephrasedText && (
                 <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-sm text-[color:var(--accent-dark)] hover:underline"
                      disabled={copied}
                    >
                      {/* Use span explicitly */}
                      {copied ? <span><FaCheck /> Copied</span> : <span><FaCopy /> Copy</span>}
                    </button>
                 </div>
              )}
            </div>
            <div className="h-64 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
              {rephrasedContent} {/* Use the determined content */}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-gray-50 p-4 flex justify-end">
          <motion.button
            onClick={handleRephrase}
            // Disable if no text/doc selected, or loading/fetching docs
            disabled={(!originalText.trim() && !selectedDocId) || isLoading || fetchingDocs}
            className={`flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white transition-colors ${(!originalText.trim() && !selectedDocId) || isLoading || fetchingDocs ? "opacity-50 cursor-not-allowed" : "hover:bg-[color:var(--accent-light)]"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaExchangeAlt />
            )}
            {isLoading ? "Processing..." : (selectedDocId ? "Rephrase Document" : "Rephrase Text")} {/* Dynamic button text */}
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default RephrasingTool;