import React, { useState } from "react";
import {
  FaLanguage,
  FaExchangeAlt,
  FaCopy,
  FaCheck,
  FaFileUpload,
  FaFileAlt,
  FaGlobe,
  FaInfoCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";

const TranslationTool = () => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLegalTermsOn, setIsLegalTermsOn] = useState(true);

  // Sample language options
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "zh", name: "Chinese" },
    { code: "ru", name: "Russian" },
    { code: "ar", name: "Arabic" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" },
  ];

  // Mock function to simulate translation
  const translate = (text: string, from: string, to: string) => {
    setIsTranslating(true);

    // Simulate API call delay
    setTimeout(() => {
      let result = "";

      // Mock translations for demo purposes
      if (from === "en" && to === "es") {
        if (isLegalTermsOn) {
          result =
            "La parte cumplirá con todas las leyes y regulaciones aplicables. El incumplimiento constituirá un incumplimiento sustancial según este acuerdo. Cualquier disputa se resolverá mediante arbitraje vinculante en la jurisdicción acordada.";
        } else {
          result =
            "La parte cumplirá con todas las leyes. El incumplimiento romperá este acuerdo. Las disputas irán a arbitraje.";
        }
      } else if (from === "en" && to === "fr") {
        if (isLegalTermsOn) {
          result =
            "La partie se conformera à toutes les lois et réglementations applicables. Le non-respect constituera une violation substantielle en vertu de cet accord. Tout litige sera résolu par arbitrage contraignant dans la juridiction convenue.";
        } else {
          result =
            "La partie respectera toutes les lois. Le non-respect rompra cet accord. Les litiges iront à l'arbitrage.";
        }
      } else {
        // Generic placeholder for other language combinations
        result = "TRANSLATED TEXT: " + text + " [" + from + " → " + to + "]";
      }

      setTranslatedText(result);
      setIsTranslating(false);
    }, 1500);
  };

  const handleTranslate = () => {
    if (sourceText.trim()) {
      translate(sourceText, sourceLanguage, targetLanguage);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwapLanguages = () => {
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText("");
    }

    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // For demo, we'll just use a mock text
      setSourceText(
        "The party will comply with all applicable laws and regulations. Failure to comply will constitute a material breach under this agreement. Any disputes shall be resolved through binding arbitration in the agreed jurisdiction."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <FaLanguage size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Translation Tool
            </h1>
            <p className="text-gray-600">
              Translate legal documents while maintaining technical accuracy
            </p>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Language
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaGlobe className="text-gray-400" />
              </div>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {languages.map((lang) => (
                  <option key={`source-${lang.code}`} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            onClick={handleSwapLanguages}
            className="flex-shrink-0 p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <FaExchangeAlt />
          </motion.button>

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Language
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaGlobe className="text-gray-400" />
              </div>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {languages.map((lang) => (
                  <option key={`target-${lang.code}`} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full md:w-auto mt-4 md:mt-0">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isLegalTermsOn}
                onChange={() => setIsLegalTermsOn(!isLegalTermsOn)}
                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                Preserve legal terminology
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* File Upload Option */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Upload Document
          </h2>
          <input
            id="file-upload-translation"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
          />
          <label
            htmlFor="file-upload-translation"
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <FaFileUpload className="mr-2" />
            <span>Choose File</span>
          </label>
        </div>

        {file && (
          <div className="flex items-center p-3 bg-gray-50 rounded-md">
            <FaFileAlt className="text-gray-500 mr-2" />
            <span className="text-gray-700">{file.name}</span>
            <span className="ml-2 text-xs text-gray-500">
              ({Math.round(file.size / 1024)} KB)
            </span>
          </div>
        )}
      </div>

      {/* Main Translation Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Source Text Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Source Text
            </h2>
            <textarea
              className="w-full h-60 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder={`Enter text to translate from ${
                languages.find((l) => l.code === sourceLanguage)?.name
              } to ${
                languages.find((l) => l.code === targetLanguage)?.name
              }...`}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            ></textarea>
          </div>

          {/* Translated Text Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Translated Text
              </h2>
              {translatedText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800"
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              )}
            </div>
            <div className="h-60 p-4 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto">
              {isTranslating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                translatedText || (
                  <p className="text-gray-400 italic">
                    Translated text will appear here...
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex justify-end">
            <motion.button
              onClick={handleTranslate}
              disabled={!sourceText.trim() || isTranslating}
              className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-md text-white transition-colors ${
                !sourceText.trim() || isTranslating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
              whileHover={{
                scale: sourceText.trim() && !isTranslating ? 1.05 : 1,
              }}
              whileTap={{
                scale: sourceText.trim() && !isTranslating ? 0.95 : 1,
              }}
            >
              {isTranslating ? (
                <FaSyncAlt className="animate-spin" />
              ) : (
                <FaLanguage />
              )}
              <span>Translate</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">
          Translation Tips
        </h3>
        <ul className="space-y-2 text-purple-700">
          <li className="flex items-start space-x-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>
              Enable "Preserve legal terminology" to maintain accurate technical
              language.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>
              Review translated contracts with a legal professional familiar
              with the target language.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>
              Consider providing context for ambiguous terms to improve
              translation accuracy.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>
              For official documents, always have translations certified when
              required by regulations.
            </span>
          </li>
        </ul>
      </div>

      {/* Legal Notice */}
      <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <FaInfoCircle className="text-yellow-500 mt-1 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-yellow-800">Important Notice</h4>
          <p className="text-sm text-yellow-700">
            Machine translations are provided for informational purposes only
            and should not be relied upon for legal execution without
            professional review.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranslationTool;
