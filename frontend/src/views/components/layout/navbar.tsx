import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaHome,
  FaBars,
  FaTimes,
  FaChartBar,
  FaRegQuestionCircle,
} from "react-icons/fa";
import { LogIn } from "lucide-react";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Navbar component (search & language removed globally)
 * - Shows Dashboard when authenticated
 * - Avatar with dropdown (Profile | Log out) on desktop
 * - Mobile side panel footer now has Profile / Log out buttons
 *   (Login / Register for guests)
 * Colors stay: #C17829 (accent), #2C2C4A (brand), avatar bg-[#2c2c4a]
 */
const Navbar: React.FC = () => {
  // ─────────── State ───────────
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initials, setInitials] = useState("");

  // ─────────── Refs & Router ───────────
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // ─────────── Auth fetch ───────────
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setIsAuthenticated(true);
        setInitials(`${u.first_name[0].toUpperCase()}${u.last_name[0].toUpperCase()}`);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  // ─────────── Resize ───────────
  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─────────── Click outside for profile dropdown ───────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      )
        setIsProfileDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isProfileDropdownOpen]);

  // ─────────── Prevent scroll on mobile panel ───────────
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // ─────────── Helpers ───────────
  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen((v) => !v);

  const handleLoginClick = () => {
    navigate("/auth?form=login");
    setIsMobileMenuOpen(false);
  };
  const handleRegisterClick = () => {
    navigate("/auth?form=register");
    setIsMobileMenuOpen(false);
  };
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch (_) {}
    setIsAuthenticated(false);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const scrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") window.location.href = "/#services";
    else document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const getBrandTextClass = () =>
    screenWidth < 350
      ? "text-sm font-bold text-[#C17829] font-serif"
      : "text-lg sm:text-xl font-bold text-[#C17829] font-serif";
  const getIconSize = () => (screenWidth < 350 ? 16 : 20);

  // ─────────── JSX ───────────
  return (
    <div className="relative font-sans" ref={profileDropdownRef}>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 flex items-center bg-[#F5F5F5] px-2 xs:px-3 sm:px-6 py-2 xs:py-3 shadow-md">
        {/* Brand */}
        <div className="flex-1 flex justify-start">
          <NavLink to="/" className="flex items-center space-x-1 xs:space-x-2">
            <FaBalanceScale className="text-lg xs:text-xl sm:text-2xl text-[#2C2C4A]" />
            <span className={getBrandTextClass()}>LDA</span>
          </NavLink>
        </div>

        {/* Center links */}
        <div className="hidden lg:flex flex-1 justify-center space-x-2 lg:space-x-8 items-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              "flex items-center space-x-1 transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            <FaHome />
            <span>Home</span>
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                "flex items-center space-x-1 transition-colors hover:text-[#C17829] " +
                (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
              }
            >
              <FaChartBar />
              <span>Dashboard</span>
            </NavLink>
          )}
          <a
            href="#services"
            onClick={scrollToServices}
            className="transition-colors hover:text-[#C17829] text-[#2C2C4A]"
          >
            Services
          </a>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Right (only auth now) */}
        <div className="hidden lg:flex flex-1 justify-end items-center space-x-2 lg:space-x-4 ml-4">
          {isAuthenticated ? (
            <div className="relative">
              <div
                onClick={toggleProfileDropdown}
                title="Profile"
                className="h-8 w-8 rounded-full bg-[#2c2c4a] text-white flex items-center justify-center font-semibold cursor-pointer"
              >
                {initials}
              </div>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                onClick={handleLoginClick}
                className="bg-transparent border border-[#C17829] text-[#C17829] text-xs lg:text-sm font-semibold rounded-full px-2 lg:px-3 py-1 lg:py-1.5 shadow-md hover:bg-[#C17829]/10 hover:shadow-lg transition-all active:bg-[#C17829]/20 hover:scale-[1.01] flex items-center gap-1"
              >
                <span>Login</span>
                <LogIn size={14} className="hidden sm:inline" />
              </Button>
              <Button
                onClick={handleRegisterClick}
                className="bg-[#C17829] text-white text-xs lg:text-sm font-semibold rounded-full px-2 lg:px-3 py-1 lg:py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
              >
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile Controls (no search / language) */}
        <div className="lg:hidden flex items-center ml-auto gap-1 xs:gap-2 sm:gap-3">
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] transition-colors hover:text-[#C17829] p-1"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes size={getIconSize()} />
            ) : (
              <FaBars size={getIconSize()} />
            )}
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={toggleMobileMenu}
          aria-label="Close menu backdrop"
        />
      )}

      {/* Mobile Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* header */}
        <div className="flex justify-between items-center px-3 xs:px-4 py-2 xs:py-3 border-b">
          <NavLink
            to="/"
            className="flex items-center space-x-2"
            onClick={toggleMobileMenu}
          >
            <FaBalanceScale className="text-xl xs:text-2xl text-[#2C2C4A]" />
            <span className="text-lg xs:text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            <FaTimes size={getIconSize()} />
          </button>
        </div>

        {/* links */}
        <div className="px-3 xs:px-4 py-4 xs:py-6 space-y-4 xs:space-y-6">
          <NavLink
            to="/"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "flex items-center space-x-2 transition-colors hover:text-[#C17829] text-sm xs:text-base " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            <FaHome />
            <span>Home</span>
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              onClick={toggleMobileMenu}
              className={({ isActive }) =>
                "flex items-center space-x-2 transition-colors hover:text-[#C17829] text-sm xs:text-base " +
                (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
              }
            >
              <FaRegQuestionCircle />
              <span>Dashboard</span>
            </NavLink>
          )}
          <a
            href="#services"
            onClick={(e) => {
              scrollToServices(e);
              toggleMobileMenu();
            }}
            className="block transition-colors hover:text-[#C17829] text-[#2C2C4A] text-sm xs:text-base"
          >
            Services
          </a>
          <NavLink
            to="/about"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] text-sm xs:text-base " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] text-sm xs:text-base " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact
          </NavLink>
        </div>

        {/* footer auth */}
        <div className="mt-auto px-3 xs:px-4 py-4 xs:py-6 border-t space-y-3 xs:space-y-4">
          {isAuthenticated ? (
            <>
              <Button
                onClick={() => {
                  navigate("/dashboard/profile");
                  toggleMobileMenu();
                }}
                className="w-full bg-[#C17829] text-white text-xs xs:text-sm rounded-full font-semibold py-1 xs:py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all hover:scale-[1.01]"
              >
                Profile
              </Button>
              <Button
                onClick={handleLogout}
                className="w-full bg-transparent border border-red-600 text-red-600 text-xs xs:text-sm rounded-full font-semibold py-1 xs:py-1.5 shadow-md hover:bg-red-50 hover:shadow-lg transition-all hover:scale-[1.01]"
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  handleLoginClick();
                  toggleMobileMenu();
                }}
                className="w-full bg-transparent border border-[#C17829] text-[#C17829] text-xs xs:text-sm rounded-full font-semibold py-1 xs:py-1.5 shadow-md hover:bg-[#C17829]/10 hover:shadow-lg transition-all active:bg-[#C17829]/20 hover:scale-[1.01] flex items-center justify-center gap-1"
              >
                Login
                <LogIn size={screenWidth < 350 ? 14 : 16} />
              </Button>
              <Button
                onClick={() => {
                  handleRegisterClick();
                  toggleMobileMenu();
                }}
                className="w-full bg-[#C17829] text-white text-xs xs:text-sm rounded-full font-semibold py-1 xs:py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;