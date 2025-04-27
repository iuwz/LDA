// src/views/pages/Dashboard/Settings.tsx

import React, { useState, useEffect } from "react";
import { FaCog, FaSave, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
];

const TFA_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const Settings: React.FC = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [tfaMethod, setTfaMethod] = useState("email");
  const [language, setLanguage] = useState("en");
  const [popupsEnabled, setPopupsEnabled] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const showToast = (message: string) => {
    setToastMessage(message);
    setCountdown(5);
  };

  // Trigger toast when 2FA toggles or method changes
  useEffect(() => {
    if (twoFactor) {
      const channel = tfaMethod === "email" ? "email" : "phone";
      showToast(`Code sent via ${channel}`);
    }
  }, [twoFactor, tfaMethod]);

  // Auto-hide toast with countdown
  useEffect(() => {
    if (!toastMessage) return;
    if (countdown <= 0) {
      setToastMessage(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [toastMessage, countdown]);

  const handleSave = () => {
    showToast("Applying settings...");
    // Simulate API save
    setTimeout(() => showToast("Settings applied."), 1000);
  };

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
            <FaCog size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[color:var(--brand-dark)]">
              Settings
            </h1>
            <p className="text-gray-600">
              Configure your dashboard preferences
            </p>
          </div>
        </div>
      </header>

      {/* Settings Section */}
      <section className="rounded-xl border bg-white shadow-sm p-6 space-y-6">
        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">
              Two-Factor Authentication
            </p>
            <p className="text-sm text-gray-600">
              Enable or disable 2FA on login
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={twoFactor}
                onChange={() => setTwoFactor((prev) => !prev)}
              />
              <div className="w-14 h-7 bg-gray-200 rounded-full peer-checked:bg-[color:var(--accent-dark)] transition-colors" />
              <div className="absolute top-0 left-0 w-7 h-7 bg-white border border-gray-300 rounded-full shadow peer-checked:translate-x-7 transition-transform" />
            </div>
          </label>
        </div>

        {/* 2FA Method Dropdown */}
        {twoFactor && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">2FA Method</p>
              <p className="text-sm text-gray-600">
                Select method for two-factor codes
              </p>
            </div>
            <select
              value={tfaMethod}
              onChange={(e) => setTfaMethod(e.target.value)}
              className="rounded-md border border-gray-300 p-2 focus:border-[color:var(--accent-dark)] focus:ring-1 focus:ring-[color:var(--accent-dark)] outline-none"
            >
              {TFA_METHODS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Language Selection */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Language</p>
            <p className="text-sm text-gray-600">Choose default UI language</p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-gray-300 p-2 focus:border-[color:var(--accent-dark)] focus:ring-1 focus:ring-[color:var(--accent-dark)] outline-none"
          >
            {LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Pop-up Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Pop-Up Notifications</p>
            <p className="text-sm text-gray-600">
              Enable pop-up messages for new items
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={popupsEnabled}
                onChange={() => setPopupsEnabled((prev) => !prev)}
              />
              <div className="w-14 h-7 bg-gray-200 rounded-full peer-checked:bg-[color:var(--accent-dark)] transition-colors" />
              <div className="absolute top-0 left-0 w-7 h-7 bg-white border border-gray-300 rounded-full shadow peer-checked:translate-x-7 transition-transform" />
            </div>
          </label>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSave /> Save Settings
        </motion.button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-xs bg-white border-l-4 border-green-500 shadow-lg p-4 flex items-center space-x-3 rounded">
          <FaCheck className="text-green-500 text-xl" />
          <div className="flex-1">
            <p className="font-medium text-gray-800">{toastMessage}</p>
            <p className="mt-1 text-xs text-gray-500">
              Clearing in {countdown}...
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
