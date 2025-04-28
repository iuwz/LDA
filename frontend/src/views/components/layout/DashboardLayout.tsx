// src/views/components/layout/DashboardLayout.tsx

import React, { useState } from "react";
import {
  FaEdit,
  FaShieldAlt,
  FaClipboardCheck,
  FaLanguage,
  FaRobot,
  FaTachometerAlt,
  FaChevronRight,
  FaChevronLeft,
  FaUser,
  FaBalanceScale,
  FaCog,
  FaSignOutAlt,
  FaWrench,
} from "react-icons/fa";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
];

const TFA_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

// Removed the "Settings" entry here
const navItems = [
  {
    icon: FaTachometerAlt,
    title: "Dashboard",
    path: "/dashboard",
    end: true,
  },
  { icon: FaEdit, title: "Rephrasing Tool", path: "/dashboard/rephrasing" },
  {
    icon: FaShieldAlt,
    title: "Risk Assessment",
    path: "/dashboard/risk-assessment",
  },
  {
    icon: FaClipboardCheck,
    title: "Compliance Checker",
    path: "/dashboard/compliance",
  },
  {
    icon: FaLanguage,
    title: "Translation Tool",
    path: "/dashboard/translation",
  },
  { icon: FaRobot, title: "Chatbot", path: "/dashboard/chatbot" },
];

const getCurrentPageTitle = (locationPath: string) => {
  const current = navItems.find(
    (i) =>
      locationPath === i.path ||
      (i.path !== "/dashboard" && locationPath.startsWith(i.path))
  );
  return current ? current.title : "Dashboard";
};

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: clear your auth state / remove token here
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {/* Toggle sidebar */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-r-md text-[#C17829] hover:bg-gray-100 z-50"
        >
          <FaChevronRight />
        </button>
      )}

      {/* Sidebar */}
      <motion.aside
        className="fixed md:relative z-30 h-full bg-white shadow-lg overflow-y-auto overflow-x-hidden"
        initial={false}
        animate={{ width: isSidebarOpen ? "16rem" : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo & collapse button */}
        <div className="p-4 border-b flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 p-2 rounded-md hover:bg-gray-100"
          >
            <FaChevronLeft />
          </button>
        </div>

        <nav className="mt-4 px-3 overflow-x-hidden">
          {/* Main nav items */}
          <ul className="space-y-1">
            {navItems.map(({ icon: Icon, title, path, end }, idx) => (
              <li key={idx}>
                <NavLink
                  to={path}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-md transition-all hover:bg-gray-100 ${
                      isActive
                        ? "bg-[#f7ede1] text-[#C17829] font-medium border-l-4 border-[#C17829]"
                        : "text-gray-700"
                    }`
                  }
                >
                  <Icon className="text-lg mr-3" />
                  <span>{title}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Red Logout button above the profile */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 mt-4 text-red-600 rounded-md hover:bg-gray-100"
          >
            <FaSignOutAlt className="text-lg mr-3" />
            <span>Logout</span>
          </button>

          {/* Profile & gear menu */}
          <div className="absolute bottom-0 w-full p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#2C2C4A] flex items-center justify-center text-white">
                  <FaUser />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">John Doe</p>
                  <p className="text-xs text-gray-500">Legal Advisor</p>
                </div>
              </div>

              <button
                onClick={() => setIsAccountMenuOpen((v) => !v)}
                className="text-gray-500 p-2 rounded-md hover:bg-gray-100 relative"
              >
                <FaCog />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-4 bottom-16 w-40 bg-white shadow-md rounded-md border z-40">
                  <NavLink
                    to="/dashboard/profile"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <FaUser className="mr-2" />
                    Edit Profile
                  </NavLink>
                  <NavLink
                    to="/dashboard/settings"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <FaWrench className="mr-2" />
                    Settings
                  </NavLink>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              {!isSidebarOpen && (
                <FaBalanceScale className="text-2xl text-[#C17829]" />
              )}
              <h1 className="text-xl font-semibold text-[#2C2C4A]">
                {getCurrentPageTitle(location.pathname)}
              </h1>
            </div>
            <NavLink
              to="/"
              className="text-sm text-gray-600 hover:text-[#C17829] px-3 py-1"
            >
              Home
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
