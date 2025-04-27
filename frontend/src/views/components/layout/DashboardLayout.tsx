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
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const location = useLocation();

  // Sidebar navigation items
  const navItems = [
    {
      icon: FaTachometerAlt,
      title: "Dashboard",
      path: "/dashboard",
      end: true, // ensure exact match so only root path is active
    },
    {
      icon: FaEdit,
      title: "Rephrasing Tool",
      path: "/dashboard/rephrasing",
    },
    {
      icon: FaShieldAlt,
      title: "Risk Assessment Tool",
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
    {
      icon: FaRobot,
      title: "Chatbot",
      path: "/dashboard/chatbot",
    },
  ];

  // Derive current page title
  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== "/dashboard" && location.pathname.startsWith(item.path))
    );
    return currentItem ? currentItem.title : "Dashboard";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Expand button (when sidebar collapsed) */}
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
        className="fixed md:relative z-30 h-full bg-white shadow-lg overflow-y-auto"
        initial={false}
        animate={{ width: isSidebarOpen ? "16rem" : "0" }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo / collapse control */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl " />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 p-2 rounded-md hover:bg-gray-100"
          >
            <FaChevronLeft />
          </button>
        </div>

        {/* Nav links */}
        <nav className="mt-4">
          <ul className="space-y-1 px-3">
            {navItems.map(({ icon: Icon, title, path, end }, idx) => (
              <li key={idx}>
                <NavLink
                  to={path}
                  end={end}
                  className={({ isActive }) => `
                    flex items-center p-3 rounded-md transition-all hover:bg-gray-100
                    ${
                      isActive
                        ? "bg-[#f7ede1] text-[#C17829] font-medium border-l-4 border-[#C17829]"
                        : "text-gray-700"
                    }
                  `}
                >
                  <Icon className="text-lg mr-3" />
                  <span>{title}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User section */}
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

              {/* Gear icon */}
              <button
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="text-gray-500 p-2 rounded-md hover:bg-gray-100 relative"
              >
                <FaCog />
              </button>

              {/* Dropdown */}
              {isAccountMenuOpen && (
                <div className="absolute right-4 bottom-16 w-40 bg-white shadow-md rounded-md overflow-hidden border z-40">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      /* handle profile route */
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <FaUser className="mr-2" /> Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      /* handle settings route */
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <FaWrench className="mr-2" /> Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      /* handle logout */
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                  >
                    <FaSignOutAlt className="mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </motion.aside>

      {/* Main area */}
      <div className={`flex-1 flex flex-col overflow-hidden`}>
        {/* Top bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              {!isSidebarOpen && (
                <FaBalanceScale className="text-2xl text-[#C17829]" />
              )}
              <h1 className="text-xl font-semibold text-[#2C2C4A]">
                {getCurrentPageTitle()}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-[#C17829] px-3 py-1"
              >
                Home
              </a>
            </div>
          </div>
        </header>

        {/* Routed page content */}
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
