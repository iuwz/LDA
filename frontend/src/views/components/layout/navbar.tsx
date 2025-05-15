// src/views/components/Navbar.tsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { LogIn } from "lucide-react";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const ACCENT = "#C17829";
const ACCENT_DARKER_HOVER = "#A25F22"; // A slightly darker shade of ACCENT for hover

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initials, setInitials] = useState("");
  const [activeSection, setActiveSection] = useState<
    "home" | "services" | null
  >(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  /* ───────── determine active section on scroll ───────── */
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const servicesEl = document.getElementById("services");
    if (!servicesEl) return;

    const navHeight = 80; // adjust if navbar height changes
    const handleScroll = () => {
      const scrollPos = window.scrollY + navHeight + 1;
      const servicesTop = servicesEl.offsetTop;
      const servicesBottom = servicesTop + servicesEl.offsetHeight;
      if (scrollPos >= servicesTop && scrollPos < servicesBottom) {
        setActiveSection("services");
      } else {
        setActiveSection("home");
      }
    };
    handleScroll(); // run on mount
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  /* ───────── auth check ───────── */
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setIsAuthenticated(true);
        setInitials(
          `${u.first_name[0].toUpperCase()}${u.last_name[0].toUpperCase()}`
        );
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  /* ───────── resize ───────── */
  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ───────── close profile dropdown on outside click ───────── */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isProfileDropdownOpen]);

  /* ───────── lock body scroll when mobile menu open ───────── */
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  /* ───────── scroll to services on hash change ───────── */
  useEffect(() => {
    if (location.hash === "#services") {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  /* ───────── helper: always scroll to services ───────── */
  const handleServicesClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault(); // stop default hash behaviour
    setIsMobileMenuOpen(false);

    if (location.pathname !== "/") {
      // go to home, then scroll
      navigate("/#services");
    } else {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
      // make sure URL hash is correct (for refresh/back-button behaviour)
      if (window.location.hash !== "#services") {
        window.history.replaceState(null, "", "#services");
      }
    }
  };

  /* ───────── callbacks ───────── */
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
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const getIconSize = () => (screenWidth < 350 ? 16 : 20);
  const activeLink = `text-[${ACCENT}] font-semibold border-b-2 border-[${ACCENT}]`;
  const inactiveLink = "hover:text-[#C17829] transition-colors";

  /* ───────── button styles ───────── */
  const loginButtonStyle =
    "w-[105px] h-[40px] inline-flex items-center justify-center text-[#C17829] rounded-full font-semibold text-lg transition transform hover:bg-gradient-to-r hover:from-[#C17829] hover:to-[#E3A063] hover:text-white";
  const registerButtonStyle =
    "w-[105px] h-[40px] inline-flex items-center justify-center bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105";

  /* ───────── mobile nav classes ───────── */
  const mobileClass = (isActive: boolean) =>
    `flex items-center px-4 py-2 rounded-md text-base font-medium transition-colors ${
      isActive
        ? "bg-[#f7ede1] text-[#C17829] border-l-4 border-[#C17829]"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  /* ───────── JSX ───────── */
  return (
    <div className="relative font-sans" ref={profileDropdownRef}>
      <nav className="sticky top-0 z-50 flex items-center bg-white px-6 py-3 shadow-md">
        <div className="flex-1">
          <NavLink to="/" end className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span
              className="font-serif font-bold text-xl"
              style={{ color: ACCENT }}
            >
              LDA
            </span>
          </NavLink>
        </div>

        {/* ───────── desktop links ───────── */}
        <div className="hidden lg:flex flex-1 justify-center space-x-8 text-[#2C2C4A]">
          <NavLink
            to="/"
            end
            className={() =>
              `relative px-1 pb-1 ${
                activeSection !== "services" && location.pathname === "/"
                  ? activeLink
                  : inactiveLink
              }`
            }
          >
            Home
          </NavLink>

          {authChecked && isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
              }
            >
              Dashboard
            </NavLink>
          )}

          <Link
            to="/#services"
            className={`relative px-1 pb-1 ${
              activeSection === "services" ? activeLink : inactiveLink
            }`}
            onClick={handleServicesClick}
          >
            Services
          </Link>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
            }
          >
            Contact
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
            }
          >
            About
          </NavLink>
        </div>

        {/* ───────── desktop auth ───────── */}
        <div className="hidden lg:flex flex-1 justify-end items-center space-x-4 min-w-[150px]">
          {authChecked ? (
            isAuthenticated ? (
              <div className="relative">
                <div
                  onClick={toggleProfileDropdown}
                  className="h-8 w-8 rounded-full bg-[#2C2C4A] text-white flex items-center justify-center cursor-pointer"
                >
                  {initials}
                </div>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg py-1">
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                    >
                      <FaUserCircle className="mr-2 text-[#2C2C4A]" size={14} />{" "}
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className={loginButtonStyle}
                  onClick={handleLoginClick}
                >
                  <div className="flex items-center space-x-1">
                    <LogIn size={14} />
                    <span>Login</span>
                  </div>
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  className={registerButtonStyle}
                  onClick={handleRegisterClick}
                >
                  Register
                </Button>
              </>
            )
          ) : (
            <div className="h-8 w-32" />
          )}
        </div>

        {/* ───────── mobile hamburger ───────── */}
        <div className="lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] hover:text-[#C17829] p-2"
          >
            {isMobileMenuOpen ? (
              <FaTimes size={getIconSize()} />
            ) : (
              <FaBars size={getIconSize()} />
            )}
          </button>
        </div>
      </nav>

      {/* ───────── mobile drawer ───────── */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden flex flex-col">
            {/* Brand */}
            <div className="flex items-center justify-between h-12 px-4 border-b">
              <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2"
              >
                <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
                <span className="text-xl font-bold text-[#C17829] font-serif">
                  LDA
                </span>
              </NavLink>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <FaTimes />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              <NavLink
                to="/"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobileClass(isActive)}
              >
                Home
              </NavLink>

              {authChecked && isAuthenticated && (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => mobileClass(isActive)}
                >
                  Dashboard
                </NavLink>
              )}

              <Link
                to="/#services"
                onClick={handleServicesClick}
                className={
                  activeSection === "services"
                    ? mobileClass(true)
                    : mobileClass(false)
                }
              >
                Services
              </Link>

              <NavLink
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobileClass(isActive)}
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobileClass(isActive)}
              >
                Contact
              </NavLink>

              {!authChecked ? (
                <div className="h-8 w-32" />
              ) : isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 rounded-md text-base text-gray-700 hover:bg-gray-100"
                  >
                    <FaUserCircle className="mr-3" /> Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 rounded-md text-base text-red-600 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="mr-3" /> Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-4 px-4 mt-4">
                  <Button
                    size="md"
                    variant="secondary"
                    className={loginButtonStyle}
                    onClick={handleLoginClick}
                  >
                    <div className="flex items-center space-x-1 justify-center">
                      <LogIn size={16} />
                      <span>Login</span>
                    </div>
                  </Button>
                  <Button
                    size="md"
                    variant="primary"
                    className={registerButtonStyle}
                    onClick={handleRegisterClick}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
