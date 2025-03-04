import React, { useState } from "react";
import {
  FaFileUpload,
  FaShieldAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCloudUploadAlt,
  FaFileAlt,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
import { motion } from "framer-motion";

// Risk level components with different colors
const RiskLevel = ({ level }: { level: "high" | "medium" | "low" }) => {
  const colors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded border ${colors[level]}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
};

const RiskAssessmentTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("all");

  // Mock analysis results
  const mockResults = {
    overallRisk: "medium" as "high" | "medium" | "low",
    score: 65,
    riskItems: [
      {
        id: 1,
        section: "Liability",
        clause: "Section 8.2",
        issue:
          "Unlimited liability clause may be unenforceable in some jurisdictions.",
        risk: "high" as "high" | "medium" | "low",
        recommendation:
          "Add jurisdiction-specific limitations or consult local counsel.",
      },
      {
        id: 2,
        section: "Termination",
        clause: "Section 12.4",
        issue: "Ambiguous termination notice period.",
        risk: "medium" as "high" | "medium" | "low",
        recommendation:
          "Specify exact notice period in business days or calendar days.",
      },
      {
        id: 3,
        section: "Privacy",
        clause: "Section 6.1",
        issue:
          "Data retention policy does not specify secure deletion methods.",
        risk: "medium" as "high" | "medium" | "low",
        recommendation:
          "Add specific secure deletion requirements and timeframes.",
      },
      {
        id: 4,
        section: "Intellectual Property",
        clause: "Section 4.3",
        issue: "IP ownership for derivative works is not clearly defined.",
        risk: "high" as "high" | "medium" | "low",
        recommendation:
          "Clearly define ownership for modifications and derivative works.",
      },
      {
        id: 5,
        section: "Payments",
        clause: "Section 3.5",
        issue: "Payment terms allow for rate changes with minimal notice.",
        risk: "low" as "high" | "medium" | "low",
        recommendation: "Consider extending notice period for rate changes.",
      },
      {
        id: 6,
        section: "General",
        clause: "Section 14.7",
        issue: "Governing law provision lacks venue specification.",
        risk: "low" as "high" | "medium" | "low",
        recommendation: "Add specific venue for dispute resolution.",
      },
    ],
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null); // Clear previous results
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setResults(null); // Clear previous results
    }
  };

  const handleAnalyze = () => {
    if (!file) return;

    setIsAnalyzing(true);

    // Simulate API call delay
    setTimeout(() => {
      setResults(mockResults);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
  };

  // Get filtered risk items based on active section
  const getFilteredRiskItems = () => {
    if (!results) return [];

    if (activeSection === "all") {
      return results.riskItems;
    } else {
      return results.riskItems.filter(
        (item: any) =>
          item.section.toLowerCase() === activeSection.toLowerCase()
      );
    }
  };

  // Get all unique sections for the filter
  const getSections = (): string[] => {
    if (!results) return [];

    const sections = results.riskItems.map(
      (item: any) => item.section as string
    );
    const uniqueSections = Array.from(new Set(sections));
    return ["all", ...uniqueSections];
  };

  // Get count of risks by level
  const getRiskCounts = () => {
    if (!results) return { high: 0, medium: 0, low: 0 };

    return results.riskItems.reduce(
      (acc: any, item: any) => {
        acc[item.risk] = (acc[item.risk] || 0) + 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-amber-100 text-amber-600">
            <FaShieldAlt size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Risk Assessment Tool
            </h1>
            <p className="text-gray-600">
              Identify potential legal issues in your documents
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {!results ? (
          <div className="p-8">
            {/* File Upload Section */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center
                        hover:border-amber-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />

              {file ? (
                <div className="text-center">
                  <FaFileAlt className="mx-auto text-4xl text-amber-500 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">{file.name}</p>
                  <p className="text-gray-500 text-sm mb-4">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="px-3 py-1 bg-gray-200 rounded-md text-gray-700 text-sm hover:bg-gray-300 transition-colors flex items-center"
                    >
                      <FaTrash className="mr-1 text-xs" /> Remove
                    </button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyze();
                      }}
                      className="px-4 py-1 bg-amber-500 rounded-md text-white text-sm hover:bg-amber-600 transition-colors flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaSearch className="mr-1 text-xs" /> Analyze
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-5xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Upload document for analysis
                  </h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
                  </p>
                </>
              )}
            </div>

            {isAnalyzing && (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-3"></div>
                <p className="text-gray-700">
                  Analyzing your document for potential risks...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Results Header with Summary */}
            <div className="bg-gray-50 p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <FaFileAlt className="text-2xl text-gray-500" />
                  <div>
                    <h3 className="font-medium text-gray-800">{file?.name}</h3>
                    <p className="text-sm text-gray-500">
                      {file?.size ? (file.size / 1024 / 1024).toFixed(2) : "0"}{" "}
                      MB • Analyzed {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Overall Risk:</p>
                    <RiskLevel
                      level={results.overallRisk as "high" | "medium" | "low"}
                    />
                  </div>

                  <div className="h-10 border-l border-gray-300"></div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Risk Score:</p>
                    <div className="text-lg font-bold text-gray-800">
                      {results.score}/100
                    </div>
                  </div>

                  <motion.button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Analyze Another
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Risk Items */}
            <div className="p-6">
              {/* Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(getRiskCounts()).map(([level, count]) => (
                  <div
                    key={level}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <p className="text-sm text-gray-500 mb-1">
                      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
                      Items:
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {count as number}
                    </p>
                  </div>
                ))}
              </div>

              {/* Filter Tabs */}
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 border-b border-gray-200 pb-2">
                  {getSections().map((section: string) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`px-3 py-1 text-sm rounded-md whitespace-nowrap ${
                        activeSection === section
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {section === "all" ? "All Sections" : section}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Items List */}
              <div className="space-y-4">
                {getFilteredRiskItems().map((item: any) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.section}: {item.clause}
                        </p>
                        <p className="text-sm text-gray-600">{item.issue}</p>
                      </div>
                      <RiskLevel
                        level={item.risk as "high" | "medium" | "low"}
                      />
                    </div>
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex items-start space-x-2">
                      <FaInfoCircle className="text-amber-500 mt-1 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}

                {getFilteredRiskItems().length === 0 && (
                  <div className="text-center py-8">
                    <FaExclamationTriangle className="mx-auto text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No risk items found for this filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      {!results && (
        <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">
            Risk Assessment Tips
          </h3>
          <ul className="space-y-2 text-amber-700">
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>
                Upload complete documents for the most accurate risk assessment.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>
                Review highlighted high-risk items first, as they may have the
                most significant legal impact.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>
                Follow the specific recommendations to mitigate identified
                risks.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>
                Consider consulting with legal counsel for high-risk documents
                before finalizing.
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentTool;
