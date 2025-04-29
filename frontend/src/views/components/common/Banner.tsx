import React from "react";
import { motion } from "framer-motion";
import { FaUser, FaChartLine, FaBell } from "react-icons/fa";

const ACCENT = { dark: "#C17829", light: "#E3A063" };
const BRAND = { dark: "#2C2C4A", light: "#444474" };

const Banner: React.FC = () => (
  <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
    <BackgroundBubbles />

    <div className="relative z-10 flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[color:var(--brand-dark)] flex items-center justify-center">
          <FaUser className="text-xl sm:text-2xl text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[color:var(--brand-dark)] leading-tight">
            Welcome back, John
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Here’s today’s overview of your legal-doc activity.
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-auto sm:gap-4">
        <div className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-2 text-white bg-[color:var(--accent-dark)]">
          <FaChartLine size={16} />
          <span className="text-sm">Activity up 23%</span>
        </div>
        <div className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-2 text-white bg-[color:var(--brand-dark)]">
          <FaBell size={16} />
          <span className="text-sm">3 Tasks</span>
        </div>
      </div>
    </div>
  </div>
);

const BackgroundBubbles: React.FC = () => {
  const spots: [string, number, string][] = [
    ["-top-24 -left-20", 56, ACCENT.dark],
    ["top-1/3 -right-24", 32, BRAND.dark],
    ["bottom-20 left-24", 40, ACCENT.dark],
    ["top-12 right-1/3", 24, BRAND.dark],
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      {spots.map(([pos, size, col], i) => (
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
};

export default Banner;
