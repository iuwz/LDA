// ComplianceChecker.tsx

import React, { useState, ChangeEvent } from "react";
import {
  FaClipboardCheck,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
  FaFilePdf,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { motion } from "framer-motion";

/** ──────────────────────────────────────────────────────────────
 *  Data Types
 *  ────────────────────────────────────────────────────────────── */
type Status = "compliant" | "non-compliant" | "warning";
interface Regulation {
  id: number;
  name: string;
  status: Status;
  regulationCode: string;
  description: string;
  recommendation: string;
}
interface AnalysisResult {
  overallStatus: Status;
  complianceScore: number;
  lastUpdated: string;
  regulations: Regulation[];
}

/** ──────────────────────────────────────────────────────────────
 *  Brand Tokens
 *  ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

/** ──────────────────────────────────────────────────────────────
 *  Status Badge
 *  ────────────────────────────────────────────────────────────── */
const ComplianceStatus: React.FC<{ status: Status }> = ({ status }) => {
  const palette: Record<Status, string> = {
    compliant: "bg-green-100 text-green-800 border-green-200",
    "non-compliant": "bg-red-100   text-red-800   border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  const icons: Record<Status, React.ReactNode> = {
    compliant: <FaClipboardCheck className="mr-1" />,
    "non-compliant": <FaExclamationCircle className="mr-1" />,
    warning: <FaInfoCircle className="mr-1" />,
  };
  const labels: Record<Status, string> = {
    compliant: "Compliant",
    "non-compliant": "Non-Compliant",
    warning: "Warning",
  };

  return (
    <span
      className={`flex items-center px-2 py-1 text-xs font-medium rounded border ${palette[status]}`}
    >
      {icons[status]}
      {labels[status]}
    </span>
  );
};

/** ──────────────────────────────────────────────────────────────
 *  Main Component
 *  ────────────────────────────────────────────────────────────── */
const ComplianceChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // Fake API
  const mockResults = (): AnalysisResult => ({
    overallStatus: "warning",
    complianceScore: 76,
    lastUpdated: new Date().toISOString(),
    regulations: [
      {
        id: 1,
        name: "Data Protection",
        status: "warning",
        regulationCode: "GDPR Art. 13",
        description:
          "Privacy policy does not fully address required disclosures.",
        recommendation:
          "Add details on data retention periods and portability rights.",
      },
      {
        id: 2,
        name: "Terms of Service",
        status: "compliant",
        regulationCode: "UETA § 7",
        description:
          "Electronic signature provisions are properly implemented.",
        recommendation: "No action required.",
      },
      {
        id: 3,
        name: "Consumer Rights",
        status: "non-compliant",
        regulationCode: "CCPA § 1798.100",
        description: "Missing disclosures about consumer data rights.",
        recommendation: "Add section on data access and deletion rights.",
      },
      {
        id: 4,
        name: "Accessibility",
        status: "warning",
        regulationCode: "ADA Title III",
        description: "Terms may not address accessibility requirements.",
        recommendation: "Include an accessibility commitment statement.",
      },
      {
        id: 5,
        name: "Contract Formation",
        status: "compliant",
        regulationCode: "UCC § 2-204",
        description: "Contract formation elements are clearly defined.",
        recommendation: "No action required.",
      },
    ],
  });

  /* Handlers */
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) =>
    setFile(e.target.files?.[0] ?? null);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFile(e.dataTransfer.files?.[0] ?? null);
  };
  const analyze = () => {
    if (!file) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResults(mockResults());
      setAnalyzing(false);
    }, 2000);
  };
  const reset = () => {
    setFile(null);
    setResults(null);
  };

  /* Derived counts */
  const counts: Record<Status, number> = results
    ? results.regulations.reduce(
        (acc, { status }) => {
          acc[status]++;
          return acc;
        },
        { compliant: 0, "non-compliant": 0, warning: 0 }
      )
    : { compliant: 0, "non-compliant": 0, warning: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
            <FaClipboardCheck size={22} />
          </span>
          <div>
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
          <div className="p-8 space-y-6">
            {/* Upload area */}
            <div
              className="
                flex cursor-pointer flex-col items-center justify-center gap-2
                rounded-lg border-2 border-dashed border-gray-300
                p-10 text-center
                transition-colors
                hover:border-[color:var(--accent-dark)]
              "
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => document.getElementById("upload")?.click()}
            >
              <input
                id="upload"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={onFileChange}
              />
              {file ? (
                <>
                  <FaFileAlt className="text-5xl text-[color:var(--accent-dark)]" />
                  <p className="mt-2 font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={reset}
                      className="rounded-md bg-gray-200 px-4 py-1 text-gray-700 hover:bg-gray-300"
                    >
                      <FaTrash /> Remove
                    </button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        analyze();
                      }}
                      className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-5 py-1 text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSearch /> Analyze
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-5xl text-gray-400" />
                  <p className="mt-2 text-gray-700">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF or DOCX only (max 10 MB)
                  </p>
                </>
              )}
            </div>

            {analyzing && (
              <div className="mt-6 text-center text-gray-700">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
                <p className="mt-2">Analyzing document…</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <FaFilePdf className="text-2xl text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-800">{file?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Checked {new Date(results.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <ComplianceStatus status={results.overallStatus} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Score</p>
                  <p className="text-lg font-bold text-gray-800">
                    {results.complianceScore}/100
                  </p>
                </div>
                <motion.button
                  onClick={reset}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Analyze Another
                </motion.button>
              </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              {(Object.entries(counts) as [Status, number][]).map(
                ([lvl, num]) => (
                  <div
                    key={lvl}
                    className="rounded-lg border bg-gray-50 p-4 text-center"
                    style={{ boxShadow: SHADOW }}
                  >
                    <p className="text-sm text-gray-500 mb-1">
                      {lvl[0].toUpperCase() + lvl.slice(1)} Items
                    </p>
                    <p className="text-2xl font-bold text-gray-800">{num}</p>
                  </div>
                )
              )}
            </div>

            {/* Details */}
            <div className="space-y-4 p-6">
              {results.regulations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.name} —{" "}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {item.regulationCode}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <ComplianceStatus status={item.status} />
                  </div>
                  {item.status !== "compliant" && (
                    <div className="flex items-start gap-2 rounded-md bg-[color:var(--accent-light)]/50 p-3">
                      <FaInfoCircle className="text-[color:var(--accent-dark)] mt-1" />
                      <p className="text-[color:var(--accent-dark)] text-sm">
                        {item.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ComplianceChecker;
