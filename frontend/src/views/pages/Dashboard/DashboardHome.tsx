// src/views/pages/Dashboard/DashboardHome.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaFileAlt,
  FaClipboardCheck,
  FaShieldAlt,
  FaUsersCog,
  FaLanguage,
  FaRobot,
  FaArrowRight,
} from "react-icons/fa";
import Banner from "../../components/common/Banner";
import ToolList, { ToolCard } from "../../components/common/toolList";

// ────────── Data for Recent Activity ──────────
const activity = [
  ["Document analysed", "Contract_2023_Q1.pdf", "2 h ago"],
  ["Compliance check", "Terms_of_Service_v3.docx", "5 h ago"],
  ["Risk assessment", "Partnership_Agreement.pdf", "Yesterday"],
  ["Doc translated", "International_Agreement.docx", "2 d ago"],
];

// This was missing—now included!
const activityIcons = [
  FaFileAlt,
  FaClipboardCheck,
  FaShieldAlt,
  FaLanguage,
] as const;

// ────────── Stats Cards Data ──────────
const stats = [
  {
    title: "Analyzed Documents",
    value: 158,
    icon: FaFileAlt,
    accent: { dark: "var(--accent-dark)", light: "var(--accent-light)" },
    change: "+12% this month",
  },
  {
    title: "Compliance Checks",
    value: 64,
    icon: FaClipboardCheck,
    accent: { dark: "#2563eb", light: "#3b82f6" },
    change: "+8% this month",
  },
  {
    title: "Risk Assessments",
    value: 42,
    icon: FaShieldAlt,
    accent: { dark: "#dc2626", light: "#ef4444" },
    change: "+15% this month",
  },
  {
    title: "Active Users",
    value: 12,
    icon: FaUsersCog,
    accent: { dark: "var(--brand-dark)", light: "var(--brand-dark)" },
    change: "+3 since last week",
  },
];

// ────────── Tools Cards Data ──────────
const tools: ToolCard[] = [
  {
    icon: FaRobot,
    title: "Chatbot Assistant",
    desc: "Instant answers for document-prep questions.",
    link: "/dashboard/chatbot",
  },
  {
    icon: FaFileAlt,
    title: "Rephrasing Tool",
    desc: "Improve clarity and precision with AI-powered suggestions.",
    link: "/dashboard/rephrasing",
  },
  {
    icon: FaShieldAlt,
    title: "Risk Assessment Tool",
    desc: "Spot legal pitfalls before they become problems.",
    link: "/dashboard/risk-assessment",
  },
  {
    icon: FaClipboardCheck,
    title: "Compliance Checker",
    desc: "Verify documents meet regulations & standards.",
    link: "/dashboard/compliance",
  },
  {
    icon: FaLanguage,
    title: "Translation Tool",
    desc: "Translate legal docs while keeping technical accuracy.",
    link: "/dashboard/translation",
  },
];

const DashboardHome: React.FC = () => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8">
      {/* Hero Banner */}
      <Banner />

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {stats.map((s, idx) => (
          <motion.div
            key={idx}
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0 },
            }}
            whileHover={{
              y: -6,
              boxShadow: "0 12px 20px -5px rgba(0,0,0,.08)",
            }}
            className="rounded-xl border bg-white shadow-sm flex flex-col"
          >
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p
                  className="font-medium text-sm"
                  style={{ color: s.accent.dark }}
                >
                  {s.title}
                </p>
                <span
                  className="rounded-full p-2"
                  style={{
                    backgroundColor: `${s.accent.light}33`,
                    color: s.accent.dark,
                  }}
                >
                  <s.icon size={20} />
                </span>
              </div>
              <div>
                <h2 className="mt-4 text-3xl font-bold text-gray-800">
                  {s.value}
                </h2>
                <p className="text-xs text-green-600 mt-1">{s.change}</p>
              </div>
            </div>
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(to right, ${s.accent.dark}, ${s.accent.light})`,
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Tools Section */}
      <ToolList tools={tools} hoverIdx={hoverIdx} setHoverIdx={setHoverIdx} />

      {/* Recent Activity */}
      <motion.div
        className="rounded-xl border bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="font-serif text-2xl font-semibold text-[color:var(--brand-dark)]">
            Recent Activity
          </h2>
          <span className="mt-2 sm:mt-0 px-3 py-1 text-xs font-medium rounded-full bg-[color:var(--accent-light)] text-[color:var(--accent-dark)]">
            Today
          </span>
        </div>

        <div className="space-y-4">
          {activity.map(([act, file, when], i) => {
            const Icon = activityIcons[i % activityIcons.length];
            const even = i % 2 === 0;
            return (
              <motion.div
                key={i}
                className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: even
                        ? "rgba(193,120,41,0.1)"
                        : "rgba(44,44,74,0.1)",
                      color: even ? "var(--accent-dark)" : "var(--brand-dark)",
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{act}</p>
                    <p className="text-xs text-gray-500">{file}</p>
                  </div>
                </div>
                <span className="mt-2 sm:mt-0 px-2 py-1 text-xs text-gray-400 rounded-full bg-gray-100">
                  {when}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[color:var(--accent-light)] text-[color:var(--accent-dark)] hover:bg-[color:var(--accent-dark)] hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View all activity <FaArrowRight />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
