import React, { useState } from "react";
import {
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   BRAND TOKENS
   ────────────────────────────────────────────────────────────── */
const BRAND = { dark: "var(--brand-dark)" } as const;
const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };
const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

/* ──────────────────────────────────────────────────────────────
   Helper components
   ────────────────────────────────────────────────────────────── */
const RiskLevel = ({ level }: { level: "high" | "medium" | "low" }) => {
  const palette = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  } as const;
  return (
    <span
      className={`rounded border px-2 py-1 text-xs font-medium ${palette[level]}`}
    >
      {level[0].toUpperCase() + level.slice(1)} Risk
    </span>
  );
};

/* ──────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────── */
const RiskAssessmentTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [results, setResults] = useState<ReturnType<
    typeof mockAnalysis
  > | null>(null);

  /* ——— fake API ——— */
  function mockAnalysis() {
    return {
      overallRisk: "medium" as const,
      score: 65,
      riskItems: [
        {
          id: 1,
          section: "Liability",
          clause: "§8.2",
          issue: "Unlimited liability may be unenforceable.",
          risk: "high" as const,
          recommendation: "Add jurisdiction‑specific limitations.",
        },
        {
          id: 2,
          section: "Termination",
          clause: "§12.4",
          issue: "Ambiguous termination notice.",
          risk: "medium" as const,
          recommendation: "Specify exact notice period.",
        },
        {
          id: 3,
          section: "Privacy",
          clause: "§6.1",
          issue: "No secure deletion policy.",
          risk: "medium" as const,
          recommendation: "Add secure deletion requirements.",
        },
        {
          id: 4,
          section: "IP",
          clause: "§4.3",
          issue: "Derivative‑work ownership unclear.",
          risk: "high" as const,
          recommendation: "Define ownership of modifications.",
        },
        {
          id: 5,
          section: "Payments",
          clause: "§3.5",
          issue: "Rate change with minimal notice.",
          risk: "low" as const,
          recommendation: "Extend notice period.",
        },
        {
          id: 6,
          section: "General",
          clause: "§14.7",
          issue: "Governing law lacks venue.",
          risk: "low" as const,
          recommendation: "Add specific venue.",
        },
      ],
    };
  }

  const analyze = () => {
    if (!file) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setResults(mockAnalysis());
      setIsAnalyzing(false);
    }, 1800);
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setActiveSection("all");
  };

  /* ——— utils ——— */
  const filteredItems =
    results?.riskItems.filter(
      (i) =>
        activeSection === "all" ||
        i.section.toLowerCase() === activeSection.toLowerCase()
    ) ?? [];
  const sections = results
    ? ["all", ...Array.from(new Set(results.riskItems.map((i) => i.section)))]
    : [];
  const counts = results?.riskItems.reduce(
    (acc: Record<string, number>, i) => {
      acc[i.risk] = (acc[i.risk] || 0) + 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  ) ?? { high: 0, medium: 0, low: 0 };

  /* ——— animations ——— */
  const tap = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  return (
    <div className="space-y-8">
      {/* header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
            <FaShieldAlt size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[color:var(--brand-dark)]">
              Risk Assessment Tool
            </h1>
            <p className="text-gray-600">
              Identify potential legal issues in your documents
            </p>
          </div>
        </div>
      </header>

      {/* content card */}
      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <div className="p-8">
            {/* uploader */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-10 text-center hover:border-[color:var(--accent-dark)]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  setFile(f);
                  setResults(null);
                }
              }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setResults(null);
                  }
                }}
              />

              {file ? (
                <div>
                  <FaFileAlt className="mx-auto text-4xl text-[color:var(--accent-dark)]" />
                  <p className="mt-3 font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={reset}
                      className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                    >
                      Remove
                    </button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        analyze();
                      }}
                      className="flex items-center gap-1 rounded-md bg-[color:var(--accent-dark)] px-4 py-1 text-sm text-white hover:bg-[color:var(--accent-dark)]/90"
                      {...tap}
                    >
                      <FaSearch /> Analyze
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-5xl text-gray-400" />
                  <p className="mt-4 text-gray-700">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, DOC(X), TXT • ≤10 MB
                  </p>
                </>
              )}
            </div>

            {isAnalyzing && (
              <div className="mt-8 text-center text-gray-700">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--accent-dark)]" />
                <p className="mt-3">Analyzing your document…</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* summary */}
            <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <FaFileAlt className="text-2xl text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-800">{file?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {file ? (file.size / 1024 / 1024).toFixed(2) : "0"} MB •{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Overall Risk</p>
                  <RiskLevel level={results.overallRisk} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Score</p>
                  <span className="text-lg font-bold text-gray-800">
                    {results.score}/100
                  </span>
                </div>
                <motion.button
                  onClick={reset}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  {...tap}
                >
                  Analyze Another
                </motion.button>
              </div>
            </div>

            {/* counters */}
            <div className="grid gap-4 p-6 md:grid-cols-3">
              {Object.entries(counts).map(([lvl, count]) => (
                <div
                  key={lvl}
                  className="rounded-lg border bg-gray-50 p-4 text-center"
                >
                  <p className="text-sm text-gray-500 mb-1">
                    {lvl[0].toUpperCase() + lvl.slice(1)} Risk Items
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                </div>
              ))}
            </div>

            {/* filter tabs */}
            <div className="overflow-x-auto px-6">
              <div className="flex gap-2 border-b pb-2">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`whitespace-nowrap rounded-md px-3 py-1 text-sm transition-colors ${
                      activeSection === sec
                        ? "bg-[color:var(--accent-dark)] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {sec === "all" ? "All Sections" : sec}
                  </button>
                ))}
              </div>
            </div>

            {/* list */}
            <div className="space-y-4 p-6">
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.section}: {item.clause}
                        </p>
                        <p className="text-sm text-gray-600">{item.issue}</p>
                      </div>
                      <RiskLevel level={item.risk} />
                    </div>
                    <div className="flex gap-2 rounded-md border border-[color:var(--accent-light)] bg-[color:var(--accent-light)]/50 p-3 text-sm text-[color:var(--accent-dark)]">
                      <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                      <span>{item.recommendation}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <FaExclamationTriangle className="mx-auto mb-2 text-3xl text-gray-300" />
                  No items for this filter.
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default RiskAssessmentTool;
