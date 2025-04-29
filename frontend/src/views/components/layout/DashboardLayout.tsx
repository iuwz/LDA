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
  FaUser,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

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

const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [accMenu, setAccMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNavClick = () => setOpen(false);

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
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
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
                 ${
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

          <button
            onClick={() => {
              navigate("/");
              setOpen(false);
            }}
            className="mt-4 w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-100"
          >
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </div>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-[#2C2C4A] rounded-full flex items-center justify-center text-white">
                <FaUser />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-gray-500">Legal Advisor</p>
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
              <NavLink
                to="/dashboard/settings"
                className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                onClick={handleNavClick}
              >
                <FaCog className="mr-2" /> Settings
              </NavLink>
              <button
                onClick={() => {
                  navigate("/");
                  setAccMenu(false);
                  setOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md"
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <div
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300
          ${open ? "md:pl-64" : "md:pl-0"}
        `}
      >
        <header className="flex items-center justify-between bg-white shadow px-4 sm:px-6 lg:px-8 h-12">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 p-1 text-[#C17829] hover:bg-gray-100 rounded"
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
            className="hidden sm:inline-block text-sm text-gray-600 hover:text-[#C17829]"
          >
            Home
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
