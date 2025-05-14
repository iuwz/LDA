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

  // Fix: Explicitly type the useRef for the profile dropdown element
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isServicesTab =
    location.pathname === "/" && location.hash === "#services";

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

  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      // The check `profileDropdownRef.current` is correctly used here.
      // Typing the ref helps TypeScript understand that profileDropdownRef.current,
      // when not null, is an HTMLDivElement which *does* have the contains method.
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
  }, [isProfileDropdownOpen]); // Depend on isProfileDropdownOpen

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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

  const getIconSize = () => (screenWidth < 350 ? 16 : 20);

  const activeLink = `text-[${ACCENT}] font-semibold border-b-2 border-[${ACCENT}]`;
  const inactiveLink = "hover:text-[#C17829] transition-colors";

  // Assuming these styles are from your original code or defined elsewhere
  const buttonBaseStyle =
    "inline-flex items-center px-8 py-3 rounded-full font-semibold text-lg shadow-lg transition transform";
  const primaryButtonStyle = `${buttonBaseStyle} bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white hover:scale-105`; // Re-added based on the previous request context
  const secondaryButtonStyle = `${buttonBaseStyle} bg-white text-[#2C2C4A] border border-[#C17829] hover:scale-105`; // Re-added based on the previous request context

  return (
    <div>
      <nav className="fixed w-full z-50 bg-white shadow-md flex items-center justify-between p-4">
        <Link to="/" className="flex items-center">
          <FaBalanceScale size={getIconSize()} style={{ color: ACCENT }} />
          <span
            className="font-serif font-bold text-xl ml-2"
            style={{ color: ACCENT }}
          >
            LDA
          </span>
        </Link>

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

        <div className="hidden lg:flex flex-1 justify-end items-center space-x-4 min-w-[150px]">
          {authChecked ? (
            isAuthenticated ? (
              // Assign the ref to the element you want to track clicks outside of
              <div className="relative" ref={profileDropdownRef}>
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
                {/* Applied the button styles from the previous request */}
                <Button
                  size="md"
                  variant="secondary"
                  className={`${secondaryButtonStyle} rounded-full`} // Keep original rounded-full style if needed
                  onClick={handleLoginClick}
                >
                  <div className="flex items-center space-x-1">
                    <LogIn size={16} />
                    <span>Login</span>
                  </div>
                </Button>
                {/* Applied the button styles from the previous request */}
                <Button
                  size="md"
                  variant="primary"
                  className={`${primaryButtonStyle} rounded-full`} // Keep original rounded-full style if needed
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

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 flex flex-col items-center space-y-6">
          <NavLink
            to="/"
            end
            className="text-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </NavLink>

          {authChecked && isAuthenticated && (
            <NavLink
              to="/dashboard"
              className="text-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}

          <Link
            to="/#services"
            className="text-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </Link>

          <NavLink
            to="/about"
            className="text-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className="text-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </NavLink>

          {!authChecked ? (
            <div className="h-8 w-32" />
          ) : isAuthenticated ? (
            <>
              <button
                className="w-full flex items-center justify-center px-3 py-2 rounded-md text-lg hover:bg-gray-100"
                onClick={() => {
                  navigate("/dashboard/profile");
                  setIsMobileMenuOpen(false);
                }}
              >
                <FaUserCircle className="mr-2 text-[#2C2C4A]" size={18} />{" "}
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-3 py-2 rounded-md text-lg font-medium text-red-600 hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-2" size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              {/* Applied the button styles from the previous request */}
              <Button
                size="md"
                variant="secondary"
                className={`${secondaryButtonStyle} rounded-full`} // Keep original rounded-full style if needed
                onClick={handleLoginClick}
              >
                <div className="flex items-center space-x-1">
                  <LogIn size={16} />
                  <span>Login</span>
                </div>
              </Button>
              {/* Applied the button styles from the previous request */}
              <Button
                size="md"
                variant="primary"
                className={`${primaryButtonStyle} rounded-full`} // Keep original rounded-full style if needed
                onClick={handleRegisterClick}
              >
                Register
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
