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

  const profileDropdownRef = useRef<HTMLDivElement>(null); // Specify type for ref

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

  const buttonBaseStyle =
    "inline-flex items-center px-8 py-3 rounded-full font-semibold text-lg shadow-lg transition transform";
  const primaryButtonStyle = `${buttonBaseStyle} bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white hover:scale-105`;
  const secondaryButtonStyle = `${buttonBaseStyle} bg-white text-[#2C2C4A] border border-[#C17829] hover:scale-105`; // Adjusted hover effect

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
              <div className="relative" ref={profileDropdownRef}>
                {" "}
                {/* Assign ref here */}
                <div
                  onClick={toggleProfileDropdown}
                  className="h-10 w-10 rounded-full bg-[#2C2C4A] text-white flex items-center justify-center cursor-pointer text-lg font-semibold" // Adjusted size and font
                >
                  {initials}
                </div>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-1 z-50">
                    {" "}
                    {/* Added z-index */}
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaUserCircle className="mr-2 text-[#2C2C4A]" size={14} />{" "}
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  size="md"
                  variant="secondary"
                  className={secondaryButtonStyle} // Use the new style
                  onClick={handleLoginClick}
                >
                  <div className="flex items-center space-x-1">
                    <LogIn size={16} />
                    <span>Login</span>
                  </div>
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className={primaryButtonStyle} // Use the new style
                  onClick={handleRegisterClick}
                >
                  Register
                </Button>
              </>
            )
          ) : (
            <div className="h-10 w-48 animate-pulse bg-gray-200 rounded-full" /> // Placeholder for loading state
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
            className="text-xl text-[#2C2C4A] hover:text-[#C17829] transition-colors" // Added hover effect
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </NavLink>

          {authChecked && isAuthenticated && (
            <NavLink
              to="/dashboard"
              className="text-xl text-[#2C2C4A] hover:text-[#C17829] transition-colors" // Added hover effect
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}

          <Link
            to="/#services"
            className="text-xl text-[#2C2C4A] hover:text-[#C17829] transition-colors" // Added hover effect
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </Link>

          <NavLink
            to="/about"
            className="text-xl text-[#2C2C4A] hover:text-[#C17829] transition-colors" // Added hover effect
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className="text-xl text-[#2C2C4A] hover:text-[#C17829] transition-colors" // Added hover effect
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </NavLink>

          {!authChecked ? (
            <div className="h-10 w-32 animate-pulse bg-gray-200 rounded-full mt-6" /> // Placeholder for loading state
          ) : isAuthenticated ? (
            <>
              <button
                className="w-full max-w-xs flex items-center justify-center px-3 py-2 rounded-md text-lg text-[#2C2C4A] hover:bg-gray-100" // Adjusted styling
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
                className="w-full max-w-xs flex items-center justify-center px-3 py-2 rounded-md text-lg font-medium text-red-600 hover:bg-gray-100" // Adjusted styling
              >
                <FaSignOutAlt className="mr-2" size={18} /> Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col space-y-4 mt-6">
              {" "}
              {/* Added container for buttons */}
              <Button
                size="md"
                variant="secondary"
                className={secondaryButtonStyle} // Use the new style
                onClick={handleLoginClick}
              >
                <div className="flex items-center space-x-1">
                  <LogIn size={16} />
                  <span>Login</span>
                </div>
              </Button>
              <Button
                size="md"
                variant="primary"
                className={primaryButtonStyle} // Use the new style
                onClick={handleRegisterClick}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
