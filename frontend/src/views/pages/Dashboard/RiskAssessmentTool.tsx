// src/views/pages/RiskAssessmentTool.tsx

import React, { useState } from "react";
import {
  FaShieldAlt,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  analyzeRiskFile,
  RiskAnalysisResponse,
  RiskItemBackend,
} from "../../../api";

type Severity = "high" | "medium" | "low";

interface RiskItem {
  id: number;
  section: string;
  clause: string;
  issue: string;
  risk: Severity;
  recommendation: string;
}

const SHADOW = "0 12px 20px -5px rgba(0,0,0,.08)";

const RiskLevel: React.FC<{ level: Severity }> = ({ level }) => {
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

const RiskAssessmentTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("all");
  const [results, setResults] = useState<{
    id: string;
    riskItems: RiskItem[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    try {
      const resp: RiskAnalysisResponse = await analyzeRiskFile(file);
      const raw = Array.isArray(resp.risks) ? resp.risks : [];
      const mapped: RiskItem[] = raw.map((r: RiskItemBackend, idx: number) => ({
        id: idx + 1,
        section: r.section,
        clause: (r as any).clause ?? r.section,
        issue: r.risk_description,
        risk: (r.severity || "Low").toLowerCase() as Severity,
        recommendation: r.recommendation ?? "No recommendation provided.",
      }));
      setResults({ id: resp.id, riskItems: mapped });
      setActiveSection("all");
    } catch (err: any) {
      console.error("Risk analysis failed:", err);
      setError(`Risk analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setActiveSection("all");
    setError(null);
  };

  const downloadReport = () => {
    if (!results) return;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFontSize(18);
    doc.text("Risk Assessment Report", 40, 50);
    autoTable(doc, {
      startY: 80,
      head: [["ID", "Section", "Clause", "Issue", "Risk", "Recommendation"]],
      body: results.riskItems.map((i) => [
        i.id.toString(),
        i.section,
        i.clause,
        i.issue,
        i.risk[0].toUpperCase() + i.risk.slice(1),
        i.recommendation,
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [193, 120, 41] },
    });
    doc.save("risk_report.pdf");
  };

  const filteredItems = results
    ? results.riskItems.filter(
        (i) =>
          activeSection === "all" ||
          i.section.toLowerCase() === activeSection.toLowerCase()
      )
    : [];

  const sections = results
    ? ["all", ...Array.from(new Set(results.riskItems.map((i) => i.section)))]
    : [];

  const counts: Record<Severity, number> = results
    ? results.riskItems.reduce(
        (acc, i) => {
          acc[i.risk] = (acc[i.risk] || 0) + 1;
          return acc;
        },
        { high: 0, medium: 0, low: 0 }
      )
    : { high: 0, medium: 0, low: 0 };

  const tap = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[rgb(193,120,41)] to-[var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[var(--accent-light)] p-3 text-[rgb(193,120,41)]">
            <FaShieldAlt size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--brand-dark)]">
              Risk Assessment Tool
            </h1>
            <p className="text-gray-600">
              Identify potential legal issues in your documents
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-xl border bg-white shadow-sm">
        {!results ? (
          <div className="p-8">
            <div
              className="
                flex cursor-pointer flex-col items-center justify-center gap-2
                rounded-lg border-2 border-dashed border-gray-300
                p-10 text-center transition-colors
                hover:border-[rgb(193,120,41)]
              "
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
                accept=".pdf,.docx"
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
                  <FaFileAlt className="mx-auto text-4xl text-[rgb(193,120,41)]" />
                  <p className="mt-3 font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={reset}
                      className="flex items-center justify-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      <FaTrash /> Remove
                    </button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        analyze();
                      }}
                      {...tap}
                      className="flex items-center justify-center gap-1 rounded-md bg-[rgb(193,120,41)] px-4 py-2 text-sm text-white hover:bg-[rgb(173,108,37)]"
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
                    PDF, DOCX only (≤10 MB)
                  </p>
                </>
              )}
              {isAnalyzing && (
                <div className="mt-8 text-center text-gray-700">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[rgb(193,120,41)]" />
                  <p className="mt-3">Analyzing your document…</p>
                </div>
              )}
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <FaFileAlt className="text-2xl text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-800">{file?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file?.size ?? 0 / 1024 / 1024).toFixed(2)} MB •{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <motion.button
                  onClick={reset}
                  {...tap}
                  className="min-w-[140px] flex justify-center rounded-md bg-[rgb(193,120,41)] px-4 py-2 text-sm text-white hover:bg-[rgb(173,108,37)]"
                >
                  Analyze Another
                </motion.button>
                <motion.button
                  onClick={downloadReport}
                  {...tap}
                  className="min-w-[140px] flex justify-center rounded-md bg-[rgb(193,120,41)] px-4 py-2 text-sm text-white hover:bg-[rgb(173,108,37)]"
                >
                  <FaDownload className="mr-1" /> Download Report
                </motion.button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
              {Object.entries(counts).map(([lvl, count]) => (
                <div
                  key={lvl}
                  className="rounded-lg border bg-gray-50 p-4 text-center"
                  style={{ boxShadow: SHADOW }}
                >
                  <p className="text-sm text-gray-500 mb-1">
                    {lvl[0].toUpperCase() + lvl.slice(1)} Risk Items
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto px-6">
              <div className="flex flex-wrap gap-2 border-b pb-2">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`whitespace-nowrap rounded-md px-3 py-1 text-sm transition-colors ${
                      activeSection === sec
                        ? "bg-[rgb(193,120,41)] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {sec === "all" ? "All Sections" : sec}
                  </button>
                ))}
              </div>
            </div>
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
                    <div className="flex flex-col md:flex-row gap-2 rounded-md border border-[rgb(193,120,41)] bg-[rgb(193,120,41)]/10 p-3 text-sm">
                      <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(193,120,41)] text-white">
                        <FaInfoCircle size={14} />
                      </span>
                      <span className="text-[rgb(193,120,41)]">
                        {item.recommendation}
                      </span>
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
