import React, { useState } from "react";
import {
  FaClipboardCheck,
  FaGlobe,
  FaBuilding,
  FaUpload,
  FaFileAlt,
  FaTrash,
  FaCheck,
  FaTimes,
  FaExclamationCircle,
  FaInfoCircle,
  FaFilePdf,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";

// Compliance status components with different colors
const ComplianceStatus = ({
  status,
}: {
  status: "compliant" | "non-compliant" | "warning";
}) => {
  const colors = {
    compliant: "bg-green-100 text-green-800 border-green-200",
    "non-compliant": "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const icons = {
    compliant: <FaCheck className="mr-1" />,
    "non-compliant": <FaTimes className="mr-1" />,
    warning: <FaExclamationCircle className="mr-1" />,
  };

  const labels = {
    compliant: "Compliant",
    "non-compliant": "Non-Compliant",
    warning: "Warning",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded border flex items-center ${colors[status]}`}
    >
      {icons[status]}
      {labels[status]}
    </span>
  );
};

const ComplianceChecker = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("US");
  const [selectedIndustry, setSelectedIndustry] = useState("General");

  // Mock jurisdictions and industries
  const jurisdictions = ["US", "EU", "UK", "Canada", "Australia"];
  const industries = [
    "General",
    "Healthcare",
    "Finance",
    "Technology",
    "Retail",
  ];

  // Mock analysis results
  const mockResults = {
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
          "Privacy policy does not fully address all required disclosures.",
        recommendation:
          "Add details on data retention periods and the right to data portability.",
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
        description: "Missing required disclosures about consumer data rights.",
        recommendation:
          "Add a specific section on consumer rights to access and delete personal information.",
      },
      {
        id: 4,
        name: "Accessibility",
        status: "warning",
        regulationCode: "ADA Title III",
        description:
          "Website terms may not adequately address accessibility requirements.",
        recommendation:
          "Include a statement on accessibility commitment and available accommodations.",
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

  // Count compliance issues by status
  const getStatusCounts = () => {
    if (!results) return { compliant: 0, "non-compliant": 0, warning: 0 };

    return results.regulations.reduce(
      (acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { compliant: 0, "non-compliant": 0, warning: 0 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <FaClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Compliance Checker
            </h1>
            <p className="text-gray-600">
              Ensure your documents meet regulatory requirements
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {!results ? (
          <div className="p-6">
            {/* Jurisdiction and Industry Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Jurisdiction
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGlobe className="text-gray-400" />
                  </div>
                  <select
                    value={selectedJurisdiction}
                    onChange={(e) => setSelectedJurisdiction(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {jurisdictions.map((jurisdiction) => (
                      <option key={jurisdiction} value={jurisdiction}>
                        {jurisdiction}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Select the jurisdiction for compliance checking
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Industry
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-gray-400" />
                  </div>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Select your industry for specific regulations
                </p>
              </div>
            </div>

            {/* File Upload Section */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center
                        hover:border-green-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById("file-upload-compliance")?.click()
              }
            >
              <input
                id="file-upload-compliance"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />

              {file ? (
                <div className="text-center">
                  <FaFileAlt className="mx-auto text-4xl text-green-500 mb-3" />
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
                      className="px-4 py-1 bg-green-500 rounded-md text-white text-sm hover:bg-green-600 transition-colors flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaClipboardCheck className="mr-1 text-xs" /> Check
                      Compliance
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <FaUpload className="text-5xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Upload document for compliance check
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
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-3"></div>
                <p className="text-gray-700">
                  Checking document for compliance issues...
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
                      {selectedJurisdiction} • {selectedIndustry} • Checked{" "}
                      {new Date(results.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status:</p>
                    <ComplianceStatus status={results.overallStatus} />
                  </div>

                  <div className="h-10 border-l border-gray-300"></div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Compliance Score:
                    </p>
                    <div className="text-lg font-bold text-gray-800">
                      {results.complianceScore}/100
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors text-sm flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaFilePdf className="mr-1" /> Report
                    </motion.button>

                    <motion.button
                      onClick={handleReset}
                      className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Check Another
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Summary */}
            <div className="p-6">
              {/* Status Counts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(getStatusCounts()).map(([status, count]) => {
                  const colors: Record<string, string> = {
                    compliant: "text-green-600",
                    "non-compliant": "text-red-600",
                    warning: "text-yellow-600",
                  };

                  return (
                    <div
                      key={status}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        {status === "compliant"
                          ? "Compliant"
                          : status === "non-compliant"
                          ? "Non-Compliant"
                          : "Warning"}
                        :
                      </p>
                      <p className={`text-2xl font-bold ${colors[status]}`}>
                        {count as number}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Compliance Items List */}
              <div className="space-y-4">
                {results.regulations.map((item: any) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-gray-800 mr-2">
                            {item.name}
                          </p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {item.regulationCode}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <ComplianceStatus status={item.status} />
                    </div>

                    {item.status !== "compliant" && (
                      <div className="bg-green-50 p-3 rounded-md border border-green-100 flex items-start space-x-2">
                        <FaInfoCircle className="text-green-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-green-700">
                          {item.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      {!results && (
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            Compliance Tips
          </h3>
          <ul className="space-y-2 text-green-700">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>
                Select the correct jurisdiction for your target market.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>
                Regular compliance checks help prevent legal issues before they
                arise.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>
                Update your documents whenever relevant regulations change.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span>
                Non-compliant items should be addressed immediately with legal
                counsel.
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplianceChecker;
