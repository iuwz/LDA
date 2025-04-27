/**
 *  DashboardHome.tsx
 *  – unified palette & consistent motion
 *  – error-free Recent Activity icons
 */
import { IconType } from "react-icons";
import React, { useState } from "react";
import {
  FaEdit,
  FaShieldAlt,
  FaClipboardCheck,
  FaLanguage,
  FaRobot,
  FaFileAlt,
  FaUsersCog,
  FaChartLine,
  FaArrowRight,
  FaBell,
  FaUser,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

/* ───────────────── design tokens ───────────────── */
const BRAND = { dark: "#2C2C4A", light: "#444474" };
const ACCENT = { dark: "#C17829", light: "#E3A063" };
const SHADOW_GLOW = "0 12px 20px -5px rgba(0,0,0,.08)";

const fadeContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeItem = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

/* ───────────────── component ───────────────── */
const DashboardHome: React.FC = () => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  /* stats, tools, activity data (unchanged) */
  const stats = [
    {
      title: "Analyzed Documents",
      value: 158,
      icon: FaFileAlt,
      accent: ACCENT,
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
      accent: BRAND,
      change: "+3 since last week",
    },
  ];

  const tools = [
    {
      icon: FaEdit,
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
      desc: "Verify documents meet regulations and standards.",
      link: "/dashboard/compliance",
    },
    {
      icon: FaLanguage,
      title: "Translation Tool",
      desc: "Translate legal docs while keeping technical accuracy.",
      link: "/dashboard/translation",
    },
    {
      icon: FaRobot,
      title: "Chatbot Assistant",
      desc: "Instant answers for document-prep questions.",
      link: "/dashboard/chatbot",
    },
  ];

  const activity = [
    ["Document analysed", "Contract_2023_Q1.pdf", "2 h ago"],
    ["Compliance check", "Terms_of_Service_v3.docx", "5 h ago"],
    ["Risk assessment", "Partnership_Agreement.pdf", "Yesterday"],
    ["Document translated", "International_Agreement.docx", "2 d ago"],
  ];
  const activityIcons = [
    FaFileAlt,
    FaClipboardCheck,
    FaShieldAlt,
    FaLanguage,
  ] as const;

  return (
    <div className="space-y-10">
      {/* banner (unchanged) */}
      <Banner />

      {/* stats */}
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={fadeContainer}
        initial="hidden"
        animate="show"
      >
        {stats.map((s) => (
          <motion.div
            key={s.title}
            variants={fadeItem}
            whileHover={{ y: -6, boxShadow: SHADOW_GLOW }}
            className="overflow-hidden rounded-xl border bg-white shadow-sm"
          >
            <div className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium" style={{ color: s.accent.dark }}>
                  {s.title}
                </p>
                <span
                  className="rounded-full p-3"
                  style={{
                    backgroundColor: `${s.accent.light}33`,
                    color: s.accent.dark,
                  }}
                >
                  <s.icon size={20} />
                </span>
              </div>
              <h2 className="mb-1 text-3xl font-bold text-gray-800">
                {s.value}
              </h2>
              <p className="text-xs font-medium text-green-600">{s.change}</p>
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

      {/* tools (unchanged) */}
      <ToolsSection
        tools={tools}
        hoverIdx={hoverIdx}
        setHoverIdx={setHoverIdx}
      />

      {/* recent activity (FIXED) */}
      <motion.div
        className="rounded-xl border bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-[color:var(--brand-dark)]">
            Recent Activity
          </h2>
          <span className="rounded-full bg-[color:var(--accent-light)] px-3 py-1 text-xs font-medium text-[color:var(--accent-dark)]">
            Today
          </span>
        </div>

        <div className="space-y-4">
          {activity.map(([act, doc, when], i) => {
            const Icon = activityIcons[i % activityIcons.length];
            const even = i % 2 === 0;
            return (
              <motion.div
                key={i}
                className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-lg p-2"
                    style={{
                      backgroundColor: even
                        ? "rgba(193,120,41,0.1)"
                        : "rgba(44,44,74,0.1)",
                      color: even ? ACCENT.dark : BRAND.dark,
                    }}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{act}</p>
                    <p className="text-sm text-gray-500">{doc}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-400">
                  {when}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <motion.button
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--accent-dark)] transition-colors hover:bg-[color:var(--accent-dark)] hover:text-white"
            style={{ backgroundColor: "rgba(193,120,41,0.1)" }}
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

/* ───────── sub-components (unchanged styling) ───────── */

const Banner = () => (
  <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
    <BackgroundBubbles />
    <div className="relative z-10 flex flex-col items-center justify-between gap-8 p-10 sm:flex-row sm:gap-0">
      <div className="flex items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--brand-dark)]">
          <FaUser className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="mb-1 font-serif text-3xl font-bold text-[color:var(--brand-dark)]">
            Welcome back, John
          </h1>
          <p className="text-lg text-gray-600">
            Here’s today’s overview of your legal-doc activity.
          </p>
        </div>
      </div>
      <div className="flex gap-4">
        <Chip
          icon={FaChartLine}
          label="Activity up 23%"
          bg={ACCENT.dark}
          fg="#fff"
        />
        <Chip icon={FaBell} label="3 Tasks" bg={BRAND.dark} fg="#fff" dot />
      </div>
    </div>
  </div>
);

interface ToolCard {
  icon: IconType;
  title: string;
  desc: string;
  link: string;
}

const ToolsSection = ({
  tools,
  hoverIdx,
  setHoverIdx,
}: {
  tools: ToolCard[];
  hoverIdx: number | null;
  setHoverIdx: React.Dispatch<React.SetStateAction<number | null>>;
}) => (
  <section className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="font-serif text-2xl font-semibold text-[color:var(--brand-dark)]">
        Our Tools
      </h2>
      <Link
        to="/dashboard"
        className="group flex items-center gap-1 text-sm font-medium text-[color:var(--accent-dark)] transition-all hover:gap-2"
      >
        View all{" "}
        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>

    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={fadeContainer}
      initial="hidden"
      animate="show"
    >
      {tools.map((t, i) => (
        <motion.div key={t.title} variants={fadeItem}>
          <Link to={t.link}>
            <motion.div
              onHoverStart={() => setHoverIdx(i)}
              onHoverEnd={() => setHoverIdx(null)}
              whileHover={{ y: -8, boxShadow: SHADOW_GLOW }}
              className="relative h-full overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              <div
                className="h-2"
                style={{
                  background: `linear-gradient(to right, ${ACCENT.dark}, ${ACCENT.light})`,
                }}
              />
              <div className="p-6">
                <div className="mb-4 flex items-center">
                  <span
                    className="rounded-full p-3 text-white"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT.dark}, ${ACCENT.light})`,
                    }}
                  >
                    <t.icon size={20} />
                  </span>
                  <h3 className="ml-3 font-serif text-lg font-semibold text-[color:var(--brand-dark)]">
                    {t.title}
                  </h3>
                </div>
                <p className="mb-8 text-gray-600">{t.desc}</p>
                <motion.button
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT.dark}, ${ACCENT.light})`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try now <FaExternalLinkAlt size={12} />
                </motion.button>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

const Chip = ({
  icon: Icon,
  label,
  bg,
  fg,
  dot = false,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  bg: string;
  fg: string;
  dot?: boolean;
}) => (
  <span
    className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium"
    style={{ backgroundColor: bg, color: fg }}
  >
    <span className="relative">
      {dot && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
      )}
      <Icon size={14} />
    </span>
    {label}
  </span>
);

const BackgroundBubbles = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[
      ["-top-24 -left-20", 56, ACCENT.dark],
      ["top-1/3 -right-24", 32, BRAND.dark],
      ["bottom-20 left-24", 40, ACCENT.dark],
      ["top-12 right-1/3", 24, BRAND.dark],
    ].map(([pos, size, col], i) => (
      <motion.div
        key={i}
        className={`absolute ${pos} rounded-full`}
        style={{ width: size, height: size, backgroundColor: `${col}26` }}
        animate={{ scale: [1, 1.25, 1], rotate: [0, 360] }}
        transition={{
          duration: 20 + i * 3,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
    ))}
  </div>
);

export default DashboardHome;
