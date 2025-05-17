// src/components/common/toolList.tsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Button } from "./button";

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

const fadeItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export interface ToolListProps {
  tools: ToolCard[];
  hoverIdx: number | null;
  setHoverIdx: React.Dispatch<React.SetStateAction<number | null>>;
}

const ToolList: React.FC<ToolListProps> = ({ tools, hoverIdx, setHoverIdx }) => {
  return (
    <section className="space-y-6">
      <motion.div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={fadeContainer}
        initial="hidden"
        animate="show"
      >
        {tools.map((tool, i) => (
          <motion.div key={tool.title} variants={fadeItem}>
            <Link
              to={tool.link}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                  group
                  relative
                  flex flex-col
                  overflow-hidden
                  rounded-2xl
                  bg-white
                  border border-gray-200
                  shadow-sm
                  ${hoverIdx === i ? "shadow-lg" : "hover:shadow-lg"}
                  transition-shadow duration-300
                `}
              >
                <div
                  className="
                    pointer-events-none
                    absolute top-0 right-0
                    h-12 w-1/2
                    rounded-bl-2xl
                    bg-gradient-to-l from-[var(--accent-light)] to-transparent
                    group-hover:h-16
                    transition-all duration-300
                  "
                />

                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-4 flex items-center space-x-3">
                    <div
                      className="
                        p-3 rounded-full
                        bg-gradient-to-tr from-[var(--accent-dark)] to-[var(--accent-light)]
                        text-white
                        group-hover:scale-110
                        transition-transform duration-300
                      "
                    >
                      <tool.icon size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {tool.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 flex-grow">{tool.desc}</p>

                  <Button
                    size="md"
                    variant="primary"
                    className="
                      mt-6
                      w-full
                      py-2
                      rounded-full
                      bg-gradient-to-r from-[#C17829] to-[#D48F41]
                      text-white
                      flex items-center justify-center gap-2
                      hover:from-[#D48F41] hover:to-[#C17829]
                      transition-colors duration-200
                    "
                  >
                    Try now <FaExternalLinkAlt size={12} />
                  </Button>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default ToolList;