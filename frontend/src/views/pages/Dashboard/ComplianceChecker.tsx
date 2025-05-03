// src/views/pages/Dashboard/ComplianceChecker.tsx

import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import {
    FaClipboardCheck,
    FaCloudUploadAlt, // Used for drag-and-drop UI
    FaFileAlt, // Generic file icon
    FaTrash, // Not used in this version
    FaSearch,
    FaFilePdf, // PDF icon
    FaFileWord, // DOCX icon
    FaExclamationCircle,
    FaInfoCircle,
    FaSpinner, // Loading spinner
    FaDownload, // Download icon
    FaChevronDown, // Dropdown icon
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // Animation
import {
    uploadDocument, // Import the upload API function
    listDocuments,
    checkCompliance, // Compliance check API
    downloadComplianceReport, // Download report API
    DocumentRecord, // Document record type
    ComplianceReportResponse, // Compliance report type
    ComplianceIssue, // Compliance issue type
} from "../../../api"; // Adjust the import path as necessary

// Removed import { FileUpload } from "../../components/common/FileUpload"; // <-- Removed

/** ──────────────────────────────────────────────────────────────
 * Data Types (Using imported types from api.ts)
 * ────────────────────────────────────────────────────────────── */
// Using types imported from api.ts

interface DisplayIssue extends ComplianceIssue {
    // Add any frontend-specific fields if needed
}

interface DisplayAnalysisResult extends ComplianceReportResponse {
    // Extends the backend response structure
    overallStatus: "compliant" | "non-compliant" | "warning" | "unknown"; // Determine overall status on frontend
    complianceScore: number; // Calculate compliance score on frontend
    analyzedFilename?: string; // Store the filename that was analyzed
    // The backend report stores a timestamp, we can use that if we retrieve the full report
}

/** ──────────────────────────────────────────────────────────────
 * Brand Tokens (assuming these are defined or can be inferred)
 * ────────────────────────────────────────────────────────────── */
// Placeholder values if not globally defined - replace with your actual design tokens
const BRAND = { dark: "#1a202c" }; // Example dark text color
const ACCENT = { dark: "#c17829", light: "#ffe9d1" }; // Example accent colors
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)"; // Example shadow


// Logger replacement (using console)
const logger = {
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
};


/** ──────────────────────────────────────────────────────────────
 * Status Badge (Use imported ComplianceIssue status)
 * ────────────────────────────────────────────────────────────── */
const ComplianceStatus: React.FC<{ status: string }> = ({ status }) => {
    // Map backend status strings to frontend display categories
    const displayStatus: "compliant" | "non-compliant" | "warning" | "unknown" =
        status.toLowerCase() === "ok"
            ? "compliant"
            : status.toLowerCase() === "issue found"
            ? "non-compliant"
            : status.toLowerCase() === "warning"
            ? "warning"
            : "unknown";


    const palette: Record<typeof displayStatus, string> = {
        compliant: "bg-green-100 text-green-800 border-green-200",
        "non-compliant": "bg-red-100 text-red-800 border-red-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        unknown: "bg-gray-100 text-gray-800 border-gray-200",
    };
    const icons: Record<typeof displayStatus, React.ReactNode> = {
        compliant: <FaClipboardCheck className="mr-1" />,
        "non-compliant": <FaExclamationCircle className="mr-1" />,
        warning: <FaInfoCircle className="mr-1" />,
        unknown: <FaInfoCircle className="mr-1" />, // Default icon for unknown
    };
    const labels: Record<typeof displayStatus, string> = {
        compliant: "Compliant",
        "non-compliant": "Non-Compliant",
        warning: "Warning",
        unknown: "Unknown Status",
    };

    return (
        <span
            className={`flex items-center px-2 py-1 text-xs font-medium rounded border ${palette[displayStatus]}`}
        >
            {icons[displayStatus]}
            {labels[displayStatus]}
        </span>
    );
};

/** ──────────────────────────────────────────────────────────────
 * Main Component
 * ────────────────────────────────────────────────────────────── */
