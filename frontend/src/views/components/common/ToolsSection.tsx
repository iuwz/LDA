// src/components/common/toolList.tsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";

export interface ToolCard {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  link: string;
}

const fadeContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeItem = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const SHADOW_GLOW = "0 12px 20px -5px rgba(0,0,0,.08)";

const ACCENT = { dark: "var(--accent-dark)", light: "var(--accent-light)" };

export const ToolList: React.FC<{
  tools: ToolCard[];
  hoverIdx: number | null;
  setHoverIdx: React.Dispatch<React.SetStateAction<number | null>>;
}> = ({ tools, hoverIdx, setHoverIdx }) => (
  <section className="space-y-6">
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      variants={fadeContainer}
      initial="hidden"
      animate="show"
    >
      {tools.map((t, i) => (
        <motion.div key={t.title} variants={fadeItem}>
          <Link
            to={t.link}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <motion.div
              whileHover={{ y: -8, boxShadow: SHADOW_GLOW }}
              className="relative overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              {/* top gradient bar */}
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
                <p className="mb-6 text-gray-600">{t.desc}</p>
                <motion.button
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-white"
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
