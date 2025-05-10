// src/views/components/layout/DashboardLayout.tsx

import React, { useState, useEffect } from "react";

import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaEdit,
  FaShieldAlt,
  FaClipboardCheck,
  FaLanguage,
  FaRobot,
  FaBalanceScale,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaUserShield,
} from "react-icons/fa";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../../api";
import { HiHome } from "react-icons/hi";

// Base URL for back-end
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const navItems = [
  { icon: FaTachometerAlt, title: "Dashboard", path: "/dashboard", end: true },
  { icon: FaEdit, title: "Rephrasing", path: "/dashboard/rephrasing" },
  {
    icon: FaShieldAlt,
    title: "Risk Assessment",
    path: "/dashboard/risk-assessment",
  },
  {
    icon: FaClipboardCheck,
    title: "Compliance",
    path: "/dashboard/compliance",
  },
  { icon: FaLanguage, title: "Translation", path: "/dashboard/translation" },
  { icon: FaRobot, title: "Chatbot", path: "/dashboard/chatbot" },
];

const getCurrentTitle = (path: string) => {
  const found = navItems.find(
    (i) =>
      path === i.path || (i.path !== "/dashboard" && path.startsWith(i.path))
  );
  return found?.title || "Dashboard";
};

interface UserMe {
  first_name?: string;
  last_name?: string;
  role?: string;
}

const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [accMenu, setAccMenu] = useState(false);

  // Delay-render these until loaded
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fetch current user info for display
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data: UserMe) => {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setRole(data.role || "");
      })
      .catch((err) => {
        console.error("Failed to fetch user info:", err);
        // Still mark as loaded, even on error
        setFirstName("");
        setLastName("");
        setRole("");
      });
  }, []);

  const handleNavClick = () => setOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    navigate("/auth", { replace: true });
    setOpen(false);
    setAccMenu(false);
  };

  // Check if user is admin
  const isAdmin = role === "admin";

  // Compute user initials (won't run until loaded)
  const initials = (firstName?.charAt(0) || "") + (lastName?.charAt(0) || "");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0
        `}
      >
        {/* Sidebar brand */}
        <div className="flex items-center justify-between h-12 px-4 border-b">
          <NavLink
            to="/dashboard"
            className="flex items-center space-x-2"
            onClick={handleNavClick}
          >
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
          <button
            className="md:hidden p-1 hover:bg-gray-100 rounded"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map(({ icon: Icon, title, path, end }, idx) => (
            <NavLink
              key={idx}
              to={path}
              end={end}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                 ${isActive
                  ? "bg-[#f7ede1] text-[#C17829] border-l-4 border-[#C17829]"
                  : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="mr-3" />
              <span className="truncate">{title}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                 ${isActive
                  ? "bg-[#f7ede1] text-[#C17829] border-l-4 border-[#C17829]"
                  : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <FaUserShield className="mr-3" />
              <span className="truncate">Admin Panel</span>
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-100"
          >
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </div>

        {/* Profile section: only render after user info has loaded */}
        {firstName !== null && lastName !== null && role !== null && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-[#2C2C4A] rounded-full flex items-center justify-center text-white font-semibold">
                  {initials || <FaCog />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {firstName} {lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {role || "User"}
                  </p>
                </div>
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => setAccMenu((v) => !v)}
                aria-label="Account menu"
              >
                <FaCog />
              </button>
            </div>
            {accMenu && (
              <div className="mt-2 space-y-1">
                <NavLink
                  to="/dashboard/profile"
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                  onClick={handleNavClick}
                >
                  <FaUser className="mr-2" /> Profile
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    onClick={handleNavClick}
                  >
                    <FaUserShield className="mr-2" /> Admin Panel
                  </NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${open ? "md:pl-64" : "md:pl-0"
          }`}
      >
        <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 h-12">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 p-1 text-[#2C2C4A] hover:bg-gray-100 rounded"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-[#2C2C4A] truncate">
              {getCurrentTitle(location.pathname)}
            </h1>
          </div>

          <NavLink
            to="/"
            className="hidden sm:flex items-center justify-center text-[#2C2C4A] hover:text-[#C17829] p-2"
          >
            <HiHome className="w-5 h-5" />
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