const ComplianceChecker: React.FC = () => {
    // State for uploaded documents (existing in DB)
    const [uploadedDocs, setUploadedDocs] = useState<DocumentRecord[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [fetchingDocs, setFetchingDocs] = useState(false);
    const [docSelectOpen, setDocSelectOpen] = useState(false);

    // State for a NEW file selected for upload
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input


    // State for analysis loading
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<DisplayAnalysisResult | null>(null); // Use DisplayAnalysisResult
    const [error, setError] = useState<string | null>(null);


    /* ──────────────────────────────────────────────────────────────
     * Effects
     * ────────────────────────────────────────────────────────────── */
    // Fetch uploaded documents on component mount
    useEffect(() => {
        fetchUploadedDocuments();
    }, []);

    // Effect to update analyzedFilename when selectedDocId or fileToUpload changes
    useEffect(() => {
        if (selectedDocId && uploadedDocs.length > 0) {
            const doc = uploadedDocs.find(d => d._id === selectedDocId);
            if (doc) {
                 setResults(prev => prev ? { ...prev, analyzedFilename: doc.filename } : null);
            }
        } else if (fileToUpload) {
             setResults(prev => prev ? { ...prev, analyzedFilename: fileToUpload.name } : null);
        } else {
             setResults(prev => prev ? { ...prev, analyzedFilename: undefined } : null);
        }
    }, [selectedDocId, fileToUpload, uploadedDocs]);


    /* ──────────────────────────────────────────────────────────────
     * API Calls
     * ────────────────────────────────────────────────────────────── */
    const fetchUploadedDocuments = async () => {
        setFetchingDocs(true);
        setError(null);
        try {
            const docs = await listDocuments();
            setUploadedDocs(docs);
            // Optionally clear selectedDocId if the list changes significantly or if the previously selected doc is no longer there
             if (selectedDocId && !docs.find(d => d._id === selectedDocId)) {
                 setSelectedDocId(null);
                 setResults(null); // Clear results for old selection
             }
        } catch (err: any) {
            setError("Failed to load uploaded documents.");
            console.error("Failed to fetch documents:", err);
        } finally {
            setFetchingDocs(false);
        }
    };

    // Main function to trigger analysis
    const handleAnalyze = async () => {
        let docIdToAnalyze: string | null = null;
        let uploadedFilename: string | undefined = undefined;

        setAnalyzing(true); // Start loading state
        setResults(null); // Clear previous results
        setError(null);

        // 1. Determine source: new file upload or existing document selection
        if (fileToUpload) {
            logger.info(`Uploading new file for analysis: ${fileToUpload.name}`);
            try {
                // Upload the file first
                const uploadResponse = await uploadDocument(fileToUpload);
                docIdToAnalyze = uploadResponse.doc_id;
                uploadedFilename = fileToUpload.name; // Store filename for display
                 // Refresh the list of uploaded documents in the background
                fetchUploadedDocuments(); // Consider awaiting this if you need the new doc in the list immediately for display
            } catch (uploadErr: any) {
                setError(`File upload failed: ${uploadErr.message || 'Unknown error'}`);
                console.error("File upload API error:", uploadErr);
                setAnalyzing(false); // Stop loading on upload failure
                return; // Stop the process
            }
        } else if (selectedDocId) {
            logger.info(`Analyzing existing document with ID: ${selectedDocId}`);
            docIdToAnalyze = selectedDocId;
            // Find filename for display if it's an existing doc
            const existingDoc = uploadedDocs.find(doc => doc._id === selectedDocId);
            uploadedFilename = existingDoc ? existingDoc.filename : "Unknown Existing Document";
        } else {
            // This case should be caught by the button disabled state, but as a safeguard
            setError("Please select or upload a document to analyze.");
            setAnalyzing(false);
            return;
        }

        // Ensure we have a docId to analyze
        if (!docIdToAnalyze) {
             setError("No document ID available for analysis.");
             setAnalyzing(false);
             return;
        }


        // 2. Perform compliance analysis using the docId
        try {
            const report = await checkCompliance({ doc_id: docIdToAnalyze });

            // Determine overall status and calculate score based on backend issues
            let overall: DisplayAnalysisResult['overallStatus'] = "compliant";
            let nonCompliantCount = 0;
            let warningCount = 0;
            let okCount = 0;


            report.issues.forEach(issue => {
                if (issue.status.toLowerCase() === "issue found") {
                    overall = "non-compliant"; // If any non-compliant, overall is non-compliant
                    nonCompliantCount++;
                } else if (issue.status.toLowerCase() === "warning") {
                    if (overall !== "non-compliant") {
                        overall = "warning"; // If no non-compliant, but warnings exist, overall is warning
                    }
                    warningCount++;
                } else if (issue.status.toLowerCase() === "ok") {
                    okCount++; // Count OK statuses
                }
                // For any other status string, it defaults to "unknown" in the ComplianceStatus badge,
                // and doesn't affect these counts unless you add more conditions here.
            });

            // If the issues list is not empty, but no 'issue found' or 'warning' statuses were explicitly mapped
            // and not all issues were 'ok', then overall status might be 'unknown'.
            if (report.issues.length > 0 && overall === "compliant" && (nonCompliantCount === 0 && warningCount === 0 && okCount !== report.issues.length)) {
                overall = "unknown";
            } else if (report.issues.length === 0) {
                overall = "compliant"; // If the issues list is empty, assume compliant
            }


            // Simple score calculation: e.g., 100 - (non-compliant issues * weight + warning issues * weight)
            // This is a basic example, adjust calculation based on desired scoring logic.
            const totalIssuesConsidered = nonCompliantCount + warningCount;
            const complianceScore = totalIssuesConsidered > 0 ?
                Math.max(0, 100 - (nonCompliantCount * 15 + warningCount * 5)) :
                100; // If no issues found, score is 100


            // Store the results including the calculated overall status and score
            setResults({
                ...report,
                overallStatus: overall,
                complianceScore: complianceScore,
                analyzedFilename: uploadedFilename, // Use the determined filename
                // Assuming the backend report has a timestamp field like `timestamp`
            } as DisplayAnalysisResult); // Cast to the display type


        } catch (analyzeErr: any) {
            setError(`Compliance check failed: ${analyzeErr.message || 'Unknown error'}`);
            console.error("Compliance check API error:", analyzeErr);
        } finally {
            setAnalyzing(false);
        }
    };


    const handleDownloadReport = async () => {
        if (!results || !results.report_id) {
            setError("No report available to download.");
            return;
        }
        // Use the new download API function - it handles the file download directly
        await downloadComplianceReport(results.report_id);
    };


    /* ──────────────────────────────────────────────────────────────
     * Handlers
     * ────────────────────────────────────────────────────────────── */

    // Handler for selecting a document from the dropdown
    const handleDocSelection = (docId: string | null) => {
        setSelectedDocId(docId);
        setFileToUpload(null); // Clear any selected file to upload
        if (fileInputRef.current) { fileInputRef.current.value = ""; } // Clear file input value
        setDocSelectOpen(false);
        // Clear results and error when a new document is selected or selection is cleared
        setResults(null);
        setError(null);
    };

     // Handler for when a file is selected via the input
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0] ?? null;
        setFileToUpload(file);
        setSelectedDocId(null); // Clear any selected existing document
         // No need to close dropdown here, it's a separate input area
        setResults(null); // Clear results
        setError(null); // Clear error
    };

     // Handler for file drop
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setError(null);
        const file = e.dataTransfer.files?.[0] ?? null;
        setFileToUpload(file);
        setSelectedDocId(null); // Clear any selected existing document
         if (fileInputRef.current) { fileInputRef.current.value = ""; } // Clear file input value
        setResults(null); // Clear results
        setError(null); // Clear error
    };


    const reset = () => {
        // Reset state to initial view (document selection/upload)
        setSelectedDocId(null);
        setFileToUpload(null);
        if (fileInputRef.current) { fileInputRef.current.value = ""; } // Clear file input value
        setResults(null);
        setError(null);
        // Refetch the document list to ensure it's up-to-date after potential uploads
        fetchUploadedDocuments();
    };

    // Function to get file icon based on filename extension
    const getFileIcon = (filename: string) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FaFilePdf className="text-red-600" />;
            case 'docx':
            case 'doc':
                return <FaFileWord className="text-blue-600" />;
            case 'txt': // Add icon for text files
                 return <FaFileAlt className="text-gray-500" />;
            default:
                return <FaFileAlt className="text-gray-500" />;
        }
    };

    // Determine if the main Analyze button should be disabled
    const isAnalyzeButtonDisabled = (!selectedDocId && !fileToUpload) || analyzing || fetchingDocs;


    /* ──────────────────────────────────────────────────────────────
     * Component Layout
     * ────────────────────────────────────────────────────────────── */
    // Determine content for the upload/select area
    const selectAnalyzeAreaContent = (() => {
        // Show loading spinner if either fetching docs or analyzing is true
        if (analyzing || fetchingDocs) {
            return (
                <div className="mt-6 text-center text-gray-700">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
                    <p className="mt-2">{analyzing ? "Analyzing document…" : "Loading documents..."}</p>
                </div>
            );
        }

        // Find the currently selected document object to display filename
        const selectedDoc = uploadedDocs.find(doc => doc._id === selectedDocId);
        // Determine the filename to display in the selection area
        const displayedFilename = selectedDoc ? selectedDoc.filename : (fileToUpload ? fileToUpload.name : "No file selected");


        return (
            <div className="p-4 sm:p-8 space-y-6">

                 {/* File Selection/Upload Options Area (Visible when no analysis results are shown) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: Select from Uploaded Documents */}
                    <div className="flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                         <p className="text-gray-700 mb-2">Analyze a previously uploaded document:</p>

                         {/* Document Select Dropdown */}
                        <div className="relative w-full">
                            <button
                                 className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-dark)] focus:border-[color:var(--accent-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                                 onClick={() => setDocSelectOpen(!docSelectOpen)}
                                 disabled={analyzing || fetchingDocs}
                            >
                                 {selectedDoc ? displayedFilename : 'Choose Document'}
                                 <FaChevronDown className={`ml-2 transition-transform ${docSelectOpen ? 'rotate-180' : 'rotate-0'}`} />
                            </button>
                            <AnimatePresence>
                                {docSelectOpen && (
                                     <motion.ul
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 overflow-auto"
                                         // Basic way to close dropdown on click outside - might need a more robust hook
                                         tabIndex={-1} // Make list focusable
                                         onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDocSelectOpen(false); } }}
                                     >
                                        {/* Option to clear selection */}
                                        {selectedDocId && ( // Only show clear if something is selected
                                            <li
                                                 className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                 onClick={() => handleDocSelection(null)}
                                            >
                                                 Clear Selection
                                            </li>
                                        )}

                                        {uploadedDocs.length > 0 ? (
                                             uploadedDocs.map((doc) => (
                                                <li
                                                     key={doc._id}
                                                     className={`px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${selectedDocId === doc._id ? 'bg-gray-100 font-semibold' : ''}`}
                                                     onClick={() => handleDocSelection(doc._id)}
                                                >
                                                     {getFileIcon(doc.filename)} {doc.filename}
                                                </li>
                                             ))
                                        ) : (
                                             <li className="px-4 py-2 text-sm text-gray-500 italic">
                                                 No documents uploaded yet.
                                             </li>
                                        )}
                                         {/* No fetchingDocs state needed here as dropdown content is already fetched */}
                                     </motion.ul>
                                )}
                            </AnimatePresence>
                        </div>
                         {/* Analyze Button for Selected Document */}
                         {selectedDocId && ( // Show analyze button only if a document is selected
                             <div className="flex justify-center mt-4">
                                 <motion.button
                                     onClick={handleAnalyze} // Call the main handleAnalyze function
                                     disabled={isAnalyzeButtonDisabled} // Use main disabled state
                                     className={`flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2 text-white transition-colors ${isAnalyzeButtonDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[rgb(173,108,37)]"}`}
                                     whileHover={{ scale: 1.05 }}
                                     whileTap={{ scale: 0.95 }}
                                 >
                                      {analyzing ? (
                                          <FaSpinner className="animate-spin" />
                                      ) : (
                                          <FaSearch />
                                      )}
                                      {analyzing ? "Analyzing..." : "Analyze Selected"}
                                 </motion.button>
                             </div>
                         )}
                    </div>

                     {/* Option 2: Upload a New File */}
                    <div
                         className="
                            flex cursor-pointer flex-col items-center justify-center gap-2
                            w-full
                            rounded-lg border-2 border-dashed border-gray-300
                            p-10 text-center
                            transition-colors
                            hover:border-[color:var(--accent-dark)]
                            disabled:opacity-50 disabled:cursor-not-allowed
                         "
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={onDrop}
                         // Remove the disabling condition from the onClick handler
                         // Now clicking the div will always attempt to trigger the file input click.
                         // The input itself is disabled when busy, preventing selection.
                         onClick={() => { fileInputRef.current?.click(); }}
                         aria-disabled={isAnalyzeButtonDisabled} // Keep aria-disabled for screen readers/styling
                    >
                         <input
                         id="upload"
                         type="file"
                         accept=".pdf,.docx,.doc,.txt" // Define accepted types
                         className="hidden" // <-- Hidden input
                         onChange={onFileChange}
                         ref={fileInputRef} // <-- Ref attached here
                         disabled={isAnalyzeButtonDisabled} // Disable input if overall state is disabled (prevents file picker interaction)
                         />
                         {fileToUpload ? (
                         <>
                         {getFileIcon(fileToUpload.name)}
                         <p className="mt-2 font-medium text-gray-700">{fileToUpload.name}</p>
                         <p className="text-sm text-gray-500">
                         {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB
                         </p>
                         </>
                         ) : (
                         <>
                         <FaCloudUploadAlt className="text-5xl text-gray-400" />
                         <p className="mt-2 text-gray-700">
                         Drag & drop or click to upload
                         </p>
                         <p className="text-xs text-gray-400">
                         Supported: PDF, DOCX, DOC, TXT (Check backend for size limits)
                         </p>
                         </>
                         )}
                    </div>
                </div>

                 {/* Analyze Button for Uploaded File (Shown only when a new file is selected) */}
                 {fileToUpload && !selectedDocId && ( // Show analyze button only if a new file is selected and no existing doc is selected
                     <div className="flex justify-center mt-4">
                         <motion.button
                             onClick={handleAnalyze} // Call the main handleAnalyze function
                             disabled={isAnalyzeButtonDisabled} // Use main disabled state
                             className={`flex items-center gap-2 rounded-md bg-[rgb(193,120,41)] px-6 py-2 text-white transition-colors ${isAnalyzeButtonDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[rgb(173,108,37)]"}`}
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                         >
                             {analyzing ? (
                                 <FaSpinner className="animate-spin" />
                             ) : (
                                 <FaSearch />
                             )}
                             {analyzing ? "Analyzing..." : "Analyze Uploaded File"}
                         </motion.button>
                     </div>
                 )}

                 {/* Display general error if it occurred outside of upload/fetch */}
                 {error && !fetchingDocs && !analyzing && (
                     <p className="mt-4 text-center text-sm text-red-600">{error}</p>
                 )}

            </div>
        );
    })();


    // Calculate counts for the summary display from actual results
    const resultCounts: Record<'compliant' | 'non-compliant' | 'warning' | 'unknown', number> = results
        ? results.issues.reduce(
            (acc, { status }) => {
                const displayStatus: 'compliant' | 'non-compliant' | 'warning' | 'unknown' =
                    status.toLowerCase() === "ok" ? "compliant" :
                    status.toLowerCase() === "issue found" ? "non-compliant" :
                    status.toLowerCase() === "warning" ? "warning" :
                    "unknown"; // Default for any other status string

                // Increment count based on the mapped display status
                acc[displayStatus]++;
                return acc;
            },
            { compliant: 0, "non-compliant": 0, warning: 0, unknown: 0 } // Initialize counts for all possibilities
        )
        : { compliant: 0, "non-compliant": 0, warning: 0, unknown: 0 }; // Default counts when no results


    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
                {/* Using bracket notation for dynamic CSS variables if you use them */}
                <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
                <div className="flex items-center gap-4 p-6">
                    <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
                        <FaClipboardCheck size={22} />
                    </span>
                    <div>
                        {/* Using bracket notation for dynamic CSS variables if you use them */}
                        <h1 className="font-serif text-2xl font-bold text-[color:var(--brand-dark)]">
                            Compliance Checker
                        </h1>
                        <p className="text-gray-600">International Law — Saudi Arabia</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <section className="rounded-xl border bg-white shadow-sm">
                {!results ? (
                    selectAnalyzeAreaContent // Show document selection/analysis area
                ) : (
                    <>
                        {/* Summary */}
                        <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                {/* Use file icon based on analyzed filename */}
                                {results.analyzedFilename ? getFileIcon(results.analyzedFilename) : <FaFileAlt className="text-2xl text-gray-500" />}
                                <div>
                                    <h3 className="font-medium text-gray-800">{results.analyzedFilename || "Analyzed Document"}</h3>
                                    {/* Assuming backend report has a timestamp field. Backend controller added one */}
                                    {/* Accessing timestamp from results directly */}
                                    {/* <p className="text-sm text-gray-500 mt-1"> */}
                                    {/* Report ID: {results.report_id} */}
                                    {/* {results.timestamp && ` - Checked ${new Date(results.timestamp).toLocaleDateString()}`} */}
                                    {/* </p> */}
                                     {/* Simplified display showing report ID */}
                                     <p className="text-sm text-gray-500 mt-1">Report ID: {results.report_id}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-1">Overall Status</p>
                                    <ComplianceStatus status={results.overallStatus} /> {/* Use calculated overall status */}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-1">Score</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {results.complianceScore}/100 {/* Use calculated score */}
                                    </p>
                                </div>
                                {/* Download Report Button */}
                                <motion.button
                                    onClick={handleDownloadReport}
                                    disabled={!results.report_id} // Disable if no report ID
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-1 rounded-md bg-[color:var(--accent-dark)] px-4 py-2 text-sm text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaDownload /> Download Report
                                </motion.button>
                                {/* Analyze Another Button */}
                                <motion.button
                                    onClick={reset}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-1 rounded-md bg-[rgb(193,120,41)] px-4 py-2 text-sm text-white hover:bg-[rgb(173,108,37)]"
                                >
                                    Analyze Another
                                </motion.button>
                            </div>
                        </div>

                        {/* Counts */}
                        {/* Ensure count display handles 'unknown' status if you want to show it */}
                        {/* You might filter out 'unknown' or handle it specially */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                            {(['compliant', 'non-compliant', 'warning'] as const).map( // Explicitly list statuses you want to display
                                (lvl) => (
                                    <div
                                        key={lvl}
                                        className="rounded-lg border bg-gray-50 p-4 text-center"
                                        style={{ boxShadow: SHADOW }}
                                    >
                                        <p className="text-sm text-gray-500 mb-1">
                                            {lvl[0].toUpperCase() + lvl.slice(1)} Items
                                        </p>
                                        <p className="text-2xl font-bold text-gray-800">{resultCounts[lvl]}</p> {/* Use calculated count */}
                                    </div>
                                )
                            )}
                            {/* Optionally display unknown count */}
                            {/* {resultCounts.unknown > 0 && (
                                <div key="unknown" className="rounded-lg border bg-gray-50 p-4 text-center" style={{ boxShadow: SHADOW }}>
                                    <p className="text-sm text-gray-500 mb-1">Unknown Status Items</p>
                                    <p className="text-2xl font-bold text-gray-800">{resultCounts.unknown}</p>
                                </div>
                            )} */}
                        </div>

                        {/* Details */}
                        <div className="space-y-4 p-6">
                            {/* Use actual issues from backend results */}
                            {results.issues.map((item, index) => ( // Add index for key if no stable ID
                                <div
                                    // Use report_id from results, and rule_id + index for key for better stability
                                    key={`${results.report_id}-${item.rule_id}-${index}`}
                                    className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {item.description} {/* Use description as main title */}
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2">
                                                    Rule ID: {item.rule_id} {/* Display rule ID */}
                                                </span>
                                            </p>
                                            {/* Recommendation might be part of the description from backend */}
                                            {/* If backend provides separate recommendation, display it here */}
                                            {/* <p className="text-sm text-gray-600 mt-1">{item.recommendation}</p> */}
                                        </div>
                                        <ComplianceStatus status={item.status} /> {/* Use backend status */}
                                    </div>
                                    {/* Display info box if status is not "OK" (or "compliant") */}
                                    {item.status.toLowerCase() !== "ok" && item.status.toLowerCase() !== "compliant" && (
                                        // Assuming description contains the necessary details/recommendation
                                        <div className="flex flex-col md:flex-row items-start gap-2 rounded-md bg-[color:var(--accent-light)]/50 p-3">
                                            <FaInfoCircle className="text-[color:var(--accent-dark)] mt-1" />
                                            <div className="text-[color:var(--accent-dark)] text-sm space-y-2">
                                                <p>{item.description}</p>
                                                {/* Display the extracted text snippet if available */}
                                                {item.extracted_text_snippet && (
                                                    <p className="italic text-gray-700 bg-white p-2 rounded-md border">
                                                        "{item.extracted_text_snippet}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Message if no issues found after analysis */}
                            {results.issues.length === 0 && !analyzing && (
                                <div className="text-center text-gray-600 italic">
                                    No compliance issues found in the document.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default ComplianceChecker;