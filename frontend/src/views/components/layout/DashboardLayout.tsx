// src/components/layout/DashboardLayout.tsx
import React, { useState, useEffect, createContext } from "react";
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
import { HiHome } from "react-icons/hi";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import LoadingScreen from "../common/LoadingScreen";
import { logout } from "../../../api";

export const DashboardReadyContext = createContext<(v: boolean) => void>(
  () => {}
);

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

const titleFor = (path: string) => {
  const match = navItems.find(
    (it) =>
      path === it.path || (it.path !== "/dashboard" && path.startsWith(it.path))
  );
  return match?.title ?? "Dashboard";
};

const DashboardLayout: React.FC = () => {
  /* gate #1 – authenticate */
  const [userReady, setUserReady] = useState(false);
  /* gate #2 – child page (initially ready so no overlay) */
  const [childReady, setChildReady] = useState(true);

  /* UI */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accMenu, setAccMenu] = useState(false);

  /* user */
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  /* fetch auth/me */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!r.ok) throw new Error();
        const d = await r.json();
        setFirst(d.first_name ?? "");
        setLast(d.last_name ?? "");
        setRole(d.role ?? "");
      } catch {
        navigate("/auth", { replace: true });
        return;
      } finally {
        setUserReady(true);
      }
    })();
  }, [navigate]);

  /* fixed body scroll when sidebar open (mobile) */
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  /* until auth finishes */
  if (!userReady) return <LoadingScreen />;

  const initials = (first[0] ?? "") + (last[0] ?? "");
  const isAdmin = role === "admin";
  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    navigate("/auth", { replace: true });
  };

  return (
    <DashboardReadyContext.Provider value={setChildReady}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ───── Sidebar ───── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0
          `}
        >
          {/* brand */}
          <div className="flex items-center justify-between h-12 px-4 border-b">
            <NavLink
              to="/dashboard"
              className="flex items-center space-x-2"
              onClick={() => setSidebarOpen(false)}
            >
              <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
              <span className="text-xl font-bold text-[#C17829] font-serif">
                LDA
              </span>
            </NavLink>
            <button
              className="md:hidden p-1 hover:bg-gray-100 rounded"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          {/* nav */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            {/* Home link – only visible on mobile */}
            <NavLink
              to="/"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors md:hidden ${
                  isActive
                    ? "bg-[#f7ede1] text-[#C17829] border-l-4 border-[#C17829]"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <HiHome className="mr-3" />
              <span className="truncate">Home</span>
            </NavLink>

            {navItems.map(({ icon: Icon, title, path, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
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
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
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

          {/* profile footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-[#2C2C4A] rounded-full flex items-center justify-center text-white font-semibold">
                  {initials || <FaCog />}
                </div>
                <div>
                  <p className="text-sm font-medium truncate">
                    {first} {last}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {role || "User"}
                  </p>
                </div>
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => setAccMenu((v) => !v)}
              >
                <FaCog />
              </button>
            </div>

            {accMenu && (
              <div className="mt-2 space-y-1">
                <NavLink
                  to="/dashboard/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                >
                  <FaUser className="mr-2" /> Profile
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
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
        </aside>

        {/* main */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            sidebarOpen ? "md:pl-64" : "md:pl-0"
          }`}
        >
          <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 h-12">
            <div className="flex items-center">
              <button
                className="md:hidden mr-3 p-1 text-[#2C2C4A] hover:bg-gray-100 rounded"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-[#2C2C4A] truncate">
                {titleFor(location.pathname)}
              </h1>
            </div>
            <NavLink
              to="/"
              className="hidden sm:flex items-center p-2 text-[#2C2C4A] hover:text-[#C17829]"
            >
              <HiHome className="w-5 h-5" />
            </NavLink>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardReadyContext.Provider>
  );
};

export default DashboardLayout;
