// src/views/components/common/LoadingScreen.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FaBalanceScale } from "react-icons/fa";

/* brand palette */
const BEACH_START = "#f7ede1";
const BEACH_END = "#ffffff";
const INDIGO = "#2C2C4A";
const SAND_SHADE = "#C17829";

/* small utility for randoms */
const R = (min: number, max: number) => Math.random() * (max - min) + min;

/* ------------------------------------------------------------------ */
/* 1 bubble (background accent) – randomised once then frozen          */
const Bubble: React.FC<{ i: number }> = ({ i }) => {
  /* memo so numbers stay stable across re-renders */
  const props = useMemo(
    () => ({
      size: R(120, 220),
      top: R(-20, 100), // % – can start outside viewport
      left: R(-20, 100),
      delay: R(0, 4), // seconds
      duration: R(14, 24), // seconds
      opacity: R(0.06, 0.14),
      range: R(40, 70), // px float distance
    }),
    []
  );

  return (
    <motion.span
      className="absolute rounded-full"
      style={{
        width: props.size,
        height: props.size,
        top: `${props.top}%`,
        left: `${props.left}%`,
        background: `linear-gradient(135deg, ${SAND_SHADE}22 0%, ${SAND_SHADE}05 100%)`,
        opacity: props.opacity,
        filter: "blur(8px)",
      }}
      animate={{
        y: [0, props.range, 0],
        x: [0, props.range * (i % 2 ? -1 : 1), 0],
      }}
      transition={{
        duration: props.duration,
        delay: props.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* MAIN component                                                      */
export default function LoadingScreen() {
  return (
    <div
      className="relative h-screen w-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${BEACH_START} 0%, ${BEACH_END} 100%)`,
      }}
    >
      {/* subtle background bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <Bubble key={i} i={i} />
        ))}
      </div>

      {/* brand icon – breathing & gentle rotation */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          rotate: [0, 8, -8, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ color: INDIGO }}
        className="relative z-10 text-[56px] sm:text-[64px] lg:text-[72px]"
        aria-label="Loading"
      >
        <FaBalanceScale />
      </motion.div>

      {/* animated dots in the tagline */}
      <motion.p
        className="relative z-10 mt-6 font-serif text-lg sm:text-xl font-semibold tracking-wide"
        style={{ color: INDIGO }}
        aria-live="polite"
      >
        Loading
        <motion.span
          animate={{ opacity: [0, 1, 0], y: [0, -2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          …
        </motion.span>
      </motion.p>
    </div>
  );
}
