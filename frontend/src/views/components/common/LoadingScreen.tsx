// src/views/components/common/LoadingScreen.tsx
import React from "react";
import { motion } from "framer-motion";
import { FaBalanceScale } from "react-icons/fa";

/* brand palette */
const BEACH_START = "#f7ede1";
const BEACH_END = "#ffffff";
const INDIGO = "#2C2C4A";

export default function LoadingScreen() {
  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${BEACH_START} 0%, ${BEACH_END} 100%)`,
      }}
    >
      {/* breathing brand icon */}
      <motion.div
        animate={{ scale: [1, 1.35, 1] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        className="text-[56px] sm:text-[64px] lg:text-[72px]"
        style={{ color: INDIGO }}
      >
        <FaBalanceScale />
      </motion.div>

      {/* tagline */}
      <p
        className="mt-6 font-serif text-lg sm:text-xl font-semibold tracking-wide"
        style={{ color: INDIGO }}
      >
        Loading…
      </p>
    </div>
  );
}
