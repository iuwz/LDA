import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEdit, FaExchangeAlt, FaCheck, FaCopy } from "react-icons/fa";

const RephrasingTool = () => {
  const [originalText, setOriginalText] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("formal");
  const [copied, setCopied] = useState(false);

  // Mock function to simulate rephrasing with different styles
  const rephrase = (text: string, style: string) => {
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      let result = "";

      switch (style) {
        case "formal":
          result = `We hereby acknowledge receipt of your communication dated the 15th of March. 
          It is our understanding that you seek clarification regarding the aforementioned clause. 
          Please be advised that our legal team will provide a comprehensive response within the next business week.`;
          break;
        case "clear":
          result = `We received your email from March 15. 
          You asked about the meaning of clause 3.2. 
          Our legal team will respond with a detailed explanation within 5 business days.`;
          break;
        case "persuasive":
          result = `Thank you for bringing this important matter to our attention on March 15. 
          Your question about clause 3.2 raises a crucial point that deserves careful consideration. 
          Our specialized legal team is already reviewing this and will provide you with expert guidance within the week.`;
          break;
        case "concise":
          result = `Got your March 15 email. Our legal team will explain clause 3.2 by Friday.`;
          break;
        default:
          result = text;
      }

      setRephrasedText(result);
      setIsLoading(false);
    }, 1500);
  };

  const handleRephrase = () => {
    if (originalText.trim()) {
      rephrase(originalText, activeTab);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rephrasedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabOptions = [
    { id: "formal", label: "Formal" },
    { id: "clear", label: "Clear" },
    { id: "persuasive", label: "Persuasive" },
    { id: "concise", label: "Concise" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-blue-100 text-blue-500">
            <FaEdit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Rephrasing Tool
            </h1>
            <p className="text-gray-600">
              Enhance clarity and precision in your legal documents
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Original Text Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Original Text
            </h2>
            <textarea
              className="w-full h-60 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your legal text here for rephrasing..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
            ></textarea>
          </div>

          {/* Rephrased Text Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Rephrased Text
              </h2>
              {rephrasedText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              )}
            </div>
            <div className="h-60 p-4 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                rephrasedText || (
                  <p className="text-gray-400 italic">
                    Rephrased text will appear here...
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Style Selection and Action Button */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Select rephrasing style:
              </p>
              <div className="flex space-x-2">
                {tabOptions.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <motion.button
              onClick={handleRephrase}
              disabled={!originalText.trim() || isLoading}
              className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-md text-white transition-colors ${
                !originalText.trim() || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              whileHover={{
                scale: originalText.trim() && !isLoading ? 1.05 : 1,
              }}
              whileTap={{ scale: originalText.trim() && !isLoading ? 0.95 : 1 }}
            >
              <FaExchangeAlt />
              <span>Rephrase</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Rephrasing Tips
        </h3>
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              Use the <strong>Formal</strong> style for official communications
              and contracts.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              Use the <strong>Clear</strong> style when explaining complex legal
              concepts to clients.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              Use the <strong>Persuasive</strong> style for demand letters and
              negotiation documents.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              Use the <strong>Concise</strong> style for email communications
              and brief notes.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RephrasingTool;
