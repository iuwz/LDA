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

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initials, setInitials] = useState("");
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isServicesTab =
    location.pathname === "/" && location.hash === "#services";

  // Styles for desktop links
  const activeLink = `text-[${ACCENT}] font-semibold border-b-2 border-[${ACCENT}]`;
  const inactiveLink = "hover:text-[#C17829] transition-colors";

  // Styles for mobile links
  const activeMobileLink = `w-full text-left text-lg font-semibold text-[${ACCENT}] border-b-2 border-[${ACCENT}] pb-1`;
  const inactiveMobileLink = `w-full text-left text-lg text-[#2C2C4A] hover:text-[#C17829] pb-1 transition-colors`;

  const getIconSize = () => (screenWidth < 350 ? 16 : 20);

  // Fetch auth state
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

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close profile dropdown on outside click
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Scroll to #services anchor
  useEffect(() => {
    if (location.hash === "#services") {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

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

  return (
    <div className="relative font-sans" ref={profileDropdownRef}>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 flex items-center bg-white px-6 py-3 shadow-md">
        {/* Logo */}
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

        {/* Center Links */}
        <div className="hidden lg:flex flex-1 justify-center space-x-8 text-[#2C2C4A]">
          <NavLink
            to="/"
            end
            className={({ isActive }) => {
              const homeActive = isActive && location.hash === "";
              return `relative px-1 pb-1 ${
                homeActive ? activeLink : inactiveLink
              }`;
            }}
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
              isServicesTab ? activeLink : inactiveLink
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </Link>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
            }
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Profile / Auth Buttons */}
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
                  className="inline-flex items-center justify-center w-[105px] h-[40px] text-[#C17829] rounded-full font-semibold text-lg transition transform hover:bg-gradient-to-r hover:from-[#C17829] hover:to-[#E3A063] hover:text-white"
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
                  className="inline-flex items-center justify-center w-[105px] h-[40px] bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105"
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

        {/* Mobile Hamburger */}
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

      {/* Mobile Side Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={toggleMobileMenu}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col">
            {/* Logo & Close */}
            <div className="flex items-center justify-between h-12 px-6 border-b">
              <NavLink
                to="/"
                end
                className="flex items-center space-x-2"
                onClick={toggleMobileMenu}
              >
                <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
                <span
                  className="text-xl font-serif font-bold"
                  style={{ color: ACCENT }}
                >
                  LDA
                </span>
              </NavLink>
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FaTimes className="text-xl text-[#2C2C4A]" />
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex-1 px-6 py-4 flex flex-col space-y-4">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive && location.hash === ""
                    ? activeMobileLink
                    : inactiveMobileLink
                }
                onClick={toggleMobileMenu}
              >
                Home
              </NavLink>
              {authChecked && isAuthenticated && (
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive ? activeMobileLink : inactiveMobileLink
                  }
                  onClick={toggleMobileMenu}
                >
                  Dashboard
                </NavLink>
              )}
              <NavLink
                to="/#services"
                className={({ isActive }) =>
                  location.hash === "#services"
                    ? activeMobileLink
                    : inactiveMobileLink
                }
                onClick={toggleMobileMenu}
              >
                Services
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive ? activeMobileLink : inactiveMobileLink
                }
                onClick={toggleMobileMenu}
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive ? activeMobileLink : inactiveMobileLink
                }
                onClick={toggleMobileMenu}
              >
                Contact
              </NavLink>
            </div>

            {/* Auth Buttons */}
            <div className="px-6 pb-6 flex flex-col space-y-4">
              {authChecked ? (
                isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        toggleMobileMenu();
                      }}
                      className={inactiveMobileLink}
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className={inactiveMobileLink}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      size="md"
                      variant="secondary"
                      className="w-full"
                      onClick={handleLoginClick}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <LogIn size={16} />
                        <span>Login</span>
                      </div>
                    </Button>
                    <Button
                      size="md"
                      variant="primary"
                      className="w-full"
                      onClick={handleRegisterClick}
                    >
                      Register
                    </Button>
                  </>
                )
              ) : null}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default Navbar;
