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
  FaExclamationCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const DashboardHome = () => {
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);

  // Sample data for statistics with distinct colors
  const stats = [
    {
      title: "Analyzed Documents",
      value: 158,
      icon: FaFileAlt,
      color: "text-[#C17829]",
      bgColor: "bg-[#f7ede1]",
      increase: "+12% this month",
      cardBg: "bg-gradient-to-br from-white to-[#f7ede1]/30",
    },
    {
      title: "Compliance Checks",
      value: 64,
      icon: FaClipboardCheck,
      color: "text-[#2563eb]",
      bgColor: "bg-blue-100",
      increase: "+8% this month",
      cardBg: "bg-gradient-to-br from-white to-blue-50",
    },
    {
      title: "Risk Assessments",
      value: 42,
      icon: FaShieldAlt,
      color: "text-[#dc2626]",
      bgColor: "bg-red-100",
      increase: "+15% this month",
      cardBg: "bg-gradient-to-br from-white to-red-50",
    },
    {
      title: "Active Users",
      value: 12,
      icon: FaUsersCog,
      color: "text-[#2C2C4A]",
      bgColor: "bg-[#e6e6f2]",
      increase: "+3 since last week",
      cardBg: "bg-gradient-to-br from-white to-[#e6e6f2]/30",
    },
  ];

  // Tools cards data
  const tools = [
    {
      icon: FaEdit,
      title: "Rephrasing Tool",
      description:
        "Improve document clarity and precision with AI-powered suggestions.",
      link: "/dashboard/rephrasing",
      color: "from-[#C17829] to-[#E3A063]",
      bgGlow: "rgba(193, 120, 41, 0.1)",
    },
    {
      icon: FaShieldAlt,
      title: "Risk Assessment Tool",
      description:
        "Identify potential legal pitfalls and vulnerabilities in your documents.",
      link: "/dashboard/risk-assessment",
      color: "from-[#2C2C4A] to-[#444474]",
      bgGlow: "rgba(44, 44, 74, 0.1)",
    },
    {
      icon: FaClipboardCheck,
      title: "Compliance Checker",
      description:
        "Ensure your documents comply with current regulations and standards.",
      link: "/dashboard/compliance",
      color: "from-[#C17829] to-[#E3A063]",
      bgGlow: "rgba(193, 120, 41, 0.1)",
    },
    {
      icon: FaLanguage,
      title: "Translation Tool",
      description:
        "Translate legal documents while maintaining technical accuracy.",
      link: "/dashboard/translation",
      color: "from-[#2C2C4A] to-[#444474]",
      bgGlow: "rgba(44, 44, 74, 0.1)",
    },
    {
      icon: FaRobot,
      title: "Chatbot Assistant",
      description:
        "Get instant answers to your questions about document preparation.",
      link: "/dashboard/chatbot",
      color: "from-[#C17829] to-[#E3A063]",
      bgGlow: "rgba(193, 120, 41, 0.1)",
    },
  ];

  // Recent activity sample data
  const recentActivity = [
    {
      id: 1,
      action: "Document analyzed",
      document: "Contract_2023_Q1.pdf",
      time: "2 hours ago",
    },
    {
      id: 2,
      action: "Compliance check",
      document: "Terms_of_Service_v3.docx",
      time: "5 hours ago",
    },
    {
      id: 3,
      action: "Risk assessment",
      document: "Partnership_Agreement.pdf",
      time: "Yesterday",
    },
    {
      id: 4,
      action: "Document translated",
      document: "International_Agreement.docx",
      time: "2 days ago",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8">
      {/* Larger banner with animated bubbles */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden relative">
        {/* Animated background bubbles - made larger */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute h-56 w-56 rounded-full bg-[#C17829]/10 -top-20 -right-20"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
          <motion.div
            className="absolute h-32 w-32 rounded-full bg-[#2C2C4A]/10 bottom-10 right-32"
            animate={{
              scale: [1, 1.5, 1],
              x: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
          <motion.div
            className="absolute h-40 w-40 rounded-full bg-[#C17829]/10 bottom-16 left-32"
            animate={{
              y: [0, 15, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
          <motion.div
            className="absolute h-24 w-24 rounded-full bg-[#2C2C4A]/10 top-16 left-64"
            animate={{
              x: [0, 20, 0],
              y: [0, 10, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: "loop",
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center p-10 py-12 relative z-10">
          <div className="flex items-center mb-6 sm:mb-0">
            <div className="w-16 h-16 rounded-full bg-[#2C2C4A] flex items-center justify-center mr-6">
              <FaUser className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2C2C4A] font-serif mb-2">
                Welcome back, John
              </h1>
              <p className="text-gray-600 text-lg">
                Here's an overview of your legal document activity for today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="bg-[#f7ede1] px-5 py-3 rounded-lg flex items-center gap-3 text-[#C17829]">
              <FaChartLine className="text-lg" />
              <span className="font-medium text-lg">Activity up 23%</span>
            </div>

            <div className="flex items-center gap-3 bg-[#e6e6f2] px-5 py-3 rounded-lg text-[#2C2C4A]">
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                <FaBell className="text-lg" />
              </div>
              <span className="font-medium text-lg">3 Tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section with background colors */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className={`rounded-xl shadow-md overflow-hidden ${stat.cardBg} border border-gray-100`}
            variants={item}
            whileHover={{
              y: -8,
              boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className={`font-medium ${stat.color}`}>{stat.title}</p>
                <div
                  className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}
                >
                  <stat.icon size={20} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">
                {stat.value}
              </h2>
              <p className="text-xs font-medium text-green-600">
                {stat.increase}
              </p>
            </div>
            <div
              className={`h-1.5 bg-gradient-to-r ${
                index % 2 === 0
                  ? "from-[#C17829] to-[#E3A063]"
                  : "from-[#2C2C4A] to-[#444474]"
              }`}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Improved Tools Section with grid layout */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#2C2C4A] font-serif">
            Our Tools
          </h2>
          <Link
            to="/dashboard"
            className="text-[#C17829] text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all group"
          >
            <span>View all tools</span>
            <motion.span
              whileHover={{ x: 3 }}
              className="group-hover:text-[#E3A063]"
            >
              <FaArrowRight />
            </motion.span>
          </Link>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {tools.map((tool, index) => (
            <motion.div key={index} variants={item}>
              <Link to={tool.link}>
                <motion.div
                  className="bg-white rounded-xl shadow-md overflow-hidden h-full border border-gray-100 relative"
                  style={{
                    boxShadow:
                      hoveredTool === index
                        ? `0 10px 25px -5px ${tool.bgGlow}, 0 8px 10px -6px ${tool.bgGlow}`
                        : "",
                  }}
                  whileHover={{
                    y: -10,
                  }}
                  onHoverStart={() => setHoveredTool(index)}
                  onHoverEnd={() => setHoveredTool(null)}
                >
                  <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <motion.div
                        className={`p-3 rounded-full bg-gradient-to-r ${tool.color} text-white`}
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <tool.icon size={20} />
                      </motion.div>
                      <h3 className="ml-3 text-lg font-semibold text-[#2C2C4A] font-serif">
                        {tool.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-6">{tool.description}</p>
                    {/* Larger, more prominent button */}
                    <motion.div
                      className="flex justify-end"
                      animate={{
                        y: hoveredTool === index ? 0 : 5,
                        opacity: hoveredTool === index ? 1 : 0.8,
                      }}
                    >
                      <button className="bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg">
                        <span>Try now</span>
                        <FaExternalLinkAlt size={12} />
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#2C2C4A] font-serif">
            Recent Activity
          </h2>
          <div className="bg-[#f7ede1] text-[#C17829] text-xs font-medium px-3 py-1 rounded-full">
            Today
          </div>
        </div>

        <div className="space-y-5">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              whileHover={{
                x: 5,
                backgroundColor: "rgba(249, 250, 251, 0.8)",
              }}
              className="p-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg ${
                    index % 2 === 0
                      ? "bg-[#f7ede1] text-[#C17829]"
                      : "bg-[#e6e6f2] text-[#2C2C4A]"
                  } mr-3`}
                >
                  {index === 0 && <FaFileAlt />}
                  {index === 1 && <FaClipboardCheck />}
                  {index === 2 && <FaShieldAlt />}
                  {index === 3 && <FaLanguage />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.document}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {activity.time}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <motion.button
            className="px-4 py-2 bg-[#f7ede1] text-[#C17829] rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#C17829] hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View all activity
            <FaArrowRight />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
